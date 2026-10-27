// app/(dashboard)/configuracoes/equipe/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fiscalSchema, type FiscalFormValues } from '@/lib/validations/fiscal'

export async function criarFiscal(valores: FiscalFormValues) {
  const dados = fiscalSchema.safeParse(valores)
  if (!dados.success) {
    return { erro: 'Dados inválidos. Confira os campos e tente novamente.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('fiscais').insert(dados.data)

  if (error) {
    // "nome" tem uma trava de unicidade no banco (unique) — esse é o
    // erro mais provável de aparecer aqui, então vale uma mensagem
    // específica pra ele.
    if (error.code === '23505') {
      return { erro: 'Já existe um fiscal cadastrado com esse nome.' }
    }
    return { erro: 'Não foi possível salvar. Tente novamente.' }
  }

  revalidatePath('/configuracoes/fiscais')
  redirect('/configuracoes/fiscais')
}

export async function atualizarFiscal(id: string, valores: FiscalFormValues) {
  const dados = fiscalSchema.safeParse(valores)
  if (!dados.success) {
    return { erro: 'Dados inválidos. Confira os campos e tente novamente.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('fiscais').update(dados.data).eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { erro: 'Já existe um fiscal cadastrado com esse nome.' }
    }
    return { erro: 'Não foi possível atualizar. Tente novamente.' }
  }

  revalidatePath('/configuracoes/fiscais')
  redirect('/configuracoes/fiscais')
}

export async function excluirFiscal(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('fiscais').delete().eq('id', id)

  if (error) {
    return { erro: 'Não foi possível remover o fiscal.' }
  }

  revalidatePath('/configuracoes/fiscais')
}