// app/(dashboard)/configuracoes/usuarios/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { criarClienteAdmin } from '@/lib/supabase/admin'
import { usuarioSchema, type UsuarioFormValues } from '@/lib/validations/usuario'

export async function criarUsuario(valores: UsuarioFormValues) {
  const dados = usuarioSchema.safeParse(valores)
  if (!dados.success) {
    return { erro: 'Dados inválidos. Confira os campos e tente novamente.' }
  }

  const admin = criarClienteAdmin()

  // email_confirm: true faz o usuário já nascer confirmado — ninguém
  // de fora vai clicar num link de confirmação, já que é você mesmo
  // quem está criando a conta pela pessoa.
  const { error } = await admin.auth.admin.createUser({
    email: dados.data.email,
    password: dados.data.senha,
    email_confirm: true,
  })

  if (error) {
    return { erro: `Não foi possível criar o usuário: ${error.message}` }
  }

  revalidatePath('/configuracoes/usuarios')
}

export async function excluirUsuario(id: string) {
  const admin = criarClienteAdmin()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    return { erro: 'Não foi possível remover o usuário.' }
  }

  revalidatePath('/configuracoes/usuarios')
}