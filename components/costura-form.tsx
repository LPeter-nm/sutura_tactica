// components/costura-form.tsx
'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { costuraSchema, type CosturaFormValues } from '@/lib/validations/costura'
import { STATUS_ENTREGA, STATUS_PAGAMENTO } from '@/types/costura'
import { useToast } from '@/components/toast-provider'
import type { Fiscal } from '@/lib/fiscais'

type CosturaFormProps = {
  valoresIniciais?: Partial<CosturaFormValues>
  // Vem do banco agora (tabela "fiscais"), buscado pela página que
  // usa este formulário — não mais de uma lista fixa no código. Por
  // isso quem chama <CosturaForm> precisa passar essa prop.
  fiscais: Fiscal[]
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
  fiscais,
  aoSalvar,
  textoBotao,
}: CosturaFormProps) {
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  // Tudo que os selects precisam sai de UMA fonte só — a lista de
  // fiscais que a página buscou no banco. useMemo evita recalcular
  // essas quatro listas a cada letra digitada em outro campo do
  // formulário, já que "fiscais" só muda quando a página é recarregada.
  const { lideres, supervisores, coordenadores, pessoasPagamento, equipePorLider } =
    useMemo(() => {
      const supervisoresUnicos = new Set<string>()
      const coordenadoresUnicos = new Set<string>()
      const pessoasUnicas = new Set<string>()
      const equipe: Record<string, { supervisor: string; coordenador: string }> = {}

      for (const fiscal of fiscais) {
        supervisoresUnicos.add(fiscal.supervisor)
        coordenadoresUnicos.add(fiscal.coordenador)
        pessoasUnicas.add(fiscal.nome)
        pessoasUnicas.add(fiscal.supervisor)
        pessoasUnicas.add(fiscal.coordenador)
        equipe[fiscal.nome] = {
          supervisor: fiscal.supervisor,
          coordenador: fiscal.coordenador,
        }
      }

      const ordenar = (valores: Set<string>) =>
        Array.from(valores).sort((a, b) => a.localeCompare(b, 'pt-BR'))

      return {
        lideres: ordenar(new Set(fiscais.map((f) => f.nome))),
        supervisores: ordenar(supervisoresUnicos),
        coordenadores: ordenar(coordenadoresUnicos),
        pessoasPagamento: ordenar(pessoasUnicas),
        equipePorLider: equipe,
      }
    }, [fiscais])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  // Guardamos o retorno de register('lider') numa variável, em vez
  // de espalhar {...register('lider')} direto no JSX, porque
  // precisamos do onChange original dele — pra chamar a mão, dentro
  // do NOSSO onChange, que faz o preenchimento automático de
  // supervisor/coordenador logo abaixo.
  const registroLider = register('lider')

  // "Pago por" é um select, mas com uma porta de saída: se o nome
  // não estiver na lista conhecida, a pessoa escolhe "Outra
  // pessoa..." e um campo de texto comum aparece no lugar. Começa já
  // em modo "outro" se o valor existente (numa edição) não bater com
  // nenhum nome da lista — assim ninguém perde um valor já salvo.
  const [pagoPorOutro, setPagoPorOutro] = useState(
    () =>
      !!valoresIniciais?.pago_por &&
      !pessoasPagamento.includes(valoresIniciais.pago_por)
  )

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
      <div className="grid grid-cols-2 gap-4">
        <Campo
          label="Nome do eletricista"
          erro={errors.eletricista_nome?.message}
        >
          <input {...register('eletricista_nome')} className={estiloInput} />
        </Campo>
        <Campo label="Matrícula" erro={errors.matricula?.message}>
          <input {...register('matricula')} className={estiloInput} />
        </Campo>
      </div>

      <Campo label="Prefixo" erro={errors.prefixo?.message}>
        <input
          {...register('prefixo')}
          placeholder="PI-THE-F016"
          className={estiloInput}
        />
      </Campo>

      <div className="grid grid-cols-3 gap-4">
        <Campo label="Líder" erro={errors.lider?.message}>
          <select
            {...registroLider}
            onChange={(evento) => {
              // Mantém o próprio formulário sabendo do novo valor —
              // sem isso, o react-hook-form nunca ficaria sabendo que
              // o campo mudou.
              registroLider.onChange(evento)

              const nomeEscolhido = evento.target.value
              if (!nomeEscolhido) return

              // Cada fiscal, na tabela, tem exatamente um supervisor
              // e um coordenador — então, diferente de antes, não
              // existe mais caso ambíguo pra tratar aqui.
              const equipe = equipePorLider[nomeEscolhido]
              if (equipe) {
                setValue('supervisor', equipe.supervisor)
                setValue('coordenador', equipe.coordenador)
              }
            }}
            className={estiloInput}
          >
            <option value="">Selecione</option>
            {lideres.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Supervisor" erro={errors.supervisor?.message}>
          <select {...register('supervisor')} className={estiloInput}>
            <option value="">Selecione</option>
            {supervisores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Coordenador" erro={errors.coordenador?.message}>
          <select {...register('coordenador')} className={estiloInput}>
            <option value="">Selecione</option>
            {coordenadores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Tipo de fardamento" erro={errors.tipo_fardamento?.message}>
          <input {...register('tipo_fardamento')} className={estiloInput} />
        </Campo>
        <Campo label="Local de costura" erro={errors.local_costura?.message}>
          <input {...register('local_costura')} className={estiloInput} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Recebido em" erro={errors.dt_costura?.message}>
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
            {pagoPorOutro ? (
              <input
                {...register('pago_por')}
                placeholder="Digite o nome"
                className={estiloInput}
              />
            ) : (
              <select
                value={watch('pago_por') ?? ''}
                onChange={(evento) => {
                  if (evento.target.value === '__outro__') {
                    setPagoPorOutro(true)
                    setValue('pago_por', '')
                  } else {
                    setValue('pago_por', evento.target.value)
                  }
                }}
                className={estiloInput}
              >
                <option value="">Selecione</option>
                {pessoasPagamento.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
                <option value="__outro__">Outra pessoa...</option>
              </select>
            )}
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