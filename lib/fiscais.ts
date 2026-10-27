// lib/fiscais.ts

import { createClient } from '@/lib/supabase/server'

export type Fiscal = {
  id: string
  nome: string
  supervisor: string
  coordenador: string
  created_at: string
  updated_at: string
}

export async function buscarFiscais() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('fiscais').select('*').order('nome')

  // Antes, um erro aqui virava silenciosamente uma lista vazia — e
  // "deu erro" e "está vazio de verdade" pareciam exatamente a
  // mesma coisa na tela. Agora, pelo menos, o erro real aparece no
  // terminal (ou nos logs do Vercel), em vez de desaparecer.
  if (error) {
    console.error('Erro ao buscar fiscais:', error.message)
  }

  return data ?? []
}

export async function buscarFiscal(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fiscais')
    .select('*')
    .eq('id', id)
    .single<Fiscal>()
  return data
}