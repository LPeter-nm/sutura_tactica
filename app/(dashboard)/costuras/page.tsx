// app/(dashboard)/costuras/page.tsx

import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buscarOpcoesDeFiltro } from '@/lib/costuras'
import { StatusBadge, StatusPagamentoBadge } from '@/components/status-badge'
import { AvisoSucesso } from '@/components/aviso-sucesso'
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
    sucesso,
  } = await searchParams
  const supabase = await createClient()

  // Monta a consulta aos poucos: começa com "todas as costuras,
  // ordenadas por prazo" e só adiciona filtros se a pessoa pediu.
  // O RLS que configuramos no banco já garante, por baixo, que só
  // quem está autenticado chega até aqui.
  let consulta = supabase
    .from('costuras')
    .select('*')
    .order('dt_costura', { ascending: true })

  if (busca) {
    consulta = consulta.or(
      `eletricista_nome.ilike.%${busca}%,prefixo.ilike.%${busca}%`
    )
  }

  if (status) {
    consulta = consulta.eq('status_entrega', status)
  }

  if (statusPagamento) {
    consulta = consulta.eq('status_pagamento', statusPagamento)
  }

  // dt_costura é texto no formato AAAA-MM-DD — comparar como string
  // funciona perfeitamente aqui, porque esse formato já nasce em
  // ordem cronológica quando comparado letra por letra.
  if (dataDe) {
    consulta = consulta.gte('dt_costura', dataDe)
  }
  if (dataAte) {
    consulta = consulta.lte('dt_costura', dataAte)
  }

  // ilike é "contém esse texto, sem diferenciar maiúsculas" — cada
  // um desses três filtra sua própria coluna, de forma independente
  // dos outros dois.
  if (filtroLider) {
    consulta = consulta.eq('lider', filtroLider)
  }
  if (filtroSupervisor) {
    consulta = consulta.eq('supervisor', filtroSupervisor)
  }
  if (filtroCoordenador) {
    consulta = consulta.eq('coordenador', filtroCoordenador)
  }

  // As duas buscas não dependem uma da outra, então rodam ao mesmo
  // tempo com Promise.all — mais rápido do que esperar uma terminar
  // pra só então começar a outra.
  const [{ data: costuras }, { lideres, supervisores, coordenadores }] =
    await Promise.all([consulta.returns<Costura[]>(), buscarOpcoesDeFiltro()])

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

  // Soma em cima dos próprios resultados já filtrados pela consulta
  // acima — não é uma segunda busca no banco, só uma conta em cima
  // do que já veio. Por isso ela "respeita" busca e status sozinha,
  // sem precisar de nenhuma lógica extra de filtro aqui.
  const resumoPagamento = (costuras ?? []).reduce(
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
          <input
            type="text"
            name="busca"
            defaultValue={busca}
            placeholder="Eletricista ou prefixo"
            className={estiloFiltro}
          />
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
              <th className="px-4 py-3">Prefixo</th>
              <th className="px-4 py-3">Líder</th>
              <th className="px-4 py-3">Dt Recebimento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Pago por</th>
              <th className="px-4 py-3">Valor</th>
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
                <td className="px-4 py-3 text-ink/70">{costura.prefixo ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">{costura.lider ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">
                  {formatarDataBR(costura.dt_costura)}
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
                <td className="px-4 py-3 text-ink/70">
                  {costura.quantidade_pagamento?.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'}) ?? '—'}
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
                <td colSpan={10} className="px-4 py-6 text-center text-ink/50">
                  Nenhuma costura encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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