// lib/validations/fiscal.ts

import { z } from 'zod'

export const fiscalSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do fiscal'),
  supervisor: z.string().trim().min(1, 'Informe o supervisor'),
  coordenador: z.string().trim().min(1, 'Informe o coordenador'),
  polo: z.string().trim().optional(),
  base: z.string().trim().optional(),
})

export type FiscalFormValues = z.infer<typeof fiscalSchema>