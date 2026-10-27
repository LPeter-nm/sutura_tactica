// lib/supabase/admin.ts
import 'server-only'
import { createClient as criarClienteSupabase } from '@supabase/supabase-js'

// ATENÇÃO — leia antes de usar este arquivo em qualquer outro lugar:
//
// A service_role key NÃO é como a anon key. Ela ignora o RLS por
// completo — qualquer tabela, qualquer linha, sem nenhuma das
// proteções que configuramos no banco até aqui. É a chave-mestra.
//
// Por isso, duas regras, sem exceção:
// 1. Nunca importe este arquivo num Client Component (um arquivo com
//    "use client" no topo). O pacote "server-only", importado logo
//    ali em cima, faz o BUILD FALHAR de propósito se isso acontecer
//    — é uma trava técnica, não só uma combinação de cavalheiros.
// 2. Use este cliente só dentro de Server Actions ou Server
//    Components que, ELES MESMOS, decidem exatamente o que devolver
//    — nunca repasse o resultado bruto de uma chamada dele direto
//    pro navegador sem escolher a dedo o que a pessoa precisa ver.
export function criarClienteAdmin() {
  return criarClienteSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}