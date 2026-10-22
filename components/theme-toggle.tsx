'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

// Alterna entre os temas, e guarda a escolha no localStorage do
// navegador — é só uma preferência de tela, não precisa ir pro
// banco de dados nem depender de quem está logado.
export function ThemeToggle() {
  const [escuro, setEscuro] = useState(false)

  useEffect(() => {
    // Sincroniza o botão com o que o script do layout já aplicou
    // no <html> antes mesmo desta página carregar.
    setEscuro(document.documentElement.classList.contains('dark'))
  }, [])

  function alternar() {
    const proximo = !escuro
    setEscuro(proximo)
    document.documentElement.classList.toggle('dark', proximo)
    localStorage.setItem('tema', proximo ? 'escuro' : 'claro')
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Alternar tema claro/escuro"
      className="rounded-md border border-border bg-card p-2 text-ink hover:bg-surface"
    >
      {escuro ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
