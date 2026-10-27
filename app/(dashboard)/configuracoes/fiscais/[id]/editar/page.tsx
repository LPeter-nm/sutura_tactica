// app/(dashboard)/configuracoes/equipe/[id]/editar/page.tsx

import { notFound } from 'next/navigation'
import { buscarFiscal } from '@/lib/fiscais'
import { FiscalForm } from '@/components/fiscal-form'
import { atualizarFiscal } from '../../actions'

export default async function PaginaEditarFiscal({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fiscal = await buscarFiscal(id)

  if (!fiscal) {
    notFound()
  }

  const salvarComId = atualizarFiscal.bind(null, id)

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">
        Editar fiscal — {fiscal.nome}
      </h1>
      <FiscalForm
        valoresIniciais={{
          nome: fiscal.nome,
          supervisor: fiscal.supervisor,
          coordenador: fiscal.coordenador,
        }}
        aoSalvar={salvarComId}
        textoBotao="Salvar alterações"
      />
    </div>
  )
}