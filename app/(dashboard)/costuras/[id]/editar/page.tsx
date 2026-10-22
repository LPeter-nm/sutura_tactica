import { notFound } from 'next/navigation'
import { buscarCostura } from '@/lib/costuras'
import { CosturaEditar } from '@/components/costura-editar'

export default async function PaginaEditarCostura({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const costura = await buscarCostura(id)

  if (!costura) {
    notFound()
  }

  return (
    <div className="max-w-xl">
      <CosturaEditar costura={costura} />
    </div>
  )
}
