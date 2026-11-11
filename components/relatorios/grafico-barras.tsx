// components/relatorios/grafico-barras.tsx
'use client'

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type GraficoBarrasProps = {
  titulo: string
  dados: { nome: string; quantidade: number }[]
  selecionado?: string
  aoClicar: (nome: string) => void
  // "Costuras" (contagem) é o padrão; gráficos de valor em reais
  // passam algo como "formatarMoeda" aqui, pra legenda do tooltip
  // e o eixo Y lerem certo.
  rotuloValor?: string
  formatarValor?: (valor: number) => string
}

// As mesmas cores do resto do sistema (primary/secondary), só que em
// hexadecimal — o recharts desenha em SVG puro, e não enxerga as
// variáveis CSS do Tailwind que usamos em todo o resto da tela.
const COR_SELECIONADA = '#C1272D'
const COR_PADRAO = '#1E4E8C'

export function GraficoBarras({
  titulo,
  dados,
  selecionado,
  aoClicar,
  rotuloValor = 'Costuras',
  formatarValor,
}: GraficoBarrasProps) {
  const temFiltroNeleOuEmOutro = !!selecionado

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">{titulo}</h2>

      {dados.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Sem dados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(valor) =>
                formatarValor ? formatarValor(Number(valor)) : String(valor)
              }
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              // Sem anotar o tipo de "valor" aqui de propósito — o
              // recharts infere o tipo certo sozinho a partir do
              // prop "formatter"; anotar manualmente como "number" foi
              // o que conflitava com o tipo real dele (que aceita
              // undefined também).
              formatter={(valor) => [
                formatarValor ? formatarValor(Number(valor)) : valor,
                rotuloValor,
              ]}
            />
            <Bar
              dataKey="quantidade"
              radius={[4, 4, 0, 0]}
              // O clique no Bar não devolve o item de dados direto —
              // ele vem dentro de "payload", que é onde o recharts
              // guarda o objeto original ({ nome, quantidade }) de
              // cada barra. A própria tipagem do recharts marca
              // "payload" como opcional (mesmo sempre vindo
              // preenchido num clique de verdade), então o "?" e a
              // checagem abaixo só espelham isso, sem mudar o
              // comportamento real.
              onClick={(item: { payload?: { nome: string } }) => {
                if (item.payload) aoClicar(item.payload.nome)
              }}
              cursor="pointer"
            >
              {dados.map((item) => {
                // Sem filtro nenhum ativo aqui: todas as barras com a
                // mesma cor. Com um filtro ativo: a barra escolhida
                // fica cheia, as outras ficam esmaecidas — o mesmo
                // princípio visual que o Power BI usa pra "cross-filter".
                const ativa = item.nome === selecionado
                const opacidade = !temFiltroNeleOuEmOutro || ativa ? 1 : 0.25
                return (
                  <Cell
                    key={item.nome}
                    fill={ativa ? COR_SELECIONADA : COR_PADRAO}
                    opacity={opacidade}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}