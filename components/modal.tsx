'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// router.back() é a peça chave aqui: como chegamos neste modal
// através de uma navegação de verdade (um clique de link, que
// empilhou uma entrada no histórico do navegador), "voltar" é
// exatamente o mesmo que "fechar" — a pessoa volta pra listagem,
// de onde nunca realmente saiu.
export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') router.back()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [router])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={() => router.back()}
    >
      {/* stopPropagation: sem isso, clicar DENTRO da caixa também
          fecharia o modal, porque o clique "borbulharia" até o
          fundo escurecido logo acima. */}
      <div
        onClick={(evento) => evento.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        {children}
      </div>
    </div>
  )
}