// app/(dashboard)/costuras/@modal/(.)[id]/page.tsx

import { notFound } from 'next/navigation'
import { Modal } from '@/components/modal'
import { buscarCostura, buscarHistoricoCostura, buscarItensFardamento } from '@/lib/costuras'
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

  const [historico, itens] = await Promise.all([
    buscarHistoricoCostura(id),
    buscarItensFardamento(id),
  ])

  return (
    <Modal>
      <CosturaDetalhes costura={costura} historico={historico} itens={itens} />
    </Modal>
  )
}