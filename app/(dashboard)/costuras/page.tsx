// app/(dashboard)/costuras/page.tsx

import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buscarOpcoesDeFiltro } from '@/lib/costuras'
import { AvisoSucesso } from '@/components/aviso-sucesso'
import { BuscaAutomatica } from '@/components/busca-automatica'
import { TabelaCosturas } from '@/components/tabela-costuras'
import { CampoFiltro, estiloFiltro } from '@/components/campo-filtro'
import { STATUS_ENTREGA, STATUS_PAGAMENTO, type Costura } from '@/types/costura'
import { POLOS, BASES, PROCESSOS_EQUIPE } from '@/lib/organizacao'
import { periodoHoje, periodoEstaSemana, periodoEsteMes } from '@/lib/datas'

const MENSAGENS_SUCESSO: Record<string, string> = {
  criada: 'Costura cadastrada com sucesso.',
  atualizada: 'Costura atualizada com sucesso.',
}

export default async function PaginaCosturas({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string
    status?: string
    statusPagamento?: string
    dataDe?: string
    dataAte?: string
    filtroLider?: string
    filtroSupervisor?: string
    filtroCoordenador?: string
    filtroPolo?: string
    filtroBase?: string
    filtroProcesso?: string
    pagina?: string
    sucesso?: string
  }>
}) {
  const {
    busca,
    status,
    statusPagamento,
    dataDe,
    dataAte,
    filtroLider,
    filtroSupervisor,
    filtroCoordenador,
    filtroPolo,
    filtroBase,
    filtroProcesso,
    pagina,
    sucesso,
  } = await searchParams
  const supabase = await createClient()

  const TAMANHO_PAGINA = 25
  const paginaAtual = Math.max(1, Number(pagina) || 1)

  // Os mesmos filtros são usados em DUAS consultas diferentes — a da
  // tabela (paginada) e a da soma (sempre olhando pro filtro inteiro,
  // nunca só pra página visível). Em vez de repetir a lógica duas
  // vezes, ela mora aqui, parametrizada pelas colunas que cada
  // consulta realmente precisa.
  function construirConsulta(colunas: string, opcoes?: { count?: 'exact' }) {
    let consulta = supabase.from('costuras').select(colunas, opcoes)

    if (busca) {
      consulta = consulta.or(
        `eletricista_nome.ilike.%${busca}%,prefixo.ilike.%${busca}%`
      )
    }
    if (status) consulta = consulta.eq('status_entrega', status)
    if (statusPagamento) {
      consulta = consulta.eq('status_pagamento', statusPagamento)
    }
    // recebido_em é texto no formato AAAA-MM-DD — comparar como string
    // funciona perfeitamente aqui, porque esse formato já nasce em
    // ordem cronológica quando comparado letra por letra.
    if (dataDe) consulta = consulta.gte('recebido_em', dataDe)
    if (dataAte) consulta = consulta.lte('recebido_em', dataAte)
    if (filtroLider) consulta = consulta.eq('lider', filtroLider)
    if (filtroSupervisor) consulta = consulta.eq('supervisor', filtroSupervisor)
    if (filtroCoordenador) {
      consulta = consulta.eq('coordenador', filtroCoordenador)
    }
    if (filtroPolo) consulta = consulta.eq('polo', filtroPolo)
    if (filtroBase) consulta = consulta.eq('base', filtroBase)
    if (filtroProcesso) {
      consulta = consulta.eq('processo_equipe', filtroProcesso)
    }

    return consulta
  }

  const inicio = (paginaAtual - 1) * TAMANHO_PAGINA
  const fim = inicio + TAMANHO_PAGINA - 1

  // Três buscas independentes, rodando ao mesmo tempo: a página da
  // tabela (com count: 'exact', que pede ao Postgres o total de
  // linhas que batem com o filtro, não só as 25 desta página), a
  // soma de pagamentos (colunas enxutas, sem paginação — precisa ver
  // TUDO que bate com o filtro pra somar certo) e as opções de
  // filtro.
  const [respostaTabela, respostaResumo, { lideres, supervisores, coordenadores }] =
    await Promise.all([
      construirConsulta('*', { count: 'exact' })
        .order('recebido_em', { ascending: true })
        .range(inicio, fim)
        .returns<Costura[]>(),
      construirConsulta('quantidade_pagamento, status_pagamento').returns<
        Pick<Costura, 'quantidade_pagamento' | 'status_pagamento'>[]
      >(),
      buscarOpcoesDeFiltro(),
    ])

  // Mesmo princípio de lib/fiscais.ts e lib/eletricistas.ts: um erro
  // aqui (coluna renomeada no código mas não no banco, por exemplo)
  // não pode mais virar silenciosamente "nenhuma costura encontrada"
  // — agora ele aparece no terminal, com a mensagem real do Postgres.
  if (respostaTabela.error) {
    console.error('Erro ao buscar costuras:', respostaTabela.error.message)
  }
  if (respostaResumo.error) {
    console.error('Erro ao buscar resumo de pagamentos:', respostaResumo.error.message)
  }

  const costuras = respostaTabela.data
  const totalFiltrado = respostaTabela.count ?? 0
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / TAMANHO_PAGINA))

  // Monta os links de filtro rápido e o link de exportação sempre
  // preservando os OUTROS filtros já ativos — só troca o pedaço que
  // cada botão realmente controla.
  function linkComFiltros(sobrescrever: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const atuais = {
      busca,
      status,
      statusPagamento,
      dataDe,
      dataAte,
      filtroLider,
      filtroSupervisor,
      filtroCoordenador,
      filtroPolo,
      filtroBase,
      filtroProcesso,
      ...sobrescrever,
    }
    for (const [chave, valor] of Object.entries(atuais)) {
      if (valor) params.set(chave, valor)
    }
    return `/costuras?${params.toString()}`
  }

  const linkExportar = (() => {
    const params = new URLSearchParams()
    for (const [chave, valor] of Object.entries({
      busca,
      status,
      statusPagamento,
      dataDe,
      dataAte,
      filtroLider,
      filtroSupervisor,
      filtroCoordenador,
      filtroPolo,
      filtroBase,
      filtroProcesso,
    })) {
      if (valor) params.set(chave, valor)
    }
    const query = params.toString()
    return `/costuras/exportar${query ? `?${query}` : ''}`
  })()

  // Só existe sentido em gerar um recibo quando dá pra saber de QUEM
  // é o recibo — por isso ele só aparece com o filtro de coordenador
  // ativo. O período (De/Até), se estiver preenchido, viaja junto.
  const linkRecibo = (() => {
    if (!filtroCoordenador) return null
    const params = new URLSearchParams({ coordenador: filtroCoordenador })
    if (dataDe) params.set('dataDe', dataDe)
    if (dataAte) params.set('dataAte', dataAte)
    return `/costuras/recibo?${params.toString()}`
  })()

  // Soma em cima de TODAS as costuras que batem com o filtro — nunca
  // só as 25 da página visível. É por isso que ela usa
  // respostaResumo.data (sem paginação), não "costuras" (que é só a
  // página atual da tabela).
  const resumoPagamento = (respostaResumo.data ?? []).reduce(
    (acumulado, c) => {
      if (c.quantidade_pagamento == null) return acumulado
      acumulado.total += c.quantidade_pagamento
      if (c.status_pagamento === 'pago') {
        acumulado.pago += c.quantidade_pagamento
      } else {
        acumulado.pendente += c.quantidade_pagamento
      }
      return acumulado
    },
    { total: 0, pago: 0, pendente: 0 }
  )

  return (
    <div className="space-y-6">
      {sucesso && MENSAGENS_SUCESSO[sucesso] && (
        <AvisoSucesso mensagem={MENSAGENS_SUCESSO[sucesso]} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Costuras</h1>
        <div className="flex gap-3">
          <a
            href={linkExportar}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-ink hover:bg-surface"
          >
            Exportar Excel
          </a>
          {linkRecibo && (
            <a
              href={linkRecibo}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm text-ink hover:bg-surface"
            >
              Gerar recibo
            </a>
          )}
          <Link
            href="/costuras/novo"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Nova costura
          </Link>
        </div>
      </div>

      {/* Filtro simples, por GET — sem nenhum JavaScript rodando no
          navegador. A própria URL guarda o filtro ativo, então dá
          pra compartilhar o link já filtrado com outra pessoa. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <CampoFiltro label="Busca">
          {/* O fallback só aparece numa fração de segundo, na
              primeiríssima renderização — na prática, invisível. */}
          <Suspense fallback={<input className={estiloFiltro} disabled />}>
            <BuscaAutomatica valorInicial={busca} />
          </Suspense>
        </CampoFiltro>

        <CampoFiltro label="Status de entrega">
          <select name="status" defaultValue={status ?? ''} className={estiloFiltro}>
            <option value="">Todos</option>
            {Object.entries(STATUS_ENTREGA).map(([valor, { label }]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Status de pagamento">
          <select
            name="statusPagamento"
            defaultValue={statusPagamento ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_PAGAMENTO).map(([valor, { label }]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Líder">
          <select
            name="filtroLider"
            defaultValue={filtroLider ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {lideres.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Supervisor">
          <select
            name="filtroSupervisor"
            defaultValue={filtroSupervisor ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {supervisores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Coordenador">
          <select
            name="filtroCoordenador"
            defaultValue={filtroCoordenador ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {coordenadores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Polo">
          <select
            name="filtroPolo"
            defaultValue={filtroPolo ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {POLOS.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Base">
          <select
            name="filtroBase"
            defaultValue={filtroBase ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {BASES.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="Processo da equipe">
          <select
            name="filtroProcesso"
            defaultValue={filtroProcesso ?? ''}
            className={estiloFiltro}
          >
            <option value="">Todos</option>
            {PROCESSOS_EQUIPE.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </CampoFiltro>

        <CampoFiltro label="De">
          <input
            type="date"
            name="dataDe"
            defaultValue={dataDe}
            className={estiloFiltro}
          />
        </CampoFiltro>

        <CampoFiltro label="Até">
          <input
            type="date"
            name="dataAte"
            defaultValue={dataAte}
            className={estiloFiltro}
          />
        </CampoFiltro>

        <button
          type="submit"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm text-ink hover:bg-surface"
        >
          Filtrar
        </button>
      </form>

      {/* Atalhos de período — cada um já é um link pronto, calculado
          no servidor, preservando os demais filtros ativos. */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink/50">Período:</span>
        <Link
          href={linkComFiltros({
            dataDe: periodoHoje().de,
            dataAte: periodoHoje().ate,
          })}
          className="rounded-full border border-border px-3 py-1 text-ink/70 hover:bg-surface"
        >
          Hoje
        </Link>
        <Link
          href={linkComFiltros({
            dataDe: periodoEstaSemana().de,
            dataAte: periodoEstaSemana().ate,
          })}
          className="rounded-full border border-border px-3 py-1 text-ink/70 hover:bg-surface"
        >
          Esta semana
        </Link>
        <Link
          href={linkComFiltros({
            dataDe: periodoEsteMes().de,
            dataAte: periodoEsteMes().ate,
          })}
          className="rounded-full border border-border px-3 py-1 text-ink/70 hover:bg-surface"
        >
          Este mês
        </Link>
        {(dataDe || dataAte) && (
          <Link
            href={linkComFiltros({ dataDe: undefined, dataAte: undefined })}
            className="rounded-full px-3 py-1 text-primary hover:underline"
          >
            Limpar período
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <CartaoResumo label="Total (filtro atual)" valor={resumoPagamento.total} />
        <CartaoResumo
          label="Recebido"
          valor={resumoPagamento.pago}
          cor="text-secondary"
        />
        <CartaoResumo
          label="A receber"
          valor={resumoPagamento.pendente}
          cor="text-primary"
        />
      </div>

      <TabelaCosturas costuras={costuras ?? []} />

      <div className="flex items-center justify-between text-sm text-ink/60">
        <span>
          Página {paginaAtual} de {totalPaginas} — {totalFiltrado}{' '}
          {totalFiltrado === 1 ? 'costura' : 'costuras'}
        </span>
        <div className="flex gap-2">
          <LinkPagina
            href={linkComFiltros({ pagina: String(paginaAtual - 1) })}
            desabilitado={paginaAtual <= 1}
          >
            Anterior
          </LinkPagina>
          <LinkPagina
            href={linkComFiltros({ pagina: String(paginaAtual + 1) })}
            desabilitado={paginaAtual >= totalPaginas}
          >
            Próxima
          </LinkPagina>
        </div>
      </div>
    </div>
  )
}

// Um link comum, só que capaz de se desenhar "desabilitado" quando
// já não existe página anterior/seguinte. Não é um <button> de
// propósito — continua sendo um link de verdade, que funciona sem
// JavaScript nenhum, igual todo o resto desse sistema de filtros.
function LinkPagina({
  href,
  desabilitado,
  children,
}: {
  href: string
  desabilitado: boolean
  children: React.ReactNode
}) {
  if (desabilitado) {
    return (
      <span className="rounded-md border border-border px-3 py-1.5 text-ink/30">
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className="rounded-md border border-border px-3 py-1.5 text-ink/70 hover:bg-surface"
    >
      {children}
    </Link>
  )
}

// Só é usado nesta página, então fica aqui mesmo, sem virar um
// arquivo em components/ — não vale a indireção para algo tão
// pequeno e tão específico desta tela.
function CartaoResumo({
  label,
  valor,
  cor = 'text-ink',
}: {
  label: string
  valor: number
  cor?: string
}) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-2">
      <p className="text-xs uppercase text-ink/50">{label}</p>
      <p className={`text-sm font-semibold ${cor}`}>
        {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  )
}