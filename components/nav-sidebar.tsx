// components/nav-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shirt, Users, UserCog } from 'lucide-react'

// Precisa ser Client Component só por causa do usePathname() — é a
// única forma de saber, no navegador, qual link destacar como
// "ativo" conforme a pessoa navega.
const LINKS = [
  { href: '/costuras', rotulo: 'Costuras', Icone: Shirt },
  { href: '/configuracoes/fiscais', rotulo: 'Fiscais', Icone: Users },
  { href: '/configuracoes/usuarios', rotulo: 'Usuários', Icone: UserCog },
]

export function NavSidebar() {
  const caminhoAtual = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, rotulo, Icone }) => {
        const ativo =
          caminhoAtual === href || caminhoAtual.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              ativo
                ? 'bg-primary text-white'
                : 'text-ink/70 hover:bg-surface hover:text-ink'
            }`}
          >
            <Icone size={16} />
            {rotulo}
          </Link>
        )
      })}
    </nav>
  )
}