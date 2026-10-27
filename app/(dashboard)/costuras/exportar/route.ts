// app/(dashboard)/costuras/exportar/route.ts

import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { STATUS_ENTREGA, STATUS_PAGAMENTO, type Costura } from '@/types/costura'
import { formatarDataBR } from '@/lib/datas'

// route.ts não é uma página — é um endpoint puro. Em vez de devolver
// HTML, ele devolve bytes de um arquivo .xlsx de verdade, prontos
// para download. É por isso que a listagem usa uma tag <a> comum
// pra chegar aqui, não um clique que "navega" para uma tela nova.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const busca = searchParams.get('busca') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const statusPagamento = searchParams.get('statusPagamento') ?? undefined
  const dataDe = searchParams.get('dataDe') ?? undefined
  const dataAte = searchParams.get('dataAte') ?? undefined
  const filtroLider = searchParams.get('filtroLider') ?? undefined
  const filtroSupervisor = searchParams.get('filtroSupervisor') ?? undefined
  const filtroCoordenador = searchParams.get('filtroCoordenador') ?? undefined

  const supabase = await createClient()

  // Exatamente a mesma lógica de filtro da listagem — é assim que a
  // exportação sempre bate com o que a pessoa está vendo na tela.
  // Vira uma FUNÇÃO (não uma consulta pronta) porque vamos precisar
  // montá-la de novo a cada página, só trocando o "range" — o
  // Supabase não permite reaproveitar a mesma consulta já disparada.
  function construirConsulta() {
    let consulta = supabase
      .from('costuras')
      .select('*')
      .order('dt_costura', { ascending: true })

    if (busca) {
      consulta = consulta.or(
        `eletricista_nome.ilike.%${busca}%,prefixo.ilike.%${busca}%`
      )
    }
    if (status) consulta = consulta.eq('status_entrega', status)
    if (statusPagamento) {
      consulta = consulta.eq('status_pagamento', statusPagamento)
    }
    if (dataDe) consulta = consulta.gte('dt_costura', dataDe)
    if (dataAte) consulta = consulta.lte('dt_costura', dataAte)
    if (filtroLider) consulta = consulta.eq('lider', filtroLider)
    if (filtroSupervisor) consulta = consulta.eq('supervisor', filtroSupervisor)
    if (filtroCoordenador) {
      consulta = consulta.eq('coordenador', filtroCoordenador)
    }

    return consulta
  }

  // O Supabase devolve, por padrão, no máximo 1000 linhas por
  // consulta — mesmo que existam mais batendo com o filtro, e sem
  // avisar que parou ali. Pra exportação nunca vir cortada, buscamos
  // em "páginas" de 1000, uma atrás da outra, até uma página voltar
  // com menos de 1000 — sinal de que já pegamos tudo.
  const TAMANHO_PAGINA = 1000
  const costuras: Costura[] = []
  let pagina = 0

  while (true) {
    const inicio = pagina * TAMANHO_PAGINA
    const fim = inicio + TAMANHO_PAGINA - 1

    const { data } = await construirConsulta()
      .range(inicio, fim)
      .returns<Costura[]>()

    if (!data || data.length === 0) break

    costuras.push(...data)

    if (data.length < TAMANHO_PAGINA) break
    pagina++
  }

  const livro = new ExcelJS.Workbook()
  const planilha = livro.addWorksheet('Costuras')

  // Cada coluna já nasce com largura e com uma "chave" — é essa
  // chave que addRow() usa pra saber em qual coluna cada valor cai,
  // mais à frente, sem depender da ordem das propriedades do objeto.
  planilha.columns = [
    { header: 'Eletricista', key: 'eletricista', width: 24 },
    { header: 'Prefixo', key: 'prefixo', width: 16 },
    { header: 'Líder', key: 'lider', width: 18 },
    { header: 'Supervisor', key: 'supervisor', width: 18 },
    { header: 'Coordenador', key: 'coordenador', width: 18 },
    { header: 'Dt Costura', key: 'dtCostura', width: 12 },
    { header: 'Tipo de Fardamento', key: 'tipoFardamento', width: 18 },
    { header: 'Local de Costura', key: 'localCostura', width: 18 },
    { header: 'Status de Entrega', key: 'statusEntrega', width: 16 },
    { header: 'Quantidade a Pagar', key: 'quantidadePagamento', width: 16 },
    { header: 'Status de Pagamento', key: 'statusPagamento', width: 18 },
    { header: 'Pago por', key: 'pagoPor', width: 18 },
  ]

  for (const c of costuras) {
    planilha.addRow({
      eletricista: c.eletricista_nome,
      prefixo: c.prefixo ?? '',
      lider: c.lider ?? '',
      supervisor: c.supervisor ?? '',
      coordenador: c.coordenador ?? '',
      dtCostura: formatarDataBR(c.dt_costura),
      tipoFardamento: c.tipo_fardamento,
      localCostura: c.local_costura,
      statusEntrega: STATUS_ENTREGA[c.status_entrega].label,
      quantidadePagamento: c.quantidade_pagamento ?? '',
      statusPagamento: c.status_pagamento
        ? STATUS_PAGAMENTO[c.status_pagamento].label
        : '',
      pagoPor: c.pago_por ?? '',
    })
  }

  // Cabeçalho: negrito, branco, sobre o preto da identidade do
  // sistema — a mesma linguagem visual do resto do projeto.
  const linhaCabecalho = planilha.getRow(1)
  linhaCabecalho.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  linhaCabecalho.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A1A' },
  }
  linhaCabecalho.alignment = { vertical: 'middle' }

  // Bordas em toda célula preenchida, e um leve listrado (zebra) nas
  // linhas pares — o mesmo princípio visual da tabela na tela.
  planilha.eachRow((linha, numero) => {
    linha.eachCell((celula) => {
      celula.border = {
        top: { style: 'thin', color: { argb: 'FFE4E2DF' } },
        left: { style: 'thin', color: { argb: 'FFE4E2DF' } },
        bottom: { style: 'thin', color: { argb: 'FFE4E2DF' } },
        right: { style: 'thin', color: { argb: 'FFE4E2DF' } },
      }
    })
    if (numero > 1 && numero % 2 === 0) {
      linha.eachCell((celula) => {
        celula.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFAFAFA' },
        }
      })
    }
  })

  // Trava a linha do cabeçalho no topo ao rolar, e liga o filtro
  // automático do Excel em cima dela — dá pra ordenar e filtrar a
  // planilha por qualquer coluna, sem precisar selecionar nada.
  planilha.views = [{ state: 'frozen', ySplit: 1 }]
  planilha.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: planilha.columns.length },
  }

  const buffer = await livro.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="costuras.xlsx"',
    },
  })
}