'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/toast-provider'

// Este componente não desenha nada na tela — ele só existe pra
// rodar um efeito colateral assim que a listagem é montada: mostrar
// o aviso, e depois limpar o "?sucesso=..." da URL, pra ele não
// reaparecer se a pessoa der F5 na página em seguida.
export function AvisoSucesso({ mensagem }: { mensagem: string }) {
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    toast.mostrarSucesso(mensagem)
    router.replace('/costuras', { scroll: false })
    // Roda só uma vez, ao montar — por isso a lista de dependências
    // fica vazia de propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
