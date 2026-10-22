import { createClient } from '@/lib/supabase/server'
import { sair } from '../login/actions'
import { ThemeToggle } from '@/components/theme-toggle'

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
