'use client'

import { useEffect } from 'react'
import { useToast } from '@/components/toast-provider'

export function AvisoErroLogin() {
  const toast = useToast()

  useEffect(() => {
    toast.mostrarErro('E-mail ou senha incorretos.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
