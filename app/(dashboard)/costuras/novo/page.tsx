// app/(dashboard)/costuras/novo/page.tsx

import { CosturaForm } from '@/components/costura-form'
import { buscarFiscais } from '@/lib/fiscais'
import { buscarEletricistas } from '@/lib/eletricistas'
import { criarCostura } from '../actions'

export default async function PaginaNovaCostura() {
  const [fiscais, eletricistas] = await Promise.all([
    buscarFiscais(),
    buscarEletricistas(),
  ])

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Nova costura</h1>
      <CosturaForm
        fiscais={fiscais}
        eletricistas={eletricistas}
        aoSalvar={criarCostura}
        textoBotao="Cadastrar"
      />
    </div>
  )
}