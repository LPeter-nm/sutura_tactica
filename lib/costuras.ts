import { createClient } from '@/lib/supabase/server'
import type { Costura, StatusEntrega } from '@/types/costura'

export async function buscarCostura(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('costuras')
    .select('*')
    .eq('id', id)
    .single<Costura>()

  return data
}

export type LinhaHistorico = {
  status_anterior: StatusEntrega | null
  status_novo: StatusEntrega
  alterado_em: string
}

// Busca os valores que já existem no banco para líder, supervisor e
// coordenador — pra montar selects de filtro com nomes reais, em vez
// de depender de texto livre (que quebra com um acento diferente ou
// uma letra maiúscula a mais).
export async function buscarOpcoesDeFiltro() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('costuras')
    .select('lider, supervisor, coordenador')

  function unicos(chave: 'lider' | 'supervisor' | 'coordenador') {
    const valores = new Set<string>()
    for (const linha of data ?? []) {
      const valor = linha[chave]
      if (valor) valores.add(valor)
    }
    return Array.from(valores).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }

  return {
    lideres: unicos('lider'),
    supervisores: unicos('supervisor'),
    coordenadores: unicos('coordenador'),
  }
}

export async function buscarHistoricoCostura(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('costuras_historico_status')
    .select('status_anterior, status_novo, alterado_em')
    .eq('costura_id', id)
    .order('alterado_em', { ascending: false })
    .returns<LinhaHistorico[]>()

  return data ?? []
}