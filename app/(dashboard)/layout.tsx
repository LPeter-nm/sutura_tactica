// app/(dashboard)/layout.tsx

import { createClient } from '@/lib/supabase/server'
import { sair } from '../login/actions'
import { ThemeToggle } from '@/components/theme-toggle'
import { Sidebar } from '@/components/sidebar'

// Com o Cache Components desligado (veja next.config.ts), o Next.js
// volta a detectar sozinho que esta página é dinâmica, só de perceber
// que ela lê cookies/sessão por baixo dos panos. Nenhuma declaração
// especial é necessária aqui.

// Este layout envolve todas as páginas internas do sistema (tudo
// que fica dentro da pasta "(dashboard)"). Os parênteses no nome
// da pasta são um recurso do Next.js chamado "route group" — eles
// organizam os arquivos sem aparecer na URL. Ou seja: esta página
// de costuras vai responder em /costuras, não em /dashboard/costuras.
//
// Note que já não precisamos checar "será que tem usuário logado?"
// aqui dentro — o middleware já garantiu isso antes de a requisição
// sequer chegar neste componente. Mas ainda buscamos os dados do
// usuário, porque queremos *mostrar* quem está logado.
export default async function LayoutDashboard({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Já tínhamos o usuário buscado aqui mesmo (pra mostrar o e-mail no
  // cabeçalho) — então só olhamos o app_metadata dele direto, sem
  // chamar ehAdmin() de novo e duplicar a mesma busca.
  const admin = user?.app_metadata?.role === 'admin'

  return (
    <div className="flex min-h-screen">
      <Sidebar admin={admin} />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-border bg-card py-3 pl-16 pr-4 text-sm sm:px-6">
          <span className="text-ink/60">{user?.email}</span>
          <ThemeToggle />
          <form action={sair}>
            <button
              type="submit"
              className="text-secondary hover:text-secondary-dark"
            >
              Sair
            </button>
          </form>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}