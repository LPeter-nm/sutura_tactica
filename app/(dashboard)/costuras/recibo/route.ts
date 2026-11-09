// app/(dashboard)/costuras/recibo/route.ts

import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import type { Costura, TipoFardamento } from '@/types/costura'
import { formatarDataBR } from '@/lib/datas'
import { resumoFardamento } from '@/lib/fardamento'
import { logoDplBuffer } from '@/lib/logo-dpl'

type CosturaComItens = Costura & {
  itens_fardamento: { tipo: TipoFardamento; quantidade: number }[]
}

const INK = '#1A1A1A'
const INK_SUAVE = '#5A5A5A'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const coordenador = searchParams.get('coordenador')
  const dataDe = searchParams.get('dataDe') ?? undefined
  const dataAte = searchParams.get('dataAte') ?? undefined

  if (!coordenador) {
    return NextResponse.json(
      { erro: 'Informe o coordenador para gerar o recibo.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  let consulta = supabase
    .from('costuras')
    .select('*, itens_fardamento(tipo, quantidade)')
    .eq('coordenador', coordenador)
    // Só entram costuras com valor definido e ainda pendentes de
    // pagamento — sem preço, ou já pagas, não fazem parte de um
    // recibo de cobrança.
    .not('quantidade_pagamento', 'is', null)
    .eq('status_pagamento', 'pendente')
    .order('recebido_em', { ascending: true })

  if (dataDe) consulta = consulta.gte('recebido_em', dataDe)
  if (dataAte) consulta = consulta.lte('recebido_em', dataAte)

  const { data, error } = await consulta.returns<CosturaComItens[]>()
  if (error) {
    console.error('Erro ao gerar recibo:', error.message)
  }
  const linhas = data ?? []

  // ---- Data em que cada costura ficou "pronto" (ou, na falta
  // dessa etapa, "entregue") ----
  // Uma busca só, cobrindo todas as costuras do recibo de uma vez,
  // em vez de uma consulta por costura dentro do loop — mais rápido,
  // e bem mais simples de ler.
  const mapaPronto = new Map<string, string>()
  const mapaEntregue = new Map<string, string>()

  if (linhas.length > 0) {
    const { data: historico, error: erroHistorico } = await supabase
      .from('costuras_historico_status')
      .select('costura_id, status_novo, alterado_em')
      .in(
        'costura_id',
        linhas.map((c) => c.id)
      )
      .in('status_novo', ['pronto', 'entregue'])
      .order('alterado_em', { ascending: true })

    if (erroHistorico) {
      console.error('Erro ao buscar histórico para o recibo:', erroHistorico.message)
    }

    // Como a busca já vem ordenada do mais antigo pro mais novo, o
    // "!has(...)" garante que cada mapa guarda a PRIMEIRA vez que
    // aquela costura entrou em cada status — não a mais recente.
    for (const linha of historico ?? []) {
      if (linha.status_novo === 'pronto' && !mapaPronto.has(linha.costura_id)) {
        mapaPronto.set(linha.costura_id, linha.alterado_em)
      }
      if (linha.status_novo === 'entregue' && !mapaEntregue.has(linha.costura_id)) {
        mapaEntregue.set(linha.costura_id, linha.alterado_em)
      }
    }
  }

  // "Pronto" tem prioridade; só usa "entregue" quando a costura
  // nunca passou por "pronto" — exatamente o caso das costuras que
  // pularam direto pra entregue.
  function dataDeConclusao(costuraId: string) {
    return mapaPronto.get(costuraId) ?? mapaEntregue.get(costuraId) ?? null
  }

  const margemEsquerda = 40
  const margemInferior = 50
  const larguraTexto = 595.28 - margemEsquerda * 2 // A4 tem 595.28pt de largura

  const doc = new PDFDocument({ size: 'A4', margin: margemEsquerda })
  const pedacos: Buffer[] = []
  doc.on('data', (pedaco) => pedacos.push(pedaco))
  const bufferPronto = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(pedacos)))
  })

  function limiteDaPagina() {
    return doc.page.height - margemInferior
  }

  const formatar = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ---- Logo, na margem ESQUERDA ----
  const larguraLogo = 90
  const alturaLogo = (larguraLogo * 47) / 69
  doc.image(logoDplBuffer(), margemEsquerda, margemEsquerda, {
    width: larguraLogo,
    height: alturaLogo,
  })

  // ---- Título e subtítulo, alinhados à margem DIREITA ----
  doc
    .font('Helvetica')
    .fontSize(16)
    .fillColor(INK)
    .text('Recibo para Pagamento de Costuras', margemEsquerda, margemEsquerda, {
      width: larguraTexto,
      align: 'right',
    })
  doc
    .fontSize(11)
    .fillColor(INK_SUAVE)
    .text('Costuras Realizadas a Pedido do Líder', margemEsquerda, doc.y, {
      width: larguraTexto,
      align: 'right',
    })

  doc.y = Math.max(margemEsquerda + alturaLogo, doc.y) + 20

  // ---- Relação das costuras, em texto corrido ----
  doc
    .fontSize(12)
    .fillColor(INK)
    .text(
      `Especificam-se, a seguir, as costuras de fardamento realizadas para os eletricistas sob a coordenação de `,
      margemEsquerda,
      doc.y,
      { width: larguraTexto, align: 'justify', continued: true }
    )
    .font('Helvetica-Bold')
    .text(`${coordenador}:`)

  let y = doc.y + 12

  let totalPendente = 0

  linhas.forEach((costura, indice) => {
    const valorTexto =
      costura.quantidade_pagamento != null
        ? formatar(costura.quantidade_pagamento)
        : 'valor não informado'

    const nomeLider = costura.lider ?? 'não informado'
    const matriculaTexto = costura.matricula ?? 'não informada'
    const dataConclusao = dataDeConclusao(costura.id)

    // A frase mora AQUI, numa lista só — cada pedaço com seu texto
    // e se ele é negrito ou não. É essa lista que vira tanto o
    // cálculo de altura quanto o desenho de verdade, logo abaixo.
    const segmentos: { texto: string; negrito?: boolean }[] = [
      { texto: `${indice + 1}. ` },
      { texto: costura.eletricista_nome, negrito: true },
      { texto: ', matrícula ' },
      { texto: matriculaTexto, negrito: true },
      { texto: ', sob liderança de ' },
      { texto: nomeLider, negrito: true },
      { texto: ', tendo sido recebido o(s) fardamento(s): ' },
      { texto: resumoFardamento(costura.itens_fardamento ?? []), negrito: true },
      { texto: ', em ' },
      { texto: formatarDataBR(costura.recebido_em), negrito: true },
    ]

    // Só entra essa cláusula se a costura realmente já tiver uma
    // data de conclusão — uma que ainda está "em produção", por
    // exemplo, não tem o que mostrar aqui, e a frase segue sem ela.
    if (dataConclusao) {
      // dataConclusao vem de "alterado_em", que é um instante real
      // (com hora e fuso), não uma data pura como recebido_em — por
      // isso usa new Date(...).toLocaleDateString(...), não
      // formatarDataBR (que só sabe ler "AAAA-MM-DD" puro).
      const dataConclusaoFormatada = new Date(dataConclusao).toLocaleDateString(
        'pt-BR',
        { timeZone: 'America/Fortaleza' }
      )
      segmentos.push(
        { texto: ', estando concluído em ' },
        { texto: `${dataConclusaoFormatada} `, negrito: true }
      )
    }

    segmentos.push(
      { texto: 'e foi atribuído o valor de ' },
      { texto: `${valorTexto} `, negrito: true },
      { texto: 'para a reparação.' }
    )

    const textoPlano = segmentos.map((segmento) => segmento.texto).join('')
    const alturaTexto = doc.heightOfString(textoPlano, { width: larguraTexto }) + 4

    if (y + alturaTexto > limiteDaPagina()) {
      doc.addPage()
      y = margemEsquerda
    }

    // "continued: true" é o que permite trocar de fonte NO MEIO da
    // frase, sem pular pra próxima linha — cada .text() escreve um
    // pedaço e "entrega a caneta" pro próximo, na mesma posição.
    segmentos.forEach((segmento, i) => {
      doc.font(segmento.negrito ? 'Helvetica-Bold' : 'Helvetica')
      const ehUltimo = i === segmentos.length - 1

      if (i === 0) {
        doc.fontSize(11).fillColor(INK).text(segmento.texto, margemEsquerda, y, {
          continued: !ehUltimo,
          width: larguraTexto,
          align: 'justify',
        })
      } else {
        doc.text(segmento.texto, { continued: !ehUltimo })
      }
    })

    y = doc.y + 8

    if (costura.quantidade_pagamento != null) {
      totalPendente += costura.quantidade_pagamento
    }
  })

  if (linhas.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(INK_SUAVE)
      .text(
        'Nenhuma costura pendente de pagamento encontrada para este coordenador e período.',
        margemEsquerda,
        y
      )
    y = doc.y + 12
  }

  // ---- Total pendente ----
  y += 8
  if (y + 100 > limiteDaPagina()) {
    doc.addPage()
    y = margemEsquerda
  }

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor(INK)
    .text('O valor de ', margemEsquerda, y, {
      continued: true,
      width: larguraTexto,
      align: 'justify',
    })
    .font('Helvetica-Bold')
    .text(`${formatar(totalPendente)} `, { continued: true })
    .font('Helvetica')
    .text(
      `refere-se ao valor total a ser pago das costuras de fardamento realizadas para os eletricistas do coordenador `,
      { continued: true }
    )
    .font('Helvetica-Bold')
    .text(`${coordenador}.`)

  // ---- Assinatura, ancorada perto do rodapé da página ----
  const alturaAssinatura = 100
  let yAssinatura = limiteDaPagina() - alturaAssinatura

  if (doc.y > yAssinatura) {
    doc.addPage()
    yAssinatura = limiteDaPagina() - alturaAssinatura
  }

  y = yAssinatura

  const larguraAssinatura = 220
  const xAssinatura = (doc.page.width - larguraAssinatura) / 2

  doc
    .strokeColor(INK)
    .moveTo(xAssinatura, y)
    .lineTo(xAssinatura + larguraAssinatura, y)
    .stroke()
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(INK)
    .text('Assinatura do coordenador', xAssinatura, y + 4, {
      width: larguraAssinatura,
      align: 'center',
    })
  doc.text(coordenador, xAssinatura, y + 18, {
    width: larguraAssinatura,
    align: 'center',
  })

  // ---- Período e "emitido em", depois da assinatura ----
  let yRodape = y + 90
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK)
  if (dataDe || dataAte) {
    doc.text(
      `Período: ${dataDe ? formatarDataBR(dataDe) : 'início'} até ${
        dataAte ? formatarDataBR(dataAte) : 'hoje'
      }`,
      margemEsquerda,
      yRodape,
      { width: larguraTexto, align: 'left' }
    )
    yRodape = doc.y + 2
  }
  doc.text(
    `Emitido em: ${new Date().toLocaleDateString('pt-BR', {
      timeZone: 'America/Fortaleza',
    })}`,
    margemEsquerda,
    yRodape,
    { width: larguraTexto, align: 'left' }
  )

  doc.end()
  const buffer = await bufferPronto

  const nomeArquivo = `recibo-${coordenador
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
    },
  })
}