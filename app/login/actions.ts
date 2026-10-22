'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// "use server" no topo do arquivo diz ao Next.js: tudo aqui roda
// SOMENTE no servidor, nunca no navegador da pessoa. É assim que
// a senha digitada no formulário de login chega até o Supabase
// sem nunca passar por uma chamada de API exposta no front-end —
// o próprio framework cuida dessa parte por baixo dos panos.
export async function entrar(formData: FormData) {
  const email = formData.get('email') as string
  const senha = formData.get('senha') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  })

  if (error) {
    // Repare: a mensagem não diz "email não encontrado" nem
    // "senha incorreta" separadamente. Isso é proposital — dar
    // essa distinção pra quem está tentando entrar é um jeito
    // fácil de alguém descobrir, por tentativa e erro, quais
    // e-mails existem cadastrados no sistema.
    redirect('/login?erro=credenciais_invalidas')
  }

  redirect('/costuras')
}

export async function sair() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
