// components/sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shirt,
  Users,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react'

const LINKS_BASE = [{ href: '/costuras', rotulo: 'Costuras', Icone: Shirt }]

const LINKS_ADMIN = [
  { href: '/configuracoes/fiscais', rotulo: 'Fiscais', Icone: Users },
  { href: '/configuracoes/usuarios', rotulo: 'Usuários', Icone: UserCog },
]

const CHAVE_LOCALSTORAGE = 'barra-lateral-recolhida'

export function Sidebar({ admin }: { admin: boolean }) {
  const caminhoAtual = usePathname()
  const [recolhida, setRecolhida] = useState(false)
  // Separado de "recolhida" de propósito: no celular, a barra não
  // "encolhe pra ícones" — ela some inteira da tela e vira uma
  // gaveta, que abre por cima do conteúdo quando chamada.
  const [abertaNoCelular, setAbertaNoCelular] = useState(false)

  const links = admin ? [...LINKS_BASE, ...LINKS_ADMIN] : LINKS_BASE

  useEffect(() => {
    setRecolhida(localStorage.getItem(CHAVE_LOCALSTORAGE) === '1')
  }, [])

  // Toda vez que a pessoa navega pra outra tela, fecha a gaveta
  // sozinha — sem isso, ela ficaria aberta cobrindo a tela nova.
  useEffect(() => {
    setAbertaNoCelular(false)
  }, [caminhoAtual])

  function alternarRecolhida() {
    const proximo = !recolhida
    setRecolhida(proximo)
    localStorage.setItem(CHAVE_LOCALSTORAGE, proximo ? '1' : '0')
  }

  return (
    <>
      {/* Só existe em telas pequenas (md:hidden) — em telas grandes,
          a barra já está sempre visível, não precisa de botão pra
          chamar ela. */}
      {!abertaNoCelular && (
        <button
          type="button"
          onClick={() => setAbertaNoCelular(true)}
          aria-label="Abrir menu"
          className="fixed left-3 top-3 z-20 rounded-md border border-border bg-card p-2 text-ink/70 shadow-sm md:hidden"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Fundo escurecido atrás da gaveta — clicar nele fecha,
          exatamente como os outros modais do sistema. Só aparece
          em telas pequenas, e só quando a gaveta está aberta. */}
      {abertaNoCelular && (
        <div
          onClick={() => setAbertaNoCelular(false)}
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6
                    border-r border-border bg-card p-4 transition-transform
                    duration-200 md:static md:z-auto md:translate-x-0
                    md:transition-[width] ${
                      abertaNoCelular ? 'translate-x-0' : '-translate-x-full'
                    } ${recolhida ? 'md:w-16' : 'md:w-56'}`}
      >
        <div className="flex items-center justify-between gap-2 overflow-hidden px-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="h-2 w-6 shrink-0 rounded-sm bg-primary" />
            {!recolhida && (
              <span className="whitespace-nowrap text-sm font-semibold text-ink">
                Controle de Costuras
              </span>
            )}
          </div>

          {/* Fechar pelo X só faz sentido na gaveta do celular — no
              desktop, a barra nunca "fecha", só recolhe. */}
          <button
            type="button"
            onClick={() => setAbertaNoCelular(false)}
            aria-label="Fechar menu"
            className="text-ink/50 hover:text-ink md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* O botão de recolher/expandir é uma ideia de desktop — no
            celular, a barra já é tudo-ou-nada (aberta ou fechada),
            então ele fica escondido ali também. */}
        <button
          type="button"
          onClick={alternarRecolhida}
          aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
          className="hidden items-center justify-center rounded-md border border-border py-2 text-ink/50 hover:bg-surface hover:text-ink md:flex"
        >
          {recolhida ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <nav className="flex flex-col gap-1">
          {links.map(({ href, rotulo, Icone }) => {
            const ativo =
              caminhoAtual === href || caminhoAtual.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                title={recolhida ? rotulo : undefined}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  recolhida ? 'md:justify-center' : ''
                } ${
                  ativo
                    ? 'bg-primary text-white'
                    : 'text-ink/70 hover:bg-surface hover:text-ink'
                }`}
              >
                <Icone size={16} className="shrink-0" />
                <span className={recolhida ? 'md:hidden' : ''}>{rotulo}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}