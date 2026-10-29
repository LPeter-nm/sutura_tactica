// components/novo-usuario-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usuarioSchema, type UsuarioFormValues } from '@/lib/validations/usuario'
import { useToast } from '@/components/toast-provider'
import { criarUsuario } from '@/app/(dashboard)/configuracoes/usuarios/actions'

export function NovoUsuarioForm() {
  const [enviando, setEnviando] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormValues>({ resolver: zodResolver(usuarioSchema) })

  async function aoEnviar(valores: UsuarioFormValues) {
    setEnviando(true)
    const resultado = await criarUsuario(valores)

    if (resultado?.erro) {
      toast.mostrarErro(resultado.erro)
    } else {
      // Diferente do formulário de costura, este não redireciona —
      // a pessoa fica na mesma tela, criando usuário atrás de
      // usuário se precisar. reset() limpa os campos pro próximo.
      toast.mostrarSucesso('Usuário criado com sucesso.')
      reset()
    }
    setEnviando(false)
  }

  return (
    <form
      onSubmit={handleSubmit(aoEnviar)}
      className="flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="mb-1 block text-sm text-ink">E-mail</label>
        <input
          type="email"
          {...register('email')}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-primary">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink">Senha provisória</label>
        <input
          type="text"
          {...register('senha')}
          placeholder="mín. 6 caracteres"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-ink"
        />
        {errors.senha && (
          <p className="mt-1 text-xs text-primary">{errors.senha.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {enviando ? 'Criando...' : 'Criar usuário'}
      </button>
    </form>
  )
}