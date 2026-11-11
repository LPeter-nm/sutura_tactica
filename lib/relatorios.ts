// lib/relatorios.ts

import { createClient } from '@/lib/supabase/server'

// Só as colunas que algum gráfico ou KPI realmente usa.
export type LinhaRelatorio = {
  lider: string | null
  supervisor: string | null
  coordenador: string | null
  polo: string | null
  processo_equipe: string | null
  status_entrega: string
  status_pagamento: string | null
  quantidade_pagamento: number | null
  recebido_em: string
}

// O mesmo conjunto de filtros que a listagem de costuras usa — os
// relatórios aceitam exatamente os mesmos, pra quem já usa um lado
// do sistema não precisar aprender outro vocabulário no outro lado.
export type FiltrosRelatorio = {
  busca?: string
  status?: string
  statusPagamento?: string
  dataDe?: string
  dataAte?: string
  filtroLider?: string
  filtroSupervisor?: string
  filtroCoordenador?: string
  filtroPolo?: string
  filtroBase?: string
  filtroProcesso?: string
}

export async function buscarDadosRelatorios(filtros: FiltrosRelatorio = {}) {
  const supabase = await createClient()

  function construirConsulta() {
    let consulta = supabase
      .from('costuras')
      .select(
        'lider, supervisor, coordenador, polo, processo_equipe, status_entrega, status_pagamento, quantidade_pagamento, recebido_em'
      )

    if (filtros.busca) {
      consulta = consulta.or(
        `eletricista_nome.ilike.%${filtros.busca}%,prefixo.ilike.%${filtros.busca}%`
      )
    }
    if (filtros.status) consulta = consulta.eq('status_entrega', filtros.status)
    if (filtros.statusPagamento) {
      consulta = consulta.eq('status_pagamento', filtros.statusPagamento)
    }
    if (filtros.dataDe) consulta = consulta.gte('recebido_em', filtros.dataDe)
    if (filtros.dataAte) consulta = consulta.lte('recebido_em', filtros.dataAte)
    if (filtros.filtroLider) consulta = consulta.eq('lider', filtros.filtroLider)
    if (filtros.filtroSupervisor) {
      consulta = consulta.eq('supervisor', filtros.filtroSupervisor)
    }
    if (filtros.filtroCoordenador) {
      consulta = consulta.eq('coordenador', filtros.filtroCoordenador)
    }
    if (filtros.filtroPolo) consulta = consulta.eq('polo', filtros.filtroPolo)
    if (filtros.filtroBase) consulta = consulta.eq('base', filtros.filtroBase)
    if (filtros.filtroProcesso) {
      consulta = consulta.eq('processo_equipe', filtros.filtroProcesso)
    }

    return consulta
  }

  // Mesmo cuidado da exportação em Excel: o Supabase devolve, por
  // padrão, no máximo 1000 linhas por consulta — buscamos em blocos
  // de 1000 até uma página voltar incompleta, garantindo que nenhum
  // gráfico fique mentindo por causa de um teto escondido.
  const TAMANHO_PAGINA = 1000
  const linhas: LinhaRelatorio[] = []
  let pagina = 0

  while (true) {
    const inicio = pagina * TAMANHO_PAGINA
    const fim = inicio + TAMANHO_PAGINA - 1

    const { data, error } = await construirConsulta()
      .range(inicio, fim)
      .returns<LinhaRelatorio[]>()

    if (error) {
      console.error('Erro ao buscar dados de relatórios:', error.message)
      break
    }
    if (!data || data.length === 0) break

    linhas.push(...data)

    if (data.length < TAMANHO_PAGINA) break
    pagina++
  }

  return linhas
}