// components/costura-editar.tsx

import { CosturaForm } from '@/components/costura-form'
import { atualizarCostura } from '@/app/(dashboard)/costuras/actions'
import type { Costura } from '@/types/costura'
import type { Fiscal } from '@/lib/fiscais'
import type { Eletricista } from '@/lib/eletricistas'

export function CosturaEditar({
  costura,
  fiscais,
  eletricistas,
}: {
  costura: Costura
  fiscais: Fiscal[]
  eletricistas: Eletricista[]
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
        eletricistas={eletricistas}
        valoresIniciais={{
          eletricista_nome: costura.eletricista_nome,
          matricula: costura.matricula ?? '',
          prefixo: costura.prefixo ?? '',
          lider: costura.lider ?? '',
          supervisor: costura.supervisor ?? '',
          coordenador: costura.coordenador ?? '',
          polo: costura.polo ?? '',
          base: costura.base ?? '',
          processo_equipe: costura.processo_equipe ?? '',
          quantidade_pagamento: costura.quantidade_pagamento?.toString() ?? '',
          tipo_fardamento: costura.tipo_fardamento,
          local_costura: costura.local_costura,
          recebido_em: costura.recebido_em,
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