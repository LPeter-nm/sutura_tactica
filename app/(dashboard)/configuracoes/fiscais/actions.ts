// app/(dashboard)/configuracoes/fiscais/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ehAdmin } from '@/lib/auth'
import { fiscalSchema, type FiscalFormValues } from '@/lib/validations/fiscal'

export async function criarFiscal(valores: FiscalFormValues) {
  // Mesma checagem que o layout já faz — repetida aqui de propósito.
  // O layout protege a TELA; isso protege a AÇÃO em si, que podia,
  // em tese, ser chamada sem passar pela tela nenhuma.
  if (!(await ehAdmin())) {
    return { erro: 'Acesso restrito ao administrador.' }
  }

  const dados = fiscalSchema.safeParse(valores)
  if (!dados.success) {
    return { erro: 'Dados inválidos. Confira os campos e tente novamente.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('fiscais').insert(dados.data)

  if (error) {
    if (error.code === '23505') {
      return { erro: 'Já existe um fiscal cadastrado com esse nome.' }
    }
    return { erro: 'Não foi possível salvar. Tente novamente.' }
  }

  revalidatePath('/configuracoes/fiscais')
  redirect('/configuracoes/fiscais')
}

export async function atualizarFiscal(id: string, valores: FiscalFormValues) {
  if (!(await ehAdmin())) {
    return { erro: 'Acesso restrito ao administrador.' }
  }

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
  if (!(await ehAdmin())) {
    return { erro: 'Acesso restrito ao administrador.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('fiscais').delete().eq('id', id)

  if (error) {
    return { erro: 'Não foi possível remover o fiscal.' }
  }

  revalidatePath('/configuracoes/fiscais')
}