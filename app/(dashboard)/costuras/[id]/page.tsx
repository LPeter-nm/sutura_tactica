// app/(dashboard)/costuras/[id]/editar/page.tsx

import { notFound } from 'next/navigation'
import { buscarCostura } from '@/lib/costuras'
import { buscarFiscais } from '@/lib/fiscais'
import { buscarEletricistas } from '@/lib/eletricistas'
import { CosturaEditar } from '@/components/costura-editar'

export default async function PaginaEditarCostura({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [costura, fiscais, eletricistas] = await Promise.all([
    buscarCostura(id),
    buscarFiscais(),
    buscarEletricistas(),
  ])

  if (!costura) {
    notFound()
  }

  return (
    <div className="max-w-xl">
      <CosturaEditar costura={costura} fiscais={fiscais} eletricistas={eletricistas} />
    </div>
  )
}