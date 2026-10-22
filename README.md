# Controle de Costuras

Sistema interno de controle de costuras de fardamentos de eletricistas — da
DPL Construções. Substitui o controle manual/planilha por um registro único,
com histórico automático de cada mudança de status.

## Funcionalidades

- Autenticação (usuários cadastrados manualmente, sem registro público)
- Cadastro, edição e visualização de costuras, em páginas ou em cartões
  flutuantes (modais), dependendo de como a pessoa navega até lá
- Listagem com busca por eletricista/prefixo e filtro por status
- Histórico automático de mudanças de status (quem mudou e quando)
- Avisos visuais de sucesso/erro após as ações
- Tema claro e escuro
- Páginas próprias de erro 404 e 500

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Estilização | Tailwind CSS v4 |
| Formulários/validação | React Hook Form + Zod |
| Backend/banco | Supabase (PostgreSQL, Auth, Row Level Security) |
| Ícones | lucide-react |

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com os dados do seu
projeto Supabase (**Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Nunca use a `service_role key` aqui — apenas a `anon key`, que é segura para
expor no navegador.

### 3. Criar a estrutura do banco

No **SQL Editor** do Supabase, rode, nesta ordem:

1. `schema_controle_costuras.sql` — cria as tabelas, os gatilhos e as regras
   de segurança (RLS)
2. `supabase_correcao_trigger_historico.sql` — corrige a ordem dos gatilhos
   de criação (histórico precisa ser gravado depois do insert, não antes)

### 4. Criar os usuários do sistema

Não existe tela de cadastro pública. Em **Authentication → Users**, no
painel do Supabase, adicione manualmente cada pessoa que vai usar o sistema.

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000` — a raiz redireciona para `/login` ou
`/costuras`, dependendo de haver sessão ativa.

## Estrutura do projeto

```
app/
├── login/              → autenticação
└── (dashboard)/
    └── costuras/
        ├── page.tsx         → listagem
        ├── novo/            → cadastro (página cheia, fallback)
        ├── [id]/            → detalhes e edição (página cheia, fallback)
        └── @modal/          → versões em cartão flutuante das rotas acima
components/   → peças de UI reutilizadas entre as telas
lib/          → clientes Supabase, validação (Zod) e acesso a dados
types/        → tipos compartilhados do domínio "costura"
```

## Segurança

- Row Level Security habilitado em todas as tabelas — só usuários
  autenticados leem, criam ou atualizam registros
- Nenhuma operação de exclusão exposta, preservando o histórico
- Todo dado de formulário é validado no navegador **e** no servidor
- Credenciais do banco ficam fora do código-fonte, em `.env.local`

## Documentação completa

A documentação técnica detalhada (requisitos, modelagem do banco, paleta de
cores) está em `docs/documentacao_controle_costuras.pdf`.
