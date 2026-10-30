// lib/eletricistas.ts

import { createClient } from '@/lib/supabase/server'

export type Eletricista = {
  id: string
  nome: string
  matricula: string
  prefixo: string | null
  // null em "lider" acontece quando a planilha original não tinha
  // uma pessoa de verdade ali, só um rótulo genérico de equipe — os
  // outros cinco são sempre preenchidos, para quem está ativo.
  lider: string | null
  supervisor: string | null
  coordenador: string | null
  polo: string | null
  base: string | null
  processo_equipe: string | null
}

export async function buscarEletricistas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eletricistas')
    .select(
      'id, nome, matricula, prefixo, lider, supervisor, coordenador, polo, base, processo_equipe'
    )
    .order('nome')

  if (error) {
    console.error('Erro ao buscar eletricistas:', error.message)
  }

  return data ?? []
}