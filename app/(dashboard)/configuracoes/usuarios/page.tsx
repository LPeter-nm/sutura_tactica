// app/(dashboard)/configuracoes/usuarios/page.tsx

import { criarClienteAdmin } from '@/lib/supabase/admin'
import { BotaoExcluir } from '@/components/botao-excluir'
import { NovoUsuarioForm } from '@/components/novo-usuario-form'
import { excluirUsuario } from './actions'

export default async function PaginaUsuarios() {
  const admin = criarClienteAdmin()

  // perPage alto o bastante pra trazer todo mundo numa chamada só —
  // pro tamanho de equipe que esse sistema atende, 1000 é mais do
  // que suficiente, sem precisar da lógica de "páginas de 1000 em
  // 1000" que usamos na exportação de costuras.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })

  // Mesmo princípio do lib/fiscais.ts: antes, um erro aqui (chave
  // ausente, chave errada, projeto errado) virava silenciosamente
  // "nenhum usuário encontrado" — exatamente a mesma aparência de
  // quando não há usuário nenhum de verdade. Agora o erro real
  // aparece no terminal, em vez de se disfarçar de lista vazia.
  if (error) {
    console.error('Erro ao buscar usuários:', error.message)
  }

  const usuarios = [...(data?.users ?? [])].sort((a, b) =>
    (a.email ?? '').localeCompare(b.email ?? '', 'pt-BR')
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Usuários</h1>
        <p className="text-sm text-ink/60">
          Quem pode entrar no sistema. Criar um usuário aqui substitui ter que
          abrir o painel do Supabase pra fazer isso manualmente.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <NovoUsuarioForm />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-ink/50">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Último acesso</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b border-border last:border-0 hover:bg-surface"
              >
                <td className="px-4 py-3 text-ink">{usuario.email}</td>
                <td className="px-4 py-3 text-ink/70">
                  {new Date(usuario.created_at).toLocaleDateString('pt-BR', {
                    timeZone: 'America/Fortaleza',
                  })}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {usuario.last_sign_in_at
                    ? new Date(usuario.last_sign_in_at).toLocaleDateString('pt-BR', {
                        timeZone: 'America/Fortaleza',
                      })
                    : 'Nunca entrou'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <BotaoExcluir
                      aoExcluir={excluirUsuario.bind(null, usuario.id)}
                      confirmar={`Remover o acesso de ${usuario.email}? A pessoa não vai mais conseguir entrar no sistema.`}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/50">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}