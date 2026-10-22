'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { costuraSchema, type CosturaFormValues } from '@/lib/validations/costura'

// Transforma o texto do campo "quantidade_pagamento" (que pode vir
// vazio) no formato que o banco espera: um número, ou null.
function paraNumeroOuNulo(valor?: string) {
  if (!valor) return null
  return Number(valor)
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

  const supabase = await createClient()
  const { error } = await supabase.from('costuras').insert({
    ...dados.data,
    quantidade_pagamento: paraNumeroOuNulo(dados.data.quantidade_pagamento),
  })

  if (error) {
    return { erro: 'Não foi possível salvar. Tente novamente.' }
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

  const supabase = await createClient()
  const { error } = await supabase
    .from('costuras')
    .update({
      ...dados.data,
      quantidade_pagamento: paraNumeroOuNulo(dados.data.quantidade_pagamento),
    })
    .eq('id', id)

  if (error) {
    return { erro: 'Não foi possível atualizar. Tente novamente.' }
  }

  revalidatePath('/costuras')
  redirect('/costuras?sucesso=atualizada')
}
