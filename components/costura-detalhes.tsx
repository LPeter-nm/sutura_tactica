import Link from 'next/link'
import { StatusBadge } from '@/components/status-badge'
import type { Costura } from '@/types/costura'
import type { LinhaHistorico } from '@/lib/costuras'

export function CosturaDetalhes({
  costura,
  historico,
}: {
  costura: Costura
  historico: LinhaHistorico[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-ink">
          {costura.eletricista_nome}
        </h1>
        <StatusBadge status={costura.status_entrega} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <Campo rotulo="Prefixo" valor={costura.prefixo} />
        <Campo rotulo="Líder" valor={costura.lider_supervisor} />
        <Campo rotulo="Tipo de fardamento" valor={costura.tipo_fardamento} />
        <Campo rotulo="Local de costura" valor={costura.local_costura} />
        <Campo
          rotulo="Prazo de entrega"
          valor={new Date(
            `${costura.prazo_entrega}T00:00:00`
          ).toLocaleDateString('pt-BR')}
        />
        <Campo
          rotulo="Quantidade a pagar"
          valor={
            costura.quantidade_pagamento != null
              ? costura.quantidade_pagamento.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'
          }
        />
      </dl>

      {historico.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">
            Histórico de status
          </h2>
          <ul className="space-y-2">
            {historico.map((item, indice) => (
              <li
                key={indice}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                {item.status_anterior && (
                  <>
                    <StatusBadge status={item.status_anterior} />
                    <span className="text-ink/40">→</span>
                  </>
                )}
                <StatusBadge status={item.status_novo} />
                <span className="text-xs text-ink/50">
                  {new Date(item.alterado_em).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/costuras/${costura.id}/editar`}
        className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Editar
      </Link>
    </div>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-ink/50">{rotulo}</dt>
      <dd className="text-ink">{valor}</dd>
    </div>
  )
}
