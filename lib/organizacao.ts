// lib/organizacao.ts
//
// Listas fechadas, vindas da planilha de equipes — diferente dos
// fiscais e eletricistas (que crescem e mudam com frequência), polo,
// base e processo de equipe são categorias organizacionais estáveis.
// Por isso ficam aqui, em código, e não numa tabela à parte.

export const POLOS = [
  'Campo Maior',
  'Marques',
  'Monte Castelo',
  'Sao Pedro',
  'Teresina',
  'Uniao',
] as const

export const BASES = [
  'Agua Branca',
  'Alto Longa',
  'Altos',
  'Amarante',
  'Barras',
  'Barro Duro',
  'Campo Maior',
  'Castelo do Paui',
  'Castelo do Piaui',
  'Demerval Lobao',
  'Jose de Freitas',
  'Miguel Alves',
  'Monsenhor Gil',
  'Nazaria',
  'Palmeirais',
  'Regeneracao',
  'Sao Miguel do Tapuio',
  'Sao Pedro',
  'Sigefredo Pacheco',
  'Teresina',
  'Uniao',
] as const

export const PROCESSOS_EQUIPE = ['Comercial', 'Inspecao', 'Plantao'] as const