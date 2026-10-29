// app/(dashboard)/costuras/page.tsx

import { Suspense } from 'react'
import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buscarOpcoesDeFiltro } from '@/lib/costuras'
import { StatusBadge, StatusPagamentoBadge } from '@/components/status-badge'
import { AvisoSucesso } from '@/components/aviso-sucesso'
import { BuscaAutomatica } from '@/components/busca-automatica'
import { STATUS_ENTREGA, STATUS_PAGAMENTO, type Costura } from '@/types/costura'
import {
  formatarDataBR,
  periodoHoje,
  periodoEstaSemana,
  periodoEsteMes,
} from '@/lib/datas'

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
    })) {
      if (valor) params.set(chave, valor)
    }
    const query = params.toString()
    return `/costuras/exportar${query ? `?${query}` : ''}`
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

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-ink/50">
            <tr>
              <th className="px-4 py-3">Eletricista</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Prefixo</th>
              <th className="px-4 py-3">Líder</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Coordenador</th>
              <th className="px-4 py-3">Recebido em</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Pago por</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {costuras?.map((costura) => (
              <tr
                key={costura.id}
                className="border-b border-border last:border-0 hover:bg-surface"
              >
                <td className="px-4 py-3 text-ink">{costura.eletricista_nome}</td>
                <td className="px-4 py-3 text-ink/70">{costura.matricula ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">{costura.prefixo ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">{costura.lider ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">
                  {costura.supervisor ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {costura.coordenador ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {formatarDataBR(costura.recebido_em)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={costura.status_entrega} />
                </td>
                <td className="px-4 py-3">
                  <StatusPagamentoBadge status={costura.status_pagamento} />
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {costura.pago_por ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/costuras/${costura.id}`}
                      aria-label="Ver detalhes"
                      className="text-ink/50 hover:text-secondary"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/costuras/${costura.id}/editar`}
                      aria-label="Editar"
                      className="text-ink/50 hover:text-primary"
                    >
                      <Pencil size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {costuras?.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-ink/50">
                  Nenhuma costura encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

const estiloFiltro =
  'rounded-md border border-border bg-card px-3 py-2 text-sm text-ink'

// O nome do filtro aparece em cima do campo, em vez de só dentro da
// opção vazia do select (que ficava um "Todo líder", "Todo
// supervisor"... repetitivo e meio estranho de ler). Cada campo via
// CampoFiltro mostra o rótulo certo, com "Todos" sozinho dentro do
// select.
function CampoFiltro({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink/60">
      {label}
      {children}
    </label>
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