# Controle de Costuras

Sistema interno de controle de costuras de fardamentos de eletricistas — da
DPL Construções. Substitui o controle manual/planilha por um registro único,
com histórico automático de cada mudança de status, controle de pagamento,
gestão de fiscais e de usuários.

## Funcionalidades

**Costuras**
- Cadastro, edição e visualização de costuras, em páginas cheias ou em
  cartões flutuantes (modais), dependendo de como a pessoa navega até lá
- Campos: eletricista, matrícula, prefixo, líder/supervisor/coordenador,
  tipo de fardamento, local de costura, data da costura, status de entrega,
  quantidade a pagar, status de pagamento e quem pagou — todos opcionais
  exceto os essenciais (eletricista, tipo de fardamento, local, data e
  status de entrega)
- Preenchimento automático de supervisor/coordenador ao escolher um líder
  (fiscal) já cadastrado
- Histórico automático de mudanças de status (quem mudou, quando, de qual
  status para qual)
- Listagem com busca por eletricista/prefixo (filtra sozinha enquanto se
  digita), filtros por status de entrega, status de pagamento, líder,
  supervisor, coordenador e período (data específica, semana ou mês, com
  atalhos prontos)
- Resumo de valores (total, recebido, a receber) que se ajusta aos
  filtros ativos
- Exportação para Excel, respeitando os mesmos filtros da tela, sem limite
  de linhas, com cabeçalho estilizado e filtro automático do Excel já ligado

**Fiscais** (`/configuracoes/fiscais`, restrito ao administrador)
- Cadastro de fiscais (líderes) com o supervisor e o coordenador de cada um
- É essa tabela que alimenta o preenchimento automático no cadastro de
  costuras

**Usuários** (`/configuracoes/usuarios`, restrito ao administrador)
- Criação e remoção de contas de acesso ao sistema, direto pela tela —
  sem precisar abrir o painel do Supabase

**Geral**
- Autenticação (contas criadas só pela tela de usuários, sem registro
  público)
- Uma única conta com papel de administrador geral; as demais só acessam
  a área de Costuras
- Avisos visuais (toast) de sucesso/erro após as ações
- Tema claro e escuro, com barra lateral que pode ser recolhida (mostrando
  só os ícones)
- Páginas próprias de erro 404 e 500

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript |
| Estilização | Tailwind CSS v4 |
| Formulários/validação | React Hook Form + Zod |
| Backend/banco | Supabase (PostgreSQL, Auth, Row Level Security) |
| Exportação para Excel | exceljs |
| Ícones | lucide-react |

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha (**Project Settings
→ API**, no painel do Supabase):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A `anon key` é segura para expor no navegador — o RLS do banco decide o que
ela pode ou não fazer. Já a `service_role key` **ignora o RLS por
completo** e é usada só em `lib/supabase/admin.ts` (gestão de usuários),
protegida pelo pacote `server-only`. Nunca coloque essa chave numa variável
com prefixo `NEXT_PUBLIC_`.

### 3. Criar a estrutura do banco

No **SQL Editor** do Supabase, rode, **nesta ordem**:

1. `schema_controle_costuras.sql` — tabelas `costuras` e
   `costuras_historico_status`, gatilhos e RLS
2. `supabase_correcao_trigger_historico.sql` — corrige a ordem dos gatilhos
   (histórico grava depois do insert, não antes)
3. `supabase_adicionar_status_pagamento.sql` — coluna `status_pagamento`
4. `supabase_adicionar_pago_por.sql` — coluna `pago_por`
5. `supabase_separar_lider_supervisor_coordenador.sql` — três colunas
   separadas (`lider`, `supervisor`, `coordenador`)
6. `supabase_renomear_dt_costura.sql` — renomeia `prazo_entrega` para
   `dt_costura`
7. `supabase_criar_fiscais.sql` — cria a tabela `fiscais` e já insere os
   fiscais sem ambiguidade (veja o comentário no próprio arquivo sobre os
   que precisam ser cadastrados manualmente depois)
8. `supabase_adicionar_matricula.sql` — coluna `matricula`
9. `supabase_marcar_admin.sql` — marca a conta administradora geral
   (edite o e-mail dentro do arquivo antes de rodar, se for diferente)

### 4. Criar os usuários do sistema

O **primeiro** usuário (o que vai virar administrador) ainda precisa ser
criado manualmente em **Authentication → Users**, no painel do Supabase —
e depois marcado como admin pelo passo 9 acima. Os demais usuários já podem
ser criados pela própria tela `/configuracoes/usuarios`, por essa conta
administradora.

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000` — a raiz redireciona para `/login` ou
`/costuras`, dependendo de haver sessão ativa.

## Estrutura do projeto

```
app/
├── layout.tsx, globals.css        → casca da aplicação, tema claro/escuro
├── error.tsx, not-found.tsx       → páginas de erro 500 e 404
├── login/                         → autenticação
└── (dashboard)/
    ├── layout.tsx                 → barra lateral + cabeçalho
    ├── configuracoes/
    │   ├── layout.tsx             → bloqueia a área inteira para não-admins
    │   ├── fiscais/                → cadastro de líder/supervisor/coordenador
    │   └── usuarios/               → criação/remoção de contas
    └── costuras/
        ├── page.tsx                → listagem
        ├── actions.ts               → Server Actions (criar/atualizar)
        ├── exportar/route.ts        → endpoint que gera o Excel
        ├── novo/, [id]/             → páginas cheias (fallback)
        └── @modal/                  → versões em cartão flutuante
components/   → peças de UI reutilizadas entre as telas
lib/
├── supabase/   → clientes Supabase (navegador, servidor, admin)
├── validations/ → schemas Zod
├── auth.ts      → checagem de administrador
├── costuras.ts, fiscais.ts → acesso a dados
└── datas.ts     → formatação de data e cálculo de períodos
types/        → tipos compartilhados do domínio "costura"
```

## Segurança

- Row Level Security habilitado em todas as tabelas — só usuários
  autenticados leem, criam ou atualizam registros
- Nenhuma operação de exclusão exposta em `costuras`, preservando o
  histórico (em `fiscais`, a exclusão é permitida — é só configuração)
- Todo dado de formulário é validado no navegador **e** no servidor
- A área de `/configuracoes` é protegida em duas camadas: a tela (via
  layout) e cada Server Action individualmente, checando se quem está
  autenticado é a conta administradora
- A `service_role key`, usada para gerenciar usuários, fica isolada em um
  único arquivo (`lib/supabase/admin.ts`), com o pacote `server-only`
  impedindo, no build, que ele seja importado por engano num Client
  Component
- Credenciais do banco ficam fora do código-fonte, em `.env.local`

## Documentação complementar

- `docs/documentacao_controle_costuras.pdf` — requisitos, modelagem do
  banco e identidade visual
- `docs/guia_rotas_nextjs.pdf` — guia de referência sobre as convenções de
  pastas do Next.js usadas no projeto (`[id]`, `(grupo)`, `@slot`, `(.)`)
- `docs/guia_estudo_controle_costuras.pdf` — tour comentado pelo código do
  projeto, pensado para estudo
