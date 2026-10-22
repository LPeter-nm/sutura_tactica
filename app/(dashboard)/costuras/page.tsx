import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/status-badge'
import { AvisoSucesso } from '@/components/aviso-sucesso'
import { STATUS_ENTREGA, type Costura } from '@/types/costura'

const MENSAGENS_SUCESSO: Record<string, string> = {
  criada: 'Costura cadastrada com sucesso.',
  atualizada: 'Costura atualizada com sucesso.',
}

export default async function PaginaCosturas({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; status?: string; sucesso?: string }>
}) {
  const { busca, status, sucesso } = await searchParams
  const supabase = await createClient()

  // Monta a consulta aos poucos: começa com "todas as costuras,
  // ordenadas por prazo" e só adiciona filtros se a pessoa pediu.
  // O RLS que configuramos no banco já garante, por baixo, que só
  // quem está autenticado chega até aqui.
  let consulta = supabase
    .from('costuras')
    .select('*')
    .order('prazo_entrega', { ascending: true })

  if (busca) {
    consulta = consulta.or(
      `eletricista_nome.ilike.%${busca}%,prefixo.ilike.%${busca}%`
    )
  }

  if (status) {
    consulta = consulta.eq('status_entrega', status)
  }

  const { data: costuras } = await consulta.returns<Costura[]>()

  return (
    <div className="space-y-6">
      {sucesso && MENSAGENS_SUCESSO[sucesso] && (
        <AvisoSucesso mensagem={MENSAGENS_SUCESSO[sucesso]} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Costuras</h1>
        <Link
          href="/costuras/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Nova costura
        </Link>
      </div>

      {/* Filtro simples, por GET — sem nenhum JavaScript rodando no
          navegador. A própria URL guarda o filtro ativo, então dá
          pra compartilhar o link já filtrado com outra pessoa. */}
      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por eletricista ou prefixo"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_ENTREGA).map(([valor, { label }]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm text-ink hover:bg-surface"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-ink/50">
            <tr>
              <th className="px-4 py-3">Eletricista</th>
              <th className="px-4 py-3">Prefixo</th>
              <th className="px-4 py-3">Líder/Supervisor</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Dt Costura</th>
              <th className="px-4 py-3">Status</th>
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
                <td className="px-4 py-3 text-ink/70">{costura.prefixo}</td>
                <td className="px-4 py-3 text-ink/70">{costura.lider_supervisor}</td>
                <td className="px-4 py-3 text-ink/70">{costura.quantidade_pagamento?.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'})}</td>
                <td className="px-4 py-3 text-ink/70">
                  {new Date(`${costura.prazo_entrega}T00:00:00`).toLocaleDateString(
                    'pt-BR'
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={costura.status_entrega} />
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
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
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
