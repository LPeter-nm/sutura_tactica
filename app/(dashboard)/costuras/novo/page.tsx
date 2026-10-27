// app/(dashboard)/costuras/novo/page.tsx

import { CosturaForm } from '@/components/costura-form'
import { buscarFiscais } from '@/lib/fiscais'
import { criarCostura } from '../actions'

export default async function PaginaNovaCostura() {
  const fiscais = await buscarFiscais()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Nova costura</h1>
      <CosturaForm fiscais={fiscais} aoSalvar={criarCostura} textoBotao="Cadastrar" />
    </div>
  )
}