// app/(dashboard)/costuras/[id]/page.tsx

import { notFound } from 'next/navigation'
import { buscarCostura, buscarHistoricoCostura, buscarItensFardamento } from '@/lib/costuras'
import { CosturaDetalhes } from '@/components/costura-detalhes'

export default async function PaginaDetalheCostura({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const costura = await buscarCostura(id)

  if (!costura) {
    notFound()
  }

  const [historico, itens] = await Promise.all([
    buscarHistoricoCostura(id),
    buscarItensFardamento(id),
  ])

  return (
    <div className="max-w-xl">
      <CosturaDetalhes costura={costura} historico={historico} itens={itens} />
    </div>
  )
}