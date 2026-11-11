// components/relatorios/kpis.tsx

export function CartaoKpi({
  label,
  valor,
  cor,
}: {
  label: string
  valor: string
  cor?: string
}) {
  return (
    <div className="flex-1 rounded-md border border-border bg-card px-4 py-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${cor ?? 'text-ink'}`}>{valor}</p>
    </div>
  )
}