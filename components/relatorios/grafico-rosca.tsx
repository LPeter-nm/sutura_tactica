// components/relatorios/grafico-rosca.tsx
'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

type GraficoRoscaProps = {
  titulo: string
  dados: { nome: string; quantidade: number }[]
  selecionado?: string
  aoClicar: (nome: string) => void
  rotuloValor?: string
  formatarValor?: (valor: number) => string
}

// Paleta com mais tons do que os dois do gráfico de barras — uma
// rosca costuma ter mais fatias visíveis ao mesmo tempo (aqui, status
// de entrega/pagamento) do que o normal de um "selecionado vs resto".
const PALETA = ['#1E4E8C', '#C1272D', '#4F85C9', '#E2545B', '#1A1A1A', '#8A8A8A']

export function GraficoRosca({
  titulo,
  dados,
  selecionado,
  aoClicar,
  rotuloValor = 'Costuras',
  formatarValor,
}: GraficoRoscaProps) {
  const temFiltro = !!selecionado

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">{titulo}</h2>

      {dados.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Sem dados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={dados}
              dataKey="quantidade"
              nameKey="nome"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              cursor="pointer"
              // A tipagem exata do recharts pra isso é bem solta —
              // em vez de brigar com ela de novo (já perdemos esse
              // tempo no gráfico de barras), tipo largo aqui mesmo,
              // só pegando o que de fato uso.
              onClick={(item: { name?: string }) => {
                if (item.name) aoClicar(item.name)
              }}
              label={(props: { name?: string; percent?: number }) =>
                `${Math.round((props.percent ?? 0) * 100)}%`
              }
              labelLine={false}
            >
              {dados.map((item, indice) => {
                const ativa = item.nome === selecionado
                const opacidade = !temFiltro || ativa ? 1 : 0.3
                return (
                  <Cell
                    key={item.nome}
                    fill={PALETA[indice % PALETA.length]}
                    opacity={opacidade}
                  />
                )
              })}
            </Pie>
            <Tooltip
              formatter={(valor) => [
                formatarValor ? formatarValor(Number(valor)) : valor,
                rotuloValor,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}