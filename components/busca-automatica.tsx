// components/busca-automatica.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function BuscaAutomatica({ valorInicial }: { valorInicial?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [valor, setValor] = useState(valorInicial ?? '')
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Limpa um temporizador pendente se o componente sair da tela no
  // meio do caminho — evita tentar navegar depois que ninguém mais
  // está olhando pra essa página.
  useEffect(() => () => clearTimeout(temporizador.current), [])

  function aoDigitar(evento: React.ChangeEvent<HTMLInputElement>) {
    const novoValor = evento.target.value
    setValor(novoValor)

    // A cada tecla, cancela o temporizador anterior e começa um novo
    // — só quando a pessoa fica 400ms sem digitar é que a busca de
    // verdade acontece. Datilografar uma palavra inteira dispara UMA
    // busca, não uma por letra.
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      const parametros = new URLSearchParams(searchParams.toString())
      if (novoValor) {
        parametros.set('busca', novoValor)
      } else {
        parametros.delete('busca')
      }
      router.replace(`${pathname}?${parametros.toString()}`, { scroll: false })
    }, 400)
  }

  return (
    <input
      type="text"
      name="busca"
      value={valor}
      onChange={aoDigitar}
      placeholder="Eletricista ou prefixo"
      className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink"
    />
  )
}