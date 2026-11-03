// app/(dashboard)/costuras/[id]/editar/page.tsx

import { notFound } from 'next/navigation'
import { buscarCostura, buscarItensFardamento } from '@/lib/costuras'
import { buscarFiscais } from '@/lib/fiscais'
import { buscarEletricistas } from '@/lib/eletricistas'
import { CosturaEditar } from '@/components/costura-editar'

export default async function PaginaEditarCostura({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [costura, fiscais, eletricistas, itens] = await Promise.all([
    buscarCostura(id),
    buscarFiscais(),
    buscarEletricistas(),
    buscarItensFardamento(id),
  ])

  if (!costura) {
    notFound()
  }

  return (
    <div className="max-w-xl">
      <CosturaEditar
        costura={costura}
        fiscais={fiscais}
        eletricistas={eletricistas}
        itens={itens}
      />
    </div>
  )
}