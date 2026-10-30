// components/costura-form.tsx
'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { costuraSchema, type CosturaFormValues } from '@/lib/validations/costura'
import { STATUS_ENTREGA, STATUS_PAGAMENTO } from '@/types/costura'
import { useToast } from '@/components/toast-provider'
import type { Fiscal } from '@/lib/fiscais'
import type { Eletricista } from '@/lib/eletricistas'
import { POLOS, BASES, PROCESSOS_EQUIPE } from '@/lib/organizacao'

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
  const toast = useToast()

  // Tudo que os selects precisam sai de UMA fonte só — a lista de
  // fiscais que a página buscou no banco. useMemo evita recalcular
  // essas listas a cada letra digitada em outro campo do formulário,
  // já que "fiscais" só muda quando a página é recarregada.
  //
  // Diferente de antes, nenhuma dessas listas dispara preenchimento
  // automático sozinha — elas só fornecem as OPÇÕES dos selects. Quem
  // decide o que preencher agora é só o eletricista escolhido, logo
  // abaixo.
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

  // Mesmo princípio dos fiscais: um mapa pronto, nome → {matrícula,
  // prefixo}, pra consultar em O(1) a cada letra digitada, sem
  // percorrer a lista inteira de eletricistas toda vez.
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

  // Guardamos o retorno de register('eletricista_nome') numa
  // variável, em vez de espalhar {...register(...)} direto no JSX,
  // porque precisamos do onChange original dele — pra chamar à mão,
  // dentro do NOSSO onChange, que agora faz TODO o preenchimento
  // automático: matrícula, prefixo, líder, supervisor, coordenador,
  // polo, base e processo da equipe, tudo de uma vez.
  const registroEletricista = register('eletricista_nome')

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="Nome do eletricista"
          erro={errors.eletricista_nome?.message}
        >
          {/* list="..." liga este input a um <datalist> — o navegador
              sozinho já mostra as sugestões que batem com o que foi
              digitado, sem nenhuma biblioteca extra pra isso. */}
          <input
            {...registroEletricista}
            onChange={(evento) => {
              registroEletricista.onChange(evento)

              const eletricista = eletricistaPorNome[evento.target.value]
              if (!eletricista) return

              setValue('matricula', eletricista.matricula)
              setValue('prefixo', eletricista.prefixo ?? '')
              // Líder pode vir vazio de propósito — nem todo
              // eletricista tem um nome de pessoa aqui na planilha
              // original, alguns só têm um rótulo genérico de
              // equipe, que não faz sentido tratar como um líder.
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Tipo de fardamento" erro={errors.tipo_fardamento?.message}>
          <input {...register('tipo_fardamento')} className={estiloInput} />
        </Campo>
        <Campo label="Local de costura" erro={errors.local_costura?.message}>
          <input {...register('local_costura')} className={estiloInput} />
        </Campo>
      </div>

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
        type="submit"
        disabled={enviando}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
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