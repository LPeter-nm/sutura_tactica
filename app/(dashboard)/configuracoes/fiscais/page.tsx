// app/(dashboard)/configuracoes/fiscais/page.tsx

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { buscarFiscais } from '@/lib/fiscais'
import { BotaoExcluir } from '@/components/botao-excluir'
import { excluirFiscal } from './actions'

export default async function PaginaEquipe() {
  const fiscais = await buscarFiscais()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Equipe</h1>
        </div>
        <Link
          href="/configuracoes/fiscais/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Novo fiscal
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-ink/50">
            <tr>
              <th className="px-4 py-3">Fiscal</th>
              <th className="px-4 py-3">Supervisor</th>
              <th className="px-4 py-3">Coordenador</th>
              <th className="px-4 py-3">Polo</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fiscais.map((fiscal) => (
              <tr
                key={fiscal.id}
                className="border-b border-border last:border-0 hover:bg-surface"
              >
                <td className="px-4 py-3 text-ink">{fiscal.nome}</td>
                <td className="px-4 py-3 text-ink/70">{fiscal.supervisor}</td>
                <td className="px-4 py-3 text-ink/70">{fiscal.coordenador}</td>
                <td className="px-4 py-3 text-ink/70">{fiscal.polo ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">{fiscal.base ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/configuracoes/fiscais/${fiscal.id}/editar`}
                      aria-label="Editar"
                      className="text-ink/50 hover:text-secondary"
                    >
                      <Pencil size={16} />
                    </Link>
                    <BotaoExcluir
                      aoExcluir={excluirFiscal.bind(null, fiscal.id)}
                      confirmar={`Remover "${fiscal.nome}" da equipe? Isso não muda nenhuma costura já cadastrada, só deixa de oferecê-lo nos próximos cadastros.`}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {fiscais.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                  Nenhum fiscal cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}