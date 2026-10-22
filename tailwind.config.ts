import type { Config } from 'tailwindcss'

// Aqui a paleta ganha nome. Em vez de espalhar códigos hexadecimais
// pelos componentes (#C1272D aqui, #C1272D ali), damos um nome com
// significado a cada cor — "primary", "secondary" — e o Tailwind
// gera classes como bg-primary, text-secondary, border-ink sozinho.
//
// Isso importa por um motivo prático: se um dia a DPL trocar o tom
// de azul oficial, você muda em UM lugar, aqui, e o sistema inteiro
// se atualiza sozinho.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A1A', // preto da máquina — texto principal, estrutura
        surface: '#FAFAFA', // fundo da aplicação
        card: '#FFFFFF', // fundo de cartões e tabelas

        primary: {
          DEFAULT: '#C1272D', // vermelho da máquina — ações, alertas
          dark: '#8E1D22',
          light: '#F6D9DA',
        },
        secondary: {
          DEFAULT: '#1E4E8C', // azul DPL — navegação, status "em produção"
          dark: '#163A68',
          light: '#DCE8F7',
        },

        border: '#E4E2DF',
      },
    },
  },
}

export default config
