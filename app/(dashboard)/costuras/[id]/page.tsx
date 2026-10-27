import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CosturaForm } from '@/components/costura-form'
import { StatusBadge } from '@/components/status-badge'
import { atualizarCostura } from '../actions'
import type { Costura, StatusEntrega } from '@/types/costura'

type LinhaHistorico = {
  status_anterior: StatusEntrega | null
  status_novo: StatusEntrega
  alterado_em: string
}

export default async function PaginaEditarCostura({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: costura } = await supabase
    .from('costuras')
    .select('*')
    .eq('id', id)
    .single<Costura>()

  // Se o id da URL não corresponder a nenhuma costura (foi digitado
  // errado, ou o registro nunca existiu), mostramos a página 404
  // padrão do Next.js em vez de deixar a tela quebrar silenciosamente.
  if (!costura) {
    notFound()
  }

  const { data: historico } = await supabase
    .from('costuras_historico_status')
    .select('status_anterior, status_novo, alterado_em')
    .eq('costura_id', id)
    .order('alterado_em', { ascending: false })
    .returns<LinhaHistorico[]>()

  // .bind(null, id) cria uma nova função, igual a atualizarCostura,
  // mas já com o id "grudado" nela. O formulário só vai precisar
  // chamar essa função passando os valores — o id já vai junto,
  // sem o formulário nem saber que ele existe.
  const salvarComId = atualizarCostura.bind(null, id)

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="mb-6 text-lg font-semibold text-ink">
          Editar costura — {costura.prefixo}
        </h1>
        <CosturaForm
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
          }}
          aoSalvar={salvarComId}
          textoBotao="Salvar alterações" fiscais={[]}/>
      </div>

      {historico && historico.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Histórico de status
          </h2>
          <ul className="space-y-2">
            {historico.map((item, indice) => (
              <li
                key={indice}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                {item.status_anterior && (
                  <>
                    <StatusBadge status={item.status_anterior} />
                    <span className="text-ink/40">→</span>
                  </>
                )}
                <StatusBadge status={item.status_novo} />
                <span className="text-xs text-ink/50">
                  {new Date(item.alterado_em).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
