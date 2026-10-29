// app/login/page.tsx

import { entrar } from './actions'
import { AvisoErroLogin } from '@/components/aviso-erro-login'

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-ink">
          Controle de Costuras
        </h1>
        <p className="mb-6 text-sm text-ink/60">
          Entre com sua conta da administração
        </p>

        <form action={entrar} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ink">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm text-ink">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          {erro === 'credenciais_invalidas' && <AvisoErroLogin />}

          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  )
}