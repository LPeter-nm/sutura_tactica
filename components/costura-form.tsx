// components/costura-form.tsx
'use client'

import { useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { costuraSchema, type CosturaFormValues } from '@/lib/validations/costura'
import {
  STATUS_ENTREGA,
  STATUS_PAGAMENTO,
  TIPOS_FARDAMENTO,
  TIPO_FARDAMENTO_LABEL,
} from '@/types/costura'
import { useToast } from '@/components/toast-provider'
import type { Fiscal } from '@/lib/fiscais'
import type { Eletricista } from '@/lib/eletricistas'
import { POLOS, BASES, PROCESSOS_EQUIPE } from '@/lib/organizacao'

// Tudo que precisa estar certo ANTES de avançar pra etapa dos itens
// de fardamento — "itens" fica de fora de propósito, porque ele é
// validado na etapa 2, não aqui.
const CAMPOS_ETAPA_1 = [
  'eletricista_nome',
  'matricula',
  'prefixo',
  'lider',
  'supervisor',
  'coordenador',
  'polo',
  'base',
  'processo_equipe',
  'local_costura',
  'recebido_em',
  'quantidade_pagamento',
  'status_pagamento',
  'pago_por',
  'status_entrega',
] as const

type CosturaFormProps = {
  valoresIniciais?: Partial<CosturaFormValues>
  // Vem do banco (tabela "fiscais") — hoje, só alimenta as opções
  // dos selects de líder/supervisor/coordenador. Quem decide o que
  // preencher automaticamente é o eletricista escolhido, não mais
  // o líder escolhido.
  fiscais: Fiscal[]
  // A fonte de verdade do preenchimento automático: escolher um
  // nome aqui preenche matrícula, prefixo, líder, supervisor,
  // coordenador, polo, base e processo da equipe, todos de uma vez.
  eletricistas: Eletricista[]
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
  eletricistas,
  aoSalvar,
  textoBotao,
}: CosturaFormProps) {
  const [enviando, setEnviando] = useState(false)
  // A "etapa" é só um estado local, dentro deste mesmo componente —
  // visualmente, parece duas telas em sequência (a primeira com os
  // dados gerais, a segunda com os itens de fardamento), mas nenhuma
  // delas é uma rota ou um modal à parte. Isso é de propósito: assim,
  // nada do que a pessoa já preencheu na etapa 1 se perde ao avançar
  // ou voltar pra etapa 2.
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const toast = useToast()

  // Tudo que os selects precisam sai de UMA fonte só — a lista de
  // fiscais que a página buscou no banco. useMemo evita recalcular
  // essas listas a cada letra digitada em outro campo do formulário,
  // já que "fiscais" só muda quando a página é recarregada.
  const { lideres, supervisores, coordenadores, pessoasPagamento } = useMemo(() => {
    const supervisoresUnicos = new Set<string>()
    const coordenadoresUnicos = new Set<string>()
    const pessoasUnicas = new Set<string>()

    for (const fiscal of fiscais) {
      supervisoresUnicos.add(fiscal.supervisor)
      coordenadoresUnicos.add(fiscal.coordenador)
      pessoasUnicas.add(fiscal.nome)
      pessoasUnicas.add(fiscal.supervisor)
      pessoasUnicas.add(fiscal.coordenador)
    }

    const ordenar = (valores: Set<string>) =>
      Array.from(valores).sort((a, b) => a.localeCompare(b, 'pt-BR'))

    return {
      lideres: ordenar(new Set(fiscais.map((f) => f.nome))),
      supervisores: ordenar(supervisoresUnicos),
      coordenadores: ordenar(coordenadoresUnicos),
      pessoasPagamento: ordenar(pessoasUnicas),
    }
  }, [fiscais])

  // Mesmo princípio dos fiscais: um mapa pronto, nome → dados
  // completos, pra consultar em O(1) a cada letra digitada.
  const eletricistaPorNome = useMemo(() => {
    const mapa: Record<string, Eletricista> = {}
    for (const eletricista of eletricistas) {
      mapa[eletricista.nome] = eletricista
    }
    return mapa
  }, [eletricistas])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm<CosturaFormValues>({
    resolver: zodResolver(costuraSchema),
    defaultValues: {
      status_entrega: 'pendente',
      status_pagamento: 'pendente',
      itens: [{ tipo: 'camisa', quantidade: '1' }],
      ...valoresIniciais,
    },
  })

  // useFieldArray é o que permite "adicionar" e "remover" itens de
  // fardamento dinamicamente — cada item vira uma entrada na lista
  // "itens" do formulário, sem precisar de um número fixo de campos.
  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })

  const temPreco = !!watch('quantidade_pagamento')

  const registroEletricista = register('eletricista_nome')

  const [pagoPorOutro, setPagoPorOutro] = useState(
    () =>
      !!valoresIniciais?.pago_por &&
      !pessoasPagamento.includes(valoresIniciais.pago_por)
  )

  async function aoClicarAvancar() {
    // trigger() valida só os campos que a gente passa — nada da
    // etapa 2 é checado aqui, já que ela ainda nem apareceu na tela.
    const valido = await trigger(CAMPOS_ETAPA_1)
    if (valido) setEtapa(2)
  }

  async function aoEnviar(valores: CosturaFormValues) {
    setEnviando(true)

    const resultado = await aoSalvar(valores)

    if (resultado?.erro) {
      toast.mostrarErro(resultado.erro)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} className="max-w-xl space-y-4">
      {/* ================= ETAPA 1 ================= */}
      <div className={etapa === 1 ? 'space-y-4' : 'hidden'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            label="Nome do eletricista"
            erro={errors.eletricista_nome?.message}
          >
            <input
              {...registroEletricista}
              onChange={(evento) => {
                registroEletricista.onChange(evento)

                const eletricista = eletricistaPorNome[evento.target.value]
                if (!eletricista) return

                setValue('matricula', eletricista.matricula)
                setValue('prefixo', eletricista.prefixo ?? '')
                setValue('lider', eletricista.lider ?? '')
                setValue('supervisor', eletricista.supervisor ?? '')
                setValue('coordenador', eletricista.coordenador ?? '')
                setValue('polo', eletricista.polo ?? '')
                setValue('base', eletricista.base ?? '')
                setValue('processo_equipe', eletricista.processo_equipe ?? '')
              }}
              list="lista-eletricistas"
              className={estiloInput}
            />
            <datalist id="lista-eletricistas">
              {eletricistas.map((eletricista) => (
                <option key={eletricista.id} value={eletricista.nome} />
              ))}
            </datalist>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Líder" erro={errors.lider?.message}>
            <select {...register('lider')} className={estiloInput}>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Polo" erro={errors.polo?.message}>
            <select {...register('polo')} className={estiloInput}>
              <option value="">Selecione</option>
              {POLOS.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Base" erro={errors.base?.message}>
            <select {...register('base')} className={estiloInput}>
              <option value="">Selecione</option>
              {BASES.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Processo da equipe" erro={errors.processo_equipe?.message}>
            <select {...register('processo_equipe')} className={estiloInput}>
              <option value="">Selecione</option>
              {PROCESSOS_EQUIPE.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo label="Local de costura" erro={errors.local_costura?.message}>
          <input {...register('local_costura')} className={estiloInput} />
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Recebido em" erro={errors.recebido_em?.message}>
            <input type="date" {...register('recebido_em')} className={estiloInput} />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          type="button"
          onClick={aoClicarAvancar}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Avançar
        </button>
      </div>

      {/* ================= ETAPA 2 — ITENS DE FARDAMENTO ================= */}
      <div className={etapa === 2 ? 'space-y-4' : 'hidden'}>
        <p className="text-sm text-ink/60">
          Quantas peças de cada tipo foram costuradas? Adicione quantos itens
          precisar.
        </p>

        <div className="space-y-3">
          {fields.map((field, indice) => (
            <div key={field.id} className="flex items-end gap-3">
              <Campo
                label="Tipo"
                erro={errors.itens?.[indice]?.tipo?.message}
              >
                <select
                  {...register(`itens.${indice}.tipo`)}
                  className={estiloInput}
                >
                  {TIPOS_FARDAMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_FARDAMENTO_LABEL[tipo]}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo
                label="Quantidade"
                erro={errors.itens?.[indice]?.quantidade?.message}
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  {...register(`itens.${indice}.quantidade`)}
                  className={estiloInput}
                />
              </Campo>
              <button
                type="button"
                onClick={() => remove(indice)}
                disabled={fields.length === 1}
                aria-label="Remover item"
                className="mb-[9px] shrink-0 rounded-md border border-border p-2 text-ink/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {errors.itens?.root?.message && (
          <p className="text-xs text-primary">{errors.itens.root.message}</p>
        )}

        <button
          type="button"
          onClick={() => append({ tipo: 'camisa', quantidade: '1' })}
          className="flex items-center gap-1 text-sm text-secondary hover:underline"
        >
          <Plus size={14} /> Adicionar item
        </button>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEtapa(1)}
            className="rounded-md border border-border px-4 py-2 text-sm text-ink hover:bg-surface"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {enviando ? 'Salvando...' : textoBotao}
          </button>
        </div>
      </div>
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