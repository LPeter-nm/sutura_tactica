import { CosturaForm } from '@/components/costura-form'
import { atualizarCostura } from '@/app/(dashboard)/costuras/actions'
import type { Costura } from '@/types/costura'

export function CosturaEditar({ costura }: { costura: Costura }) {
  // .bind(null, costura.id) prende o id a esta cópia da função — o
  // formulário recebe algo pronto pra chamar, sem precisar saber
  // que um id existe por trás disso.
  const salvarComId = atualizarCostura.bind(null, costura.id)

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">
        Editar costura — {costura.prefixo}
      </h1>
      <CosturaForm
        valoresIniciais={{
          eletricista_nome: costura.eletricista_nome,
          prefixo: costura.prefixo,
          lider_supervisor: costura.lider_supervisor,
          quantidade_pagamento: costura.quantidade_pagamento?.toString() ?? '',
          tipo_fardamento: costura.tipo_fardamento,
          local_costura: costura.local_costura,
          prazo_entrega: costura.prazo_entrega,
          status_entrega: costura.status_entrega,
        }}
        aoSalvar={salvarComId}
        textoBotao="Salvar alterações"
      />
    </div>
  )
}
