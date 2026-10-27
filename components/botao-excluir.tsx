// components/botao-excluir.tsx
'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/toast-provider'

// Recebe a Server Action já "pré-presa" ao id certo (via .bind()),
// igual já fazemos com atualizarCostura. A confirmação do navegador
// (window.confirm) é simples de propósito — uma exclusão não tem
// volta, então vale um obstáculo a mais antes dela acontecer.
export function BotaoExcluir({
  aoExcluir,
  confirmar,
}: {
  aoExcluir: () => Promise<{ erro?: string } | void>
  confirmar: string
}) {
  const [pendente, iniciarTransicao] = useTransition()
  const toast = useToast()

  function aoClicar() {
    if (!window.confirm(confirmar)) return

    iniciarTransicao(async () => {
      const resultado = await aoExcluir()
      if (resultado?.erro) {
        toast.mostrarErro(resultado.erro)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={pendente}
      aria-label="Excluir"
      className="text-ink/50 hover:text-primary disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  )
}