import { createClient } from '@/lib/supabase/server'
import { sair } from '../login/actions'
import { ThemeToggle } from '@/components/theme-toggle'

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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-sm bg-primary" />
          <span className="font-semibold text-ink">Controle de Costuras</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
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
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  )
}
