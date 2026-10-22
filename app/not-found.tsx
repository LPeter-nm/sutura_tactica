import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-sm font-medium text-primary">Erro 404</span>
      <h1 className="text-xl font-semibold text-ink">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-ink/60">
        O endereço acessado não existe, ou a costura que você procura pode
        ter sido removida.
      </p>
      <Link
        href="/costuras"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Voltar para a listagem
      </Link>
    </main>
  )
}
