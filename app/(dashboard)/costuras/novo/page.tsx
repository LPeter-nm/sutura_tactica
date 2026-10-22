import { CosturaForm } from '@/components/costura-form'
import { criarCostura } from '../actions'

export default function PaginaNovaCostura() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Nova costura</h1>
      <CosturaForm aoSalvar={criarCostura} textoBotao="Cadastrar" />
    </div>
  )
}
