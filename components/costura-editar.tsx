// components/costura-editar.tsx

import { CosturaForm } from '@/components/costura-form'
import { atualizarCostura } from '@/app/(dashboard)/costuras/actions'
import type { Costura } from '@/types/costura'
import type { Fiscal } from '@/lib/fiscais'

export function CosturaEditar({
  costura,
  fiscais,
}: {
  costura: Costura
  fiscais: Fiscal[]
}) {
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
        fiscais={fiscais}
        valoresIniciais={{
          eletricista_nome: costura.eletricista_nome,
          prefixo: costura.prefixo ?? '',
          lider: costura.lider ?? '',
          supervisor: costura.supervisor ?? '',
          coordenador: costura.coordenador ?? '',
          quantidade_pagamento: costura.quantidade_pagamento?.toString() ?? '',
          tipo_fardamento: costura.tipo_fardamento,
          local_costura: costura.local_costura,
          dt_costura: costura.dt_costura,
          status_entrega: costura.status_entrega,
          status_pagamento: costura.status_pagamento ?? 'pendente',
          pago_por: costura.pago_por ?? '',
        }}
        aoSalvar={salvarComId}
        textoBotao="Salvar alterações"
      />
    </div>
  )
}