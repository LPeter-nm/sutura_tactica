// components/tabela-costuras.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge, StatusPagamentoBadge } from '@/components/status-badge'
import { BotaoExcluir } from '@/components/botao-excluir'
import { useToast } from '@/components/toast-provider'
import { formatarDataBR } from '@/lib/datas'
import type { Costura } from '@/types/costura'
import {
  excluirCostura,
  excluirCosturas,
  registrarPagamentoEmLote,
} from '@/app/(dashboard)/costuras/actions'

export function TabelaCosturas({
  costuras,
  pessoas,
}: {
  costuras: Costura[]
  // Nomes sugeridos no campo "Pago por" (líderes, supervisores e
  // coordenadores que já aparecem nas costuras). É só sugestão: dá
  // pra digitar qualquer outro nome.
  pessoas: string[]
}) {
  // O estado de seleção só pode viver aqui, num Client Component —
  // é por isso que a tabela inteira (que antes era renderizada direto
  // pela página, do lado do servidor) virou este arquivo à parte.
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [excluindo, iniciarExclusao] = useTransition()
  const [registrando, iniciarRegistro] = useTransition()
  const [pagoPor, setPagoPor] = useState('')
  const [marcarComoPago, setMarcarComoPago] = useState(true)
  const toast = useToast()

  const todosMarcados =
    costuras.length > 0 && costuras.every((c) => selecionados.has(c.id))

  function alternarTodos() {
    if (todosMarcados) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(costuras.map((c) => c.id)))
    }
  }

  function alternarUm(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) {
        novo.delete(id)
      } else {
        novo.add(id)
      }
      return novo
    })
  }

  function aoRegistrarPagamento() {
    const nome = pagoPor.trim()
    if (!nome) {
      toast.mostrarErro('Informe o nome de quem pagou.')
      return
    }

    const ids = Array.from(selecionados)

    iniciarRegistro(async () => {
      const resultado = await registrarPagamentoEmLote(ids, nome, marcarComoPago)

      if ('erro' in resultado) {
        toast.mostrarErro(resultado.erro)
        return
      }

      if (resultado.atualizadas === 0) {
        toast.mostrarErro(
          'Nenhuma costura foi atualizada: as selecionadas não têm valor a pagar.'
        )
        return
      }

      const textoIgnoradas =
        resultado.ignoradas > 0
          ? ` ${resultado.ignoradas} ${
              resultado.ignoradas === 1 ? 'foi ignorada' : 'foram ignoradas'
            } por não ter valor a pagar.`
          : ''

      toast.mostrarSucesso(
        `Pagamento registrado em ${resultado.atualizadas} ${
          resultado.atualizadas === 1 ? 'costura' : 'costuras'
        }.${textoIgnoradas}`
      )
      setSelecionados(new Set())
      setPagoPor('')
    })
  }

  function aoExcluirSelecionados() {
    const ids = Array.from(selecionados)
    if (
      !window.confirm(
        `Excluir ${ids.length} ${
          ids.length === 1 ? 'costura' : 'costuras'
        } selecionadas? Essa ação não pode ser desfeita.`
      )
    ) {
      return
    }

    iniciarExclusao(async () => {
      const resultado = await excluirCosturas(ids)
      if (resultado?.erro) {
        toast.mostrarErro(resultado.erro)
      } else {
        toast.mostrarSucesso(
          `${ids.length} ${
            ids.length === 1 ? 'costura excluída' : 'costuras excluídas'
          }.`
        )
        setSelecionados(new Set())
      }
    })
  }

  return (
    <div className="space-y-3">
      {selecionados.size > 0 && (
        <div className="space-y-3 rounded-md border border-primary/30 bg-primary-light px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-primary-dark">
              {selecionados.size}{' '}
              {selecionados.size === 1
                ? 'costura selecionada'
                : 'costuras selecionadas'}
            </span>
            <button
              type="button"
              onClick={aoExcluirSelecionados}
              disabled={excluindo || registrando}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              <Trash2 size={14} />
              {excluindo ? 'Excluindo...' : 'Excluir selecionadas'}
            </button>
          </div>

          {/* Registrar quem pagou: um nome só, aplicado a todas as
              costuras marcadas de uma vez. */}
          <div className="flex flex-wrap items-end gap-3 border-t border-primary/20 pt-3">
            <label className="flex flex-col gap-1 text-xs text-primary-dark">
              Pago por
              <input
                value={pagoPor}
                onChange={(evento) => setPagoPor(evento.target.value)}
                list="lista-pessoas-pagamento"
                maxLength={100}
                placeholder="Digite ou escolha um nome"
                disabled={registrando}
                className="w-64 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-ink focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <datalist id="lista-pessoas-pagamento">
                {pessoas.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </label>

            <label className="flex items-center gap-2 pb-2 text-sm text-primary-dark">
              <input
                type="checkbox"
                checked={marcarComoPago}
                onChange={(evento) => setMarcarComoPago(evento.target.checked)}
                disabled={registrando}
                className="h-4 w-4 rounded border-border"
              />
              Marcar também como pago
            </label>

            <button
              type="button"
              onClick={aoRegistrarPagamento}
              disabled={registrando || excluindo}
              className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-white hover:bg-secondary-dark disabled:opacity-60"
            >
              {registrando ? 'Registrando...' : 'Registrar pagamento'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-ink/50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={todosMarcados}
                  onChange={alternarTodos}
                  aria-label="Selecionar todas"
                  className="h-4 w-4 rounded border-border"
                />
              </th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Eletricista</th>
              <th className="px-4 py-3">Prefixo</th>
              <th className="px-4 py-3">Líder</th>
              <th className="px-4 py-3">Recebido em</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Pago por</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {costuras.map((costura) => (
              <tr
                key={costura.id}
                className={`border-b border-border last:border-0 hover:bg-surface ${
                  selecionados.has(costura.id) ? 'bg-primary-light/40' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selecionados.has(costura.id)}
                    onChange={() => alternarUm(costura.id)}
                    aria-label={`Selecionar costura de ${costura.eletricista_nome}`}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
                <td className="px-4 py-3 text-ink/70">{costura.matricula ?? '—'}</td>
                <td className="px-4 py-3 text-ink">{costura.eletricista_nome}</td>
                <td className="px-4 py-3 text-ink/70">{costura.prefixo ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">{costura.lider ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">
                  {formatarDataBR(costura.recebido_em)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={costura.status_entrega} />
                </td>
                <td className="px-4 py-3">
                  <StatusPagamentoBadge status={costura.status_pagamento} />
                </td>
                <td className="px-4 py-3 text-ink/70">{costura.pago_por ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">
                  {costura.quantidade_pagamento ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/costuras/${costura.id}`}
                      aria-label="Ver detalhes"
                      className="text-ink/50 hover:text-secondary"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/costuras/${costura.id}/editar`}
                      aria-label="Editar"
                      className="text-ink/50 hover:text-primary"
                    >
                      <Pencil size={16} />
                    </Link>
                    <BotaoExcluir
                      aoExcluir={excluirCostura.bind(null, costura.id)}
                      confirmar={`Excluir a costura de ${costura.eletricista_nome}? Essa ação não pode ser desfeita — o histórico de status e os itens de fardamento dela também serão apagados.`}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {costuras.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-ink/50">
                  Nenhuma costura encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}