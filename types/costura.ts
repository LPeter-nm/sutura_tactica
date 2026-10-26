// types/costura.ts

// Lista única dos status possíveis — o "as const" faz o TypeScript
// entender isso como quatro valores fixos, não como "qualquer texto".
// É o espelho, no TypeScript, do enum que já existe lá no Postgres.
export const STATUS_VALUES = [
  'pendente',
  'em_producao',
  'pronto',
  'entregue',
] as const

export type StatusEntrega = (typeof STATUS_VALUES)[number]

// Rótulo em português e cor do selo de cada status. Ficar tudo num
// lugar só evita que, um dia, a listagem mostre uma cor e o
// formulário mostre outra pro mesmo status.
export const STATUS_ENTREGA: Record<
  StatusEntrega,
  { label: string; badge: string }
> = {
  pendente: {
    label: 'Pendente',
    badge: 'bg-primary-light text-primary-dark',
  },
  em_producao: {
    label: 'Em produção',
    badge: 'bg-secondary-light text-secondary-dark',
  },
  pronto: {
    label: 'Pronto',
    badge: 'border border-border bg-card text-ink',
  },
  entregue: {
    label: 'Entregue',
    badge: 'bg-secondary text-white',
  },
}

// O mesmo princípio do status de entrega, mas para o pagamento —
// um segundo eixo de status, independente do primeiro.
export const STATUS_VALUES_PAGAMENTO = ['pendente', 'pago'] as const
export type StatusPagamento = (typeof STATUS_VALUES_PAGAMENTO)[number]

export const STATUS_PAGAMENTO: Record<
  StatusPagamento,
  { label: string; badge: string }
> = {
  pendente: {
    label: 'Pendente de pagamento',
    badge: 'bg-primary-light text-primary-dark',
  },
  pago: {
    label: 'Pago',
    badge: 'bg-secondary text-white',
  },
}

// O formato de uma linha da tabela "costuras", exatamente como ela
// volta do Supabase.
export type Costura = {
  id: string
  eletricista_nome: string
  prefixo: string
  lider_supervisor: string
  quantidade_pagamento: number | null
  tipo_fardamento: string
  local_costura: string
  prazo_entrega: string
  status_entrega: StatusEntrega
  // null quando não há preço definido — o campo "não se aplica"
  status_pagamento: StatusPagamento | null
  created_at: string
  updated_at: string
}