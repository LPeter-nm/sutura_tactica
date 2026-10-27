// components/fiscal-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fiscalSchema, type FiscalFormValues } from '@/lib/validations/fiscal'
import { useToast } from '@/components/toast-provider'

type FiscalFormProps = {
  valoresIniciais?: Partial<FiscalFormValues>
  aoSalvar: (valores: FiscalFormValues) => Promise<{ erro?: string } | void>
  textoBotao: string
}

export function FiscalForm({ valoresIniciais, aoSalvar, textoBotao }: FiscalFormProps) {
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FiscalFormValues>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: valoresIniciais,
  })

  async function aoEnviar(valores: FiscalFormValues) {
    setEnviando(true)
    const resultado = await aoSalvar(valores)
    if (resultado?.erro) {
      toast.mostrarErro(resultado.erro)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="max-w-md space-y-4">
      <Campo label="Nome do fiscal" erro={errors.nome?.message}>
        <input {...register('nome')} className={estiloInput} />
      </Campo>

      <Campo label="Supervisor" erro={errors.supervisor?.message}>
        <input {...register('supervisor')} className={estiloInput} />
      </Campo>

      <Campo label="Coordenador" erro={errors.coordenador?.message}>
        <input {...register('coordenador')} className={estiloInput} />
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