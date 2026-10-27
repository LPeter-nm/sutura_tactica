// lib/pessoas.ts
//
// Essas listas mudam pouco — pessoas não trocam de função todo dia —
// então faz mais sentido mantê-las aqui, direto no código, do que
// criar uma tabela nova só pra guardar nomes. Se um dia isso passar
// a mudar com frequência, aí sim vale a pena migrar para uma tela de
// cadastro de verdade, com um botão de "adicionar pessoa".

export const LIDERES = [
  'Afrancisco',
  'Andressa Rocha',
  'Antonio Aniezio da Silva',
  'Antonio Cleuton Freitas Gomes',
  'Cezar Viana',
  'Elves',
  'Francisco Rodrigo dos Santos Sousa',
  'Fredison Luis Mendes',
  'Gerson Silva',
  'Jorge Castelo',
  'Jorge União',
  'Ledegelson',
  'Nailton',
  'Paulo Antonio',
  'Pedro Paulo',
  'Rafael Varao',
  'Raifran',
  'Walafe Pires',
  'Wanderson',
  'Wodson',
] as const

export const SUPERVISORES = [
  'Chrisley',
  'Daniel Santos',
  'Daniel Viana',
  'Jose Francisco Silva',
  'Marcilio da Silva Araujo',
  'Marcos Diego',
  'Odair Alves Machado',
  'Victor Henrique de Carvalho Isaias',
] as const

export const COORDENADORES = ['Edmilson Soares', 'Gileno Ribeiro', 'Paulo Henrique'] as const

// Quem pode aparecer como "pago por" — a união das três listas
// acima, sem repetir nomes, em ordem alfabética. Só é usada ali,
// nunca nos três selects de cima.
export const PESSOAS_PAGAMENTO = Array.from(
  new Set<string>([...LIDERES, ...SUPERVISORES, ...COORDENADORES])
).sort((a, b) => a.localeCompare(b, 'pt-BR'))

// A relação de verdade, tirada da planilha original: cada líder
// trabalha, na prática, com um supervisor e um coordenador fixos.
// Quando um líder aparece com mais de uma combinação diferente no
// histórico (dado real, mesmo que estranho), supervisor e
// coordenador ficam null aqui — é o sinal para o formulário NÃO
// preencher sozinho, e avisar a pessoa que precisa escolher na mão.
type EquipeDoLider = { supervisor: string | null; coordenador: string | null }

export const EQUIPE_POR_LIDER: Record<string, EquipeDoLider> = {
  Afrancisco: { supervisor: 'Daniel Santos', coordenador: 'Gileno Ribeiro' }, // ambíguo no histórico
  'Andressa Rocha': { supervisor: 'Daniel Santos', coordenador: 'Gileno Ribeiro' },
  'Antonio Aniezio da Silva': {
    supervisor: 'Jose Francisco Silva',
    coordenador: 'Edmilson Soares',
  },
  'Antonio Cleuton Freitas Gomes': {
    supervisor: 'Jose Francisco Silva',
    coordenador: 'Edmilson Soares',
  },
  'Cezar Viana': { supervisor: 'Daniel Viana', coordenador: 'Paulo Henrique' }, 
  Elves: { supervisor: 'Chrisley', coordenador: 'Gileno Ribeiro' },
  'Francisco Rodrigo dos Santos Sousa': {
    supervisor: 'Jose Francisco Silva',
    coordenador: 'Edmilson Soares',
  },
  'Fredison Luis Mendes': {
    supervisor: 'Marcilio da Silva Araujo',
    coordenador: 'Edmilson Soares',
  },
  'Gerson Silva': { supervisor: 'Marcos Diego', coordenador: 'Paulo Henrique' },
  'Jorge Castelo': { supervisor: 'Odair Alves Machado', coordenador: 'Edmilson Soares' },
  'Jorge União': { supervisor: 'Daniel Santos', coordenador: 'Gileno Ribeiro' },
  Ledegelson: { supervisor: 'Chrisley', coordenador: 'Gileno Ribeiro' },
  Nailton: { supervisor: 'Chrisley', coordenador: 'Gileno Ribeiro' },
  'Paulo Antonio': { supervisor: null, coordenador: 'Paulo Henrique' }, // ambíguo no histórico
  'Pedro Paulo': { supervisor: 'Daniel Viana', coordenador: 'Paulo Henrique' },
  'Rafael Varao': { supervisor: 'Daniel Viana', coordenador: 'Paulo Henrique' }, // ambíguo no histórico
  Raifran: { supervisor: 'Daniel Santos', coordenador: 'Gileno Ribeiro' },
  'Walafe Pires': { supervisor: 'Daniel Santos', coordenador: 'Gileno Ribeiro' },
  Wanderson: { supervisor: 'Chrisley', coordenador: 'Gileno Ribeiro' },
  Wodson: { supervisor: 'Marcos Diego', coordenador: 'Paulo Henrique' },
}