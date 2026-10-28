'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type TipoToast = 'sucesso' | 'erro'

type Toast = {
  id: number
  tipo: TipoToast
  mensagem: string
}

type ToastContextType = {
  mostrarSucesso: (mensagem: string) => void
  mostrarErro: (mensagem: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

// Qualquer tela do sistema pode chamar useToast() pra avisar a
// pessoa que algo deu certo ou deu errado, sem precisar desenhar
// sua própria caixinha de novo a cada vez. É o mesmo princípio dos
// outros componentes compartilhados: a lógica mora num lugar só.
export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) {
    throw new Error('useToast precisa ser usado dentro de <ToastProvider>')
  }
  return contexto
}

let proximoId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const adicionar = useCallback((tipo: TipoToast, mensagem: string) => {
    const id = proximoId++
    setToasts((atual) => [...atual, { id, tipo, mensagem }])

    // Some sozinho depois de alguns segundos — a pessoa não precisa
    // interagir com ele pra continuar usando o sistema.
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const mostrarSucesso = useCallback(
    (mensagem: string) => adicionar('sucesso', mensagem),
    [adicionar]
  )
  const mostrarErro = useCallback(
    (mensagem: string) => adicionar('erro', mensagem),
    [adicionar]
  )

  function fechar(id: number) {
    setToasts((atual) => atual.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ mostrarSucesso, mostrarErro }}>
      {children}

      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => fechar(toast.id)}
            role="status"
            className={`cursor-pointer rounded-md border px-4 py-3 text-sm text-white shadow-lg
                        backdrop-blur-sm ${
                          toast.tipo === 'sucesso'
                            ? 'border-secondary/40 bg-secondary/80'
                            : 'border-primary/40 bg-primary/80'
                        }`}
          >
            {toast.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
