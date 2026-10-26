// components/status-badge.tsx

import {
  STATUS_ENTREGA,
  STATUS_PAGAMENTO,
  type StatusEntrega,
  type StatusPagamento,
} from '@/types/costura'

export function StatusBadge({ status }: { status: StatusEntrega }) {
  const { label, badge } = STATUS_ENTREGA[status]

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
    >
      {label}
    </span>
  )
}

// status chega null quando a costura não tem preço definido — nesse
// caso, não existe "pago" nem "pendente" que façam sentido, então o
// selo simplesmente não aparece.
export function StatusPagamentoBadge({
  status,
}: {
  status: StatusPagamento | null
}) {
  if (!status) {
    return <span className="text-xs text-ink/40">—</span>
  }

  const { label, badge } = STATUS_PAGAMENTO[status]

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
    >
      {label}
    </span>
  )
}