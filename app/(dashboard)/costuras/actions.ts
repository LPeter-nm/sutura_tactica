// app/(dashboard)/costuras/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { costuraSchema, type CosturaFormValues } from '@/lib/validations/costura'

// Transforma o texto do campo "quantidade_pagamento" (que pode vir
// vazio) no formato que o banco espera: um número, ou null.
function paraNumeroOuNulo(valor?: string) {
  if (!valor) return null
  return Number(valor)
}

// A regra de negócio mora aqui, não no formulário: sem preço, não
// existe status de pagamento (fica null). Com preço, usa o que foi
// enviado — e se nada foi enviado ainda (ex: acabou de ganhar um
// preço agora), começa como "pendente".
function determinarStatusPagamento(
  quantidade: number | null,
  enviado?: string
) {
  if (quantidade === null) return null
  return enviado === 'pago' ? 'pago' : 'pendente'
}

// Mesma lógica: sem preço, "pago por" não existe — vira null, nunca
// uma string vazia perdida no banco.
function determinarPagoPor(quantidade: number | null, enviado?: string) {
  if (quantidade === null) return null
  return enviado?.trim() ? enviado.trim() : null
}

export async function criarCostura(valores: CosturaFormValues) {
  // O formulário já validou isso no navegador — mas o navegador é
  // controlado por quem está do outro lado da tela, não por nós.
  // Validar de novo aqui, no servidor, é o que garante que nenhum
  // dado inválido chega ao banco, não importa de onde a chamada
  // realmente veio.
  const dados = costuraSchema.safeParse(valores)
  if (!dados.success) {
    return { erro: 'Dados inválidos. Confira os campos e tente novamente.' }
  }

  // "itens" não é uma coluna da tabela costuras — fica de fora do
  // insert principal, e vai pra sua própria tabela logo abaixo.
  const { itens, ...dadosCostura } = dados.data
  const quantidade = paraNumeroOuNulo(dadosCostura.quantidade_pagamento)

  const supabase = await createClient()

  const { data: novaCostura, error } = await supabase
    .from('costuras')
    .insert({
      ...dadosCostura,
      quantidade_pagamento: quantidade,
      status_pagamento: determinarStatusPagamento(
        quantidade,
        dadosCostura.status_pagamento
      ),
      pago_por: determinarPagoPor(quantidade, dadosCostura.pago_por),
    })
    .select('id')
    .single()

  if (error || !novaCostura) {
    return { erro: 'Não foi possível salvar. Tente novamente.' }
  }

  const { error: erroItens } = await supabase.from('itens_fardamento').insert(
    itens.map((item) => ({
      costura_id: novaCostura.id,
      tipo: item.tipo,
      quantidade: Number(item.quantidade),
    }))
  )

  if (erroItens) {
    return {
      erro:
        'A costura foi criada, mas os itens de fardamento não puderam ser salvos. Edite a costura para adicioná-los.',
    }
  }

  // Avisa ao Next.js que a lista de costuras mudou, pra ele não
  // mostrar uma versão desatualizada da tabela quando a pessoa
  // chegar na listagem logo em seguida.
  revalidatePath('/costuras')
  redirect('/costuras?sucesso=criada')
}

export async function atualizarCostura(id: string, valores: CosturaFormValues) {
  const dados = costuraSchema.safeParse(valores)
  if (!dados.success) {
    return { erro: 'Dados inválidos. Confira os campos e tente novamente.' }
  }

  const { itens, ...dadosCostura } = dados.data
  const quantidade = paraNumeroOuNulo(dadosCostura.quantidade_pagamento)

  const supabase = await createClient()

  const { error } = await supabase
    .from('costuras')
    .update({
      ...dadosCostura,
      quantidade_pagamento: quantidade,
      status_pagamento: determinarStatusPagamento(
        quantidade,
        dadosCostura.status_pagamento
      ),
      pago_por: determinarPagoPor(quantidade, dadosCostura.pago_por),
    })
    .eq('id', id)

  if (error) {
    return { erro: 'Não foi possível atualizar. Tente novamente.' }
  }

  // Jeito mais simples de "sincronizar" os itens numa edição: apaga
  // todos os que já existiam pra essa costura e insere o conjunto
  // novo inteiro. Não é o mais eficiente possível, mas é direto o
  // bastante pra nunca ficar um item órfão ou duplicado por engano.
  const { error: erroRemover } = await supabase
    .from('itens_fardamento')
    .delete()
    .eq('costura_id', id)

  if (erroRemover) {
    return { erro: 'Não foi possível atualizar os itens de fardamento.' }
  }

  const { error: erroItens } = await supabase.from('itens_fardamento').insert(
    itens.map((item) => ({
      costura_id: id,
      tipo: item.tipo,
      quantidade: Number(item.quantidade),
    }))
  )

  if (erroItens) {
    return { erro: 'Não foi possível salvar os itens de fardamento.' }
  }

  revalidatePath('/costuras')
  redirect('/costuras?sucesso=atualizada')
}

export async function excluirCostura(id: string) {
  const supabase = await createClient()

  // Histórico de status e itens de fardamento somem sozinhos — os
  // dois têm "on delete cascade" apontando pra essa costura, então
  // o Postgres cuida da limpeza por baixo dos panos.
  const { error } = await supabase.from('costuras').delete().eq('id', id)

  if (error) {
    return { erro: 'Não foi possível excluir a costura.' }
  }

  revalidatePath('/costuras')
}

export async function excluirCosturas(ids: string[]) {
  if (ids.length === 0) return

  const supabase = await createClient()
  // .in(...) filtra "o id está nessa lista" — apaga todas de uma
  // vez, numa única instrução, em vez de uma chamada por costura.
  const { error } = await supabase.from('costuras').delete().in('id', ids)

  if (error) {
    return { erro: 'Não foi possível excluir as costuras selecionadas.' }
  }

  revalidatePath('/costuras')
}

// Validação do pagamento em lote. Mesmo princípio do costuraSchema:
// o navegador já checou, mas o servidor checa de novo, porque é ele
// quem de fato escreve no banco.
//  - ids: cada um precisa ser um UUID de verdade (nada de texto
//    qualquer entrando num filtro do banco) e há um teto de 500 por
//    vez, pra uma chamada malformada não varrer a tabela inteira.
//  - pagoPor: nome com tamanho limitado, sem espaços sobrando.
const pagamentoEmLoteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  pagoPor: z.string().trim().min(1).max(100),
  marcarComoPago: z.boolean(),
})

// Registra, de uma vez só, quem pagou várias costuras selecionadas.
//
// Respeita a mesma regra de negócio das actions acima: costura SEM
// valor a pagar (quantidade_pagamento nulo) não tem pagamento, então
// é pulada. O filtro .not('quantidade_pagamento', 'is', null) faz
// isso direto no banco, e o .select('id') devolve só as linhas que
// realmente foram alteradas — a diferença pro total enviado é
// exatamente quantas foram ignoradas.
export async function registrarPagamentoEmLote(
  ids: string[],
  pagoPor: string,
  marcarComoPago: boolean
): Promise<{ erro: string } | { atualizadas: number; ignoradas: number }> {
  const dados = pagamentoEmLoteSchema.safeParse({ ids, pagoPor, marcarComoPago })
  if (!dados.success) {
    return { erro: 'Dados inválidos. Selecione as costuras e informe o nome de quem pagou.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('costuras')
    .update({
      pago_por: dados.data.pagoPor,
      // Só mexe no status de pagamento se a pessoa pediu — senão o
      // campo nem entra no update e continua como estava.
      ...(dados.data.marcarComoPago ? { status_pagamento: 'pago' } : {}),
    })
    .in('id', dados.data.ids)
    .not('quantidade_pagamento', 'is', null)
    .select('id')

  if (error) {
    console.error('Erro ao registrar pagamento em lote:', error.message)
    return { erro: 'Não foi possível registrar o pagamento. Tente novamente.' }
  }

  revalidatePath('/costuras')

  const atualizadas = data?.length ?? 0
  return { atualizadas, ignoradas: dados.data.ids.length - atualizadas }
}