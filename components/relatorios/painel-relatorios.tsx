// components/relatorios/painel-relatorios.tsx
'use client'

import { useMemo, useState } from 'react'
import { GraficoBarras } from './grafico-barras'
import { GraficoRosca } from './grafico-rosca'
import { GraficoTendencia } from './grafico-tendencia'
import { CartaoKpi } from './kpis'
import { STATUS_ENTREGA, STATUS_PAGAMENTO } from '@/types/costura'
import type { LinhaRelatorio } from '@/lib/relatorios'

// Cada chave é uma dimensão que pode virar filtro ao clicar numa
// barra. undefined significa "sem filtro nessa dimensão".
type Filtros = {
  lider?: string
  supervisor?: string
  coordenador?: string
  statusEntrega?: string
  statusPagamento?: string
  polo?: string
  processoEquipe?: string
}

const ROTULO_VAZIO = '(sem valor)'

const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function rotuloStatusEntrega(valor: string) {
  return (
    STATUS_ENTREGA[valor as keyof typeof STATUS_ENTREGA]?.label ?? valor
  )
}

function rotuloStatusPagamento(valor: string) {
  return (
    STATUS_PAGAMENTO[valor as keyof typeof STATUS_PAGAMENTO]?.label ?? valor
  )
}

// Conta quantas linhas existem para cada valor de uma chave — o
// "group by" que o Supabase não faz por nós aqui; como o volume é
// pequeno (é um sistema de controle interno, não milhões de linhas),
// fazer essa conta no navegador é simples e instantâneo.
function contarPor(
  linhas: LinhaRelatorio[],
  chave: keyof LinhaRelatorio,
  traduzir?: (valor: string) => string
) {
  const contagem = new Map<string, number>()
  for (const linha of linhas) {
    const bruto = linha[chave]
    const valor = bruto == null || bruto === '' ? ROTULO_VAZIO : String(bruto)
    const nome = valor === ROTULO_VAZIO || !traduzir ? valor : traduzir(valor)
    contagem.set(nome, (contagem.get(nome) ?? 0) + 1)
  }
  return Array.from(contagem.entries())
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

// Mesma ideia de contarPor, mas somando o valor pendente de cada
// costura em vez de contar linhas — usado no gráfico de dinheiro por
// coordenador, que responde uma pergunta diferente ("quanto" em vez
// de "quantas").
function somarPendentePor(linhas: LinhaRelatorio[], chave: keyof LinhaRelatorio) {
  const soma = new Map<string, number>()
  for (const linha of linhas) {
    if (linha.status_pagamento !== 'pendente' || linha.quantidade_pagamento == null) {
      continue
    }
    const bruto = linha[chave]
    const valor = bruto == null || bruto === '' ? ROTULO_VAZIO : String(bruto)
    soma.set(valor, (soma.get(valor) ?? 0) + linha.quantidade_pagamento)
  }
  return Array.from(soma.entries())
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

// Agrupa por mês (AAAA-MM, a partir de recebido_em) e devolve em
// ordem cronológica — diferente das funções acima, que não têm uma
// ordem "natural" e por isso ordenam do maior pro menor.
function contarPorMes(linhas: LinhaRelatorio[]) {
  const contagem = new Map<string, number>()
  for (const linha of linhas) {
    const chave = linha.recebido_em.slice(0, 7) // "AAAA-MM"
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }
  return Array.from(contagem.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, quantidade]) => {
      const [ano, mes] = chave.split('-')
      return { mes: `${mes}/${ano}`, quantidade }
    })
}

const MAPA_COLUNA: Record<keyof Filtros, keyof LinhaRelatorio> = {
  lider: 'lider',
  supervisor: 'supervisor',
  coordenador: 'coordenador',
  statusEntrega: 'status_entrega',
  statusPagamento: 'status_pagamento',
  polo: 'polo',
  processoEquipe: 'processo_equipe',
}

// Aplica todos os filtros ativos. Passar "ignorar" exclui UMA
// dimensão da checagem — é esse detalhe que permite ao próprio
// gráfico clicado continuar mostrando todas as suas barras (pra
// poder trocar de escolha depois), enquanto os outros já filtram.
// Sem "ignorar" (os KPIs e a tendência mensal usam assim), todos os
// filtros contam.
function aplicarFiltros(
  linhas: LinhaRelatorio[],
  filtros: Filtros,
  ignorar?: keyof Filtros
) {
  return linhas.filter((linha) => {
    for (const chave of Object.keys(filtros) as (keyof Filtros)[]) {
      if (chave === ignorar) continue
      const valorFiltro = filtros[chave]
      if (!valorFiltro) continue
      const coluna = MAPA_COLUNA[chave]
      const bruto = linha[coluna]
      const valorLinha = bruto == null || bruto === '' ? ROTULO_VAZIO : String(bruto)
      if (valorLinha !== valorFiltro) return false
    }
    return true
  })
}

export function PainelRelatorios({ dados }: { dados: LinhaRelatorio[] }) {
  const [filtros, setFiltros] = useState<Filtros>({})

  function aoClicarBarra(chave: keyof Filtros, nome: string) {
    setFiltros((atual) => ({
      ...atual,
      // Clicar na mesma barra de novo desmarca — igual o Power BI.
      [chave]: atual[chave] === nome ? undefined : nome,
    }))
  }

  // O conjunto final, depois de TODOS os filtros ativos — usado
  // pelos KPIs e pelo gráfico de tendência, que não participam do
  // "ignora a própria dimensão" (eles não são, em si, uma dimensão
  // clicável, então nenhum filtro precisa ser ignorado pra eles).
  const dadosFiltrados = useMemo(() => aplicarFiltros(dados, filtros), [dados, filtros])

  const dadosLider = useMemo(
    () => contarPor(aplicarFiltros(dados, filtros, 'lider'), 'lider'),
    [dados, filtros]
  )
  const dadosSupervisor = useMemo(
    () => contarPor(aplicarFiltros(dados, filtros, 'supervisor'), 'supervisor'),
    [dados, filtros]
  )
  const dadosCoordenador = useMemo(
    () => contarPor(aplicarFiltros(dados, filtros, 'coordenador'), 'coordenador'),
    [dados, filtros]
  )
  const dadosStatusEntrega = useMemo(
    () =>
      contarPor(
        aplicarFiltros(dados, filtros, 'statusEntrega'),
        'status_entrega',
        rotuloStatusEntrega
      ),
    [dados, filtros]
  )
  const dadosStatusPagamento = useMemo(
    () =>
      contarPor(
        aplicarFiltros(dados, filtros, 'statusPagamento'),
        'status_pagamento',
        rotuloStatusPagamento
      ),
    [dados, filtros]
  )
  const dadosPolo = useMemo(
    () => contarPor(aplicarFiltros(dados, filtros, 'polo'), 'polo'),
    [dados, filtros]
  )
  const dadosProcesso = useMemo(
    () =>
      contarPor(aplicarFiltros(dados, filtros, 'processoEquipe'), 'processo_equipe'),
    [dados, filtros]
  )
  const dadosValorPorCoordenador = useMemo(
    () => somarPendentePor(aplicarFiltros(dados, filtros, 'coordenador'), 'coordenador'),
    [dados, filtros]
  )
  const dadosTendencia = useMemo(() => contarPorMes(dadosFiltrados), [dadosFiltrados])

  // ---- KPIs ----
  const totalCosturas = dadosFiltrados.length
  const totalGeral = dadosFiltrados.reduce(
    (soma, l) => soma + (l.quantidade_pagamento ?? 0),
    0
  )
  const totalRecebido = dadosFiltrados
    .filter((l) => l.status_pagamento === 'pago')
    .reduce((soma, l) => soma + (l.quantidade_pagamento ?? 0), 0)
  const totalPendente = dadosFiltrados
    .filter((l) => l.status_pagamento === 'pendente')
    .reduce((soma, l) => soma + (l.quantidade_pagamento ?? 0), 0)

  const temFiltro = Object.values(filtros).some(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink/60">
          <span className="font-semibold text-ink">{totalCosturas}</span>{' '}
          {totalCosturas === 1 ? 'costura' : 'costuras'}{' '}
          {temFiltro ? 'com esse filtro' : 'ao todo'}
        </p>
        {temFiltro && (
          <button
            type="button"
            onClick={() => setFiltros({})}
            className="text-sm text-secondary hover:underline"
          >
            Limpar filtros dos gráficos
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <CartaoKpi label="Total de costuras" valor={String(totalCosturas)} />
        <CartaoKpi label="Valor total" valor={formatarMoeda(totalGeral)} />
        <CartaoKpi
          label="Recebido"
          valor={formatarMoeda(totalRecebido)}
          cor="text-secondary"
        />
        <CartaoKpi
          label="A receber"
          valor={formatarMoeda(totalPendente)}
          cor="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GraficoBarras
          titulo="Por líder"
          dados={dadosLider}
          selecionado={filtros.lider}
          aoClicar={(nome) => aoClicarBarra('lider', nome)}
        />
        <GraficoBarras
          titulo="Por supervisor"
          dados={dadosSupervisor}
          selecionado={filtros.supervisor}
          aoClicar={(nome) => aoClicarBarra('supervisor', nome)}
        />
        <GraficoBarras
          titulo="Por coordenador"
          dados={dadosCoordenador}
          selecionado={filtros.coordenador}
          aoClicar={(nome) => aoClicarBarra('coordenador', nome)}
        />
        <GraficoRosca
          titulo="Por status de entrega"
          dados={dadosStatusEntrega}
          selecionado={
            filtros.statusEntrega ? rotuloStatusEntrega(filtros.statusEntrega) : undefined
          }
          aoClicar={(nome) => {
            const chave = (
              Object.entries(STATUS_ENTREGA) as [string, { label: string }][]
            ).find(([, v]) => v.label === nome)?.[0]
            if (chave) aoClicarBarra('statusEntrega', chave)
          }}
        />
        <GraficoRosca
          titulo="Por status de pagamento"
          dados={dadosStatusPagamento}
          selecionado={
            filtros.statusPagamento
              ? rotuloStatusPagamento(filtros.statusPagamento)
              : undefined
          }
          aoClicar={(nome) => {
            const chave = (
              Object.entries(STATUS_PAGAMENTO) as [string, { label: string }][]
            ).find(([, v]) => v.label === nome)?.[0]
            if (chave) aoClicarBarra('statusPagamento', chave)
          }}
        />
        <GraficoBarras
          titulo="Por polo"
          dados={dadosPolo}
          selecionado={filtros.polo}
          aoClicar={(nome) => aoClicarBarra('polo', nome)}
        />
        <GraficoBarras
          titulo="Por processo da equipe"
          dados={dadosProcesso}
          selecionado={filtros.processoEquipe}
          aoClicar={(nome) => aoClicarBarra('processoEquipe', nome)}
        />
        <GraficoRosca
          titulo="Participação de cada coordenador no valor pendente"
          dados={dadosValorPorCoordenador}
          selecionado={filtros.coordenador}
          aoClicar={(nome) => aoClicarBarra('coordenador', nome)}
          rotuloValor="Valor pendente"
          formatarValor={formatarMoeda}
        />
        <GraficoTendencia dados={dadosTendencia} />
      </div>
    </div>
  )
}