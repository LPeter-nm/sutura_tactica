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