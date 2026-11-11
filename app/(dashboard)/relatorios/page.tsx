// app/(dashboard)/relatorios/page.tsx

import { Suspense } from 'react'
import Link from 'next/link'
import { buscarDadosRelatorios } from '@/lib/relatorios'
import { buscarOpcoesDeFiltro } from '@/lib/costuras'
import { PainelRelatorios } from '@/components/relatorios/painel-relatorios'
import { BuscaAutomatica } from '@/components/busca-automatica'
import { CampoFiltro, estiloFiltro } from '@/components/campo-filtro'
import { STATUS_ENTREGA, STATUS_PAGAMENTO } from '@/types/costura'
import { POLOS, BASES, PROCESSOS_EQUIPE } from '@/lib/organizacao'
import { periodoHoje, periodoEstaSemana, periodoEsteMes } from '@/lib/datas'

export default async function PaginaRelatorios({
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
  }>
}) {
  const filtros = await searchParams

  const [dados, { lideres, supervisores, coordenadores }] = await Promise.all([
    buscarDadosRelatorios(filtros),
    buscarOpcoesDeFiltro(),
  ])

  // Mesma ideia de app/(dashboard)/costuras/page.tsx: monta um link
  // pra esta mesma página, trocando só os parâmetros passados aqui e
  // preservando os demais — é o que os atalhos de período usam.
  function linkComFiltros(sobrescrever: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const atuais = { ...filtros, ...sobrescrever }
    for (const [chave, valor] of Object.entries(atuais)) {
      if (valor) params.set(chave, valor)
    }
    const query = params.toString()
    return `/relatorios${query ? `?${query}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Relatórios</h1>
        <p className="text-sm text-ink/60">
          Clique numa barra pra filtrar os outros gráficos por ela. Clique de
          novo pra desmarcar.
        </p>
      </div>

      {/* Mesmo filtro, mesmos campos, mesmo comportamento da
          listagem de costuras — só que apontando pra /relatorios em
          vez de /costuras. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <CampoFiltro label="Busca">
          <Suspense fallback={<input className={estiloFiltro} disabled />}>
            <BuscaAutomatica valorInicial={filtros.busca} />
          </Suspense>
        </CampoFiltro>

        <CampoFiltro label="Status de entrega">
          <select
            name="status"
            defaultValue={filtros.status ?? ''}
            className={estiloFiltro}
          >
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
            defaultValue={filtros.statusPagamento ?? ''}
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
            defaultValue={filtros.filtroLider ?? ''}
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
            defaultValue={filtros.filtroSupervisor ?? ''}
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
            defaultValue={filtros.filtroCoordenador ?? ''}
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
            defaultValue={filtros.filtroPolo ?? ''}
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
            defaultValue={filtros.filtroBase ?? ''}
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
            defaultValue={filtros.filtroProcesso ?? ''}
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
            defaultValue={filtros.dataDe}
            className={estiloFiltro}
          />
        </CampoFiltro>

        <CampoFiltro label="Até">
          <input
            type="date"
            name="dataAte"
            defaultValue={filtros.dataAte}
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
        <Link
          href={linkComFiltros({ dataDe: undefined, dataAte: undefined })}
          className="rounded-full border border-border px-3 py-1 text-ink/70 hover:bg-surface"
        >
          Limpar período
        </Link>
      </div>

      <PainelRelatorios dados={dados} />
    </div>
  )
}