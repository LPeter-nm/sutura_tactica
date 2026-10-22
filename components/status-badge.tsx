import { STATUS_ENTREGA, type StatusEntrega } from '@/types/costura'

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
