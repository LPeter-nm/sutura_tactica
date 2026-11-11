// components/relatorios/grafico-tendencia.tsx
'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Diferente do GraficoBarras, este aqui não é clicável — faz sentido
// filtrar "só o líder X" ou "só o polo Y", mas filtrar "só o mês de
// outubro" cruzaria com o período que a pessoa já escolhe lá em cima,
// nos campos De/Até. Então este gráfico só mostra, não interage.
export function GraficoTendencia({
  dados,
}: {
  dados: { mes: string; quantidade: number }[]
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">
        Costuras recebidas por mês
      </h2>

      {dados.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Sem dados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dados} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => [valor, 'Costuras']} />
            <Line
              type="monotone"
              dataKey="quantidade"
              stroke="#1E4E8C"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}