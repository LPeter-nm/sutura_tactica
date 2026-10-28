// lib/auth.ts

import { createClient } from '@/lib/supabase/server'

// "admin" mora em app_metadata, não em user_metadata — essa é a
// diferença que importa aqui. user_metadata pode ser alterado pela
// própria pessoa (ex: ao editar o perfil); app_metadata só pode ser
// escrito por quem tem a service_role key. Guardar o papel de admin
// em user_metadata seria como trancar a porta e deixar a chave
// embaixo do tapete.
export async function ehAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.app_metadata?.role === 'admin'
}