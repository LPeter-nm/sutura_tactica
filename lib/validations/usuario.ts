// lib/validations/usuario.ts

import { z } from 'zod'

export const usuarioSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
})

export type UsuarioFormValues = z.infer<typeof usuarioSchema>