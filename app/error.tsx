'use client'

import { useEffect } from 'react'

// Diferente das outras páginas, esta PRECISA ser "use client" — é
// uma regra do Next.js para esse tipo especial de arquivo. Ela
// recebe o erro que aconteceu e uma função reset(), que tenta
// renderizar a página de novo, sem precisar recarregar tudo.
export default function ErroGeral({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Por enquanto, só registramos no console do servidor. Se um
    // dia vocês quiserem monitorar erros de produção de verdade,
    // é aqui que entraria uma ferramenta como o Sentry.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-sm font-medium text-primary">Erro 500</span>
      <h1 className="text-xl font-semibold text-ink">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-ink/60">
        Não foi possível completar essa ação. Tente novamente — se o
        problema continuar, avise a administração.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Tentar novamente
      </button>
    </main>
  )
}
