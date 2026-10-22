import { notFound } from 'next/navigation'
import { Modal } from '@/components/modal'
import { buscarCostura, buscarHistoricoCostura } from '@/lib/costuras'
import { CosturaDetalhes } from '@/components/costura-detalhes'

export default async function ModalDetalheCostura({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const costura = await buscarCostura(id)

  if (!costura) {
    notFound()
  }

  const historico = await buscarHistoricoCostura(id)

  return (
    <Modal>
      <CosturaDetalhes costura={costura} historico={historico} />
    </Modal>
  )
}
