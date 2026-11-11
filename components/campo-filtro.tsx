// components/campo-filtro.tsx

// O rótulo do filtro aparece em cima do campo, não só dentro da
// opção vazia do select. Extraído de app/(dashboard)/costuras/page.tsx
// pra ser reaproveitado também na página de relatórios, sem duplicar
// a mesma marcação duas vezes.
export const estiloFiltro =
  'rounded-md border border-border bg-card px-3 py-2 text-sm text-ink'

export function CampoFiltro({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink/60">
      {label}
      {children}
    </label>
  )
}