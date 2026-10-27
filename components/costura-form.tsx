// components/costura-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { costuraSchema, type CosturaFormValues } from '@/lib/validations/costura'
import { STATUS_ENTREGA, STATUS_PAGAMENTO } from '@/types/costura'
import { useToast } from '@/components/toast-provider'

type CosturaFormProps = {
  valoresIniciais?: Partial<CosturaFormValues>
  // Esta prop recebe diretamente uma Server Action (de verdade, uma
  // função marcada "use server" lá no arquivo actions.ts — ou essa
  // mesma função já "pré-presa" a um id, via .bind(), no caso da
  // edição). O formulário não sabe, e não precisa saber, se está
  // criando ou atualizando — ele só entrega os dados validados.
  aoSalvar: (valores: CosturaFormValues) => Promise<{ erro?: string } | void>
  textoBotao: string
}

export function CosturaForm({
  valoresIniciais,
  aoSalvar,
  textoBotao,
}: CosturaFormProps) {
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CosturaFormValues>({
    resolver: zodResolver(costuraSchema),
    defaultValues: {
      status_entrega: 'pendente',
      status_pagamento: 'pendente',
      ...valoresIniciais,
    },
  })

  // Reage ao que a pessoa digita em tempo real — sem isso, o campo de
  // status de pagamento teria que esperar um reenvio do formulário
  // pra aparecer ou sumir.
  const temPreco = !!watch('quantidade_pagamento')

  async function aoEnviar(valores: CosturaFormValues) {
    setEnviando(true)

    const resultado = await aoSalvar(valores)

    // Se chegou aqui com um erro, avisamos e liberamos o formulário
    // de novo. Se deu certo, a própria Server Action já redireciona
    // a pessoa para a listagem — então não há nada mais a fazer.
    if (resultado?.erro) {
      toast.mostrarErro(resultado.erro)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="max-w-xl space-y-4">
      <Campo label="Nome do eletricista" erro={errors.eletricista_nome?.message}>
        <input {...register('eletricista_nome')} className={estiloInput} />
      </Campo>

      <Campo label="Prefixo" erro={errors.prefixo?.message}>
        <input
          {...register('prefixo')}
          placeholder="PI-THE-F016"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Líder/Supervisor" erro={errors.lider_supervisor?.message}>
        <input {...register('lider_supervisor')} className={estiloInput} />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Tipo de fardamento" erro={errors.tipo_fardamento?.message}>
          <input {...register('tipo_fardamento')} className={estiloInput} />
        </Campo>
        <Campo label="Local de costura" erro={errors.local_costura?.message}>
          <input {...register('local_costura')} className={estiloInput} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Dt Costura" erro={errors.dt_costura?.message}>
          <input type="date" {...register('dt_costura')} className={estiloInput} />
        </Campo>
        <Campo
          label="Quantidade a pagar (opcional)"
          erro={errors.quantidade_pagamento?.message}
        >
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register('quantidade_pagamento')}
            className={estiloInput}
          />
        </Campo>
      </div>

      {temPreco && (
        <div className="grid grid-cols-2 gap-4">
          <Campo
            label="Status de pagamento"
            erro={errors.status_pagamento?.message}
          >
            <select {...register('status_pagamento')} className={estiloInput}>
              {Object.entries(STATUS_PAGAMENTO).map(([valor, { label }]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Pago por" erro={errors.pago_por?.message}>
            <input {...register('pago_por')} className={estiloInput} />
          </Campo>
        </div>
      )}

      <Campo label="Status de entrega" erro={errors.status_entrega?.message}>
        <select {...register('status_entrega')} className={estiloInput}>
          {Object.entries(STATUS_ENTREGA).map(([valor, { label }]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
      </Campo>

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white
                   transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {enviando ? 'Salvando...' : textoBotao}
      </button>
    </form>
  )
}

const estiloInput =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-ink ' +
  'focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary'

function Campo({
  label,
  erro,
  children,
}: {
  label: string
  erro?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-ink">{label}</label>
      {children}
      {erro && <p className="mt-1 text-xs text-primary">{erro}</p>}
    </div>
  )
}