// app/(dashboard)/configuracoes/fiscais/novo/page.tsx

import { FiscalForm } from '@/components/fiscal-form'
import { criarFiscal } from '../actions'

export default function PaginaNovoFiscal() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Novo fiscal</h1>
      <FiscalForm aoSalvar={criarFiscal} textoBotao="Cadastrar" />
    </div>
  )
}