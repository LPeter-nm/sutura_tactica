// lib/validations/costura.ts

import { z } from 'zod'
import { STATUS_VALUES, STATUS_VALUES_PAGAMENTO, TIPOS_FARDAMENTO } from '@/types/costura'

// Um item da segunda etapa do formulário: um tipo de peça e quantas
// unidades dela. A costura inteira precisa de pelo menos um.
//
// "quantidade" fica como texto, igual quantidade_pagamento mais
// abaixo — um <input type="number"> do navegador entrega string pro
// React Hook Form, não número; forçar o tipo pra "number" aqui só
// criaria atrito entre o que o HTML manda e o que o TypeScript
// espera. A conversão de verdade acontece na Server Action.
export const itemFardamentoSchema = z.object({
  tipo: z.enum(TIPOS_FARDAMENTO),
  quantidade: z
    .string()
    .min(1, 'Informe a quantidade')
    .refine(
      (v) => /^\d+$/.test(v) && Number(v) >= 1,
      'Informe um número inteiro de pelo menos 1'
    ),
})

// Este schema é usado em dois lugares: no formulário (pra avisar a
// pessoa na hora que ela erra um campo) e na Server Action (pra
// garantir que nada inválido chega ao banco, mesmo que alguém
// tente chamar a função sem passar pelo formulário). É por isso
// que ele mora num arquivo à parte, importável dos dois lados.
export const costuraSchema = z.object({
  eletricista_nome: z.string().trim().min(1, 'Informe o nome do eletricista'),
  matricula: z.string().trim().optional(),
  prefixo: z.string().trim().optional(),
  lider: z.string().trim().optional(),
  supervisor: z.string().trim().optional(),
  coordenador: z.string().trim().optional(),
  polo: z.string().trim().optional(),
  base: z.string().trim().optional(),
  processo_equipe: z.string().trim().optional(),

  // Fica como texto mesmo — é o que um <input> entrega. A conversão
  // pra número só acontece depois, na hora de salvar no banco
  // (veja app/(dashboard)/costuras/actions.ts). Vazio é permitido,
  // já que o campo é opcional.
  quantidade_pagamento: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), 'Informe um número válido')
    .refine((v) => !v || Number(v) >= 0, 'Não pode ser negativo'),

  local_costura: z.string().trim().min(1, 'Informe o local de costura'),
  recebido_em: z.string().min(1, 'Informe a data da costura'),
  status_entrega: z.enum(STATUS_VALUES),

  // Os dois a seguir são opcionais de propósito: só fazem sentido
  // quando existe um preço. A regra que decide isso de fato mora na
  // Server Action, não aqui.
  status_pagamento: z.enum(STATUS_VALUES_PAGAMENTO).optional(),
  pago_por: z.string().trim().optional(),

  // A segunda etapa do formulário inteira — precisa de ao menos um
  // item, senão a costura não diz o que foi costurado.
  itens: z
    .array(itemFardamentoSchema)
    .min(1, 'Adicione ao menos um item de fardamento'),
})

export type CosturaFormValues = z.infer<typeof costuraSchema>