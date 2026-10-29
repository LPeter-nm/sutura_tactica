// app/(dashboard)/costuras/@modal/(.)[id]/editar/page.tsx

import { notFound } from 'next/navigation'
import { Modal } from '@/components/modal'
import { buscarCostura } from '@/lib/costuras'
import { buscarFiscais } from '@/lib/fiscais'
import { buscarEletricistas } from '@/lib/eletricistas'
import { CosturaEditar } from '@/components/costura-editar'

export default async function ModalEditarCostura({
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
    <Modal>
      <CosturaEditar costura={costura} fiscais={fiscais} eletricistas={eletricistas} />
    </Modal>
  )
}