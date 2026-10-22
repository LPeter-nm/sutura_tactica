import { notFound } from 'next/navigation'
import { Modal } from '@/components/modal'
import { buscarCostura } from '@/lib/costuras'
import { CosturaEditar } from '@/components/costura-editar'

export default async function ModalEditarCostura({
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
    <Modal>
      <CosturaEditar costura={costura} />
    </Modal>
  )
}
