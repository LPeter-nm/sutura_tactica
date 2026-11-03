// lib/fardamento.ts

import { TIPO_FARDAMENTO_LABEL, type ItemFardamento } from '@/types/costura'

const PLURAL: Record<string, string> = {
  Camisa: 'camisas',
  Calça: 'calças',
}

function formatarItem(item: Pick<ItemFardamento, 'tipo' | 'quantidade'>) {
  const rotulo = TIPO_FARDAMENTO_LABEL[item.tipo]
  const palavra = item.quantidade === 1 ? rotulo.toLowerCase() : PLURAL[rotulo]
  return `${item.quantidade} ${palavra}`
}

// Transforma a lista em algo como "2 calças e 1 camisa" — com "e"
// antes do último item, vírgula entre os demais, do jeito que
// alguém escreveria isso à mão.
export function resumoFardamento(
  itens: Pick<ItemFardamento, 'tipo' | 'quantidade'>[]
) {
  if (itens.length === 0) return '—'

  const partes = itens.map(formatarItem)
  if (partes.length === 1) return partes[0]

  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
}