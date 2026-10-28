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
} from 'lucide-react'

const LINKS = [
  { href: '/costuras', rotulo: 'Costuras', Icone: Shirt },
  { href: '/configuracoes/fiscais', rotulo: 'Fiscais', Icone: Users },
  { href: '/configuracoes/usuarios', rotulo: 'Usuários', Icone: UserCog },
]

const CHAVE_LOCALSTORAGE = 'barra-lateral-recolhida'

export function Sidebar() {
  const caminhoAtual = usePathname()
  const [recolhida, setRecolhida] = useState(false)

  // Lembra a escolha entre uma visita e outra, igual já fazemos com
  // o tema — mesmo princípio, mesmo lugar (localStorage), mesma
  // razão (é só uma preferência de tela, não precisa do banco).
  useEffect(() => {
    setRecolhida(localStorage.getItem(CHAVE_LOCALSTORAGE) === '1')
  }, [])

  function alternar() {
    const proximo = !recolhida
    setRecolhida(proximo)
    localStorage.setItem(CHAVE_LOCALSTORAGE, proximo ? '1' : '0')
  }

  return (
    <aside
      className={`flex shrink-0 flex-col gap-6 border-r border-border bg-card p-4
                  transition-[width] duration-200 ${recolhida ? 'w-16' : 'w-56'}`}
    >
      <div className="flex items-center gap-2 overflow-hidden px-1">
        <span className="h-2 w-6 shrink-0 rounded-sm bg-primary" />
        {!recolhida && (
          <span className="whitespace-nowrap text-sm font-semibold text-ink">
            Controle de Costuras
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map(({ href, rotulo, Icone }) => {
          const ativo =
            caminhoAtual === href || caminhoAtual.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              // Com a barra recolhida, o nome some da tela — o title
              // vira a única forma de confirmar o que cada ícone é,
              // aparecendo ao pairar o mouse em cima.
              title={recolhida ? rotulo : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                recolhida ? 'justify-center' : ''
              } ${
                ativo
                  ? 'bg-primary text-white'
                  : 'text-ink/70 hover:bg-surface hover:text-ink'
              }`}
            >
              <Icone size={16} className="shrink-0" />
              {!recolhida && rotulo}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={alternar}
        aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
        className="mt-auto flex items-center justify-center rounded-md border
                   border-border py-2 text-ink/50 hover:bg-surface hover:text-ink"
      >
        {recolhida ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </aside>
  )
}