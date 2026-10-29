// lib/eletricistas.ts

import { createClient } from '@/lib/supabase/server'

export type Eletricista = {
  id: string
  nome: string
  matricula: string
  prefixo: string | null
}

export async function buscarEletricistas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eletricistas')
    .select('id, nome, matricula, prefixo')
    .order('nome')

  if (error) {
    console.error('Erro ao buscar eletricistas:', error.message)
  }

  return data ?? []
}