import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast-provider'

export const metadata: Metadata = {
  title: 'Controle de Costuras',
  description: 'Controle de costuras de fardas de eletricistas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: o script abaixo pode adicionar a
    // classe "dark" ao <html> antes do React assumir o controle da
    // página. Sem isso, o React reclamaria de uma "diferença" entre
    // o que ele esperava renderizar e o que já está na tela — mesmo
    // sendo uma diferença esperada e proposital.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          // Roda ANTES de qualquer pixel ser pintado na tela. Lê a
          // preferência salva (ou, na primeira visita, a preferência
          // do sistema operacional da pessoa) e já aplica a classe
          // .dark de cara — assim ninguém vê um clarão de tela
          // branca por uma fração de segundo antes do tema escuro
          // "ligar".
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tema');var e=t?t==='escuro':window.matchMedia('(prefers-color-scheme: dark)').matches;if(e)document.documentElement.classList.add('dark');}catch(_){}})();`,
          }}
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
