// components/costura-detalhes.tsx

import Link from 'next/link'
import { StatusBadge, StatusPagamentoBadge } from '@/components/status-badge'
import type { Costura } from '@/types/costura'
import type { LinhaHistorico } from '@/lib/costuras'
import { formatarDataBR } from '@/lib/datas'

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
        <Campo rotulo="Matrícula" valor={costura.matricula ?? '—'} />
        <Campo rotulo="Prefixo" valor={costura.prefixo ?? '—'} />
        <Campo rotulo="Líder" valor={costura.lider ?? '—'} />
        <Campo rotulo="Supervisor" valor={costura.supervisor ?? '—'} />
        <Campo rotulo="Coordenador" valor={costura.coordenador ?? '—'} />
        <Campo rotulo="Tipo de fardamento" valor={costura.tipo_fardamento} />
        <Campo rotulo="Local de costura" valor={costura.local_costura} />
        <Campo rotulo="Recebido em" valor={formatarDataBR(costura.recebido_em)} />
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

        {costura.quantidade_pagamento != null && (
          <div>
            <dt className="text-xs uppercase text-ink/50">
              Status de pagamento
            </dt>
            <dd className="mt-1">
              <StatusPagamentoBadge status={costura.status_pagamento} />
            </dd>
          </div>
        )}

        {costura.quantidade_pagamento != null && (
          <Campo rotulo="Pago por" valor={costura.pago_por ?? '—'} />
        )}
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
                  {new Date(item.alterado_em).toLocaleString('pt-BR', {
                    timeZone: 'America/Fortaleza',
                  })}
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