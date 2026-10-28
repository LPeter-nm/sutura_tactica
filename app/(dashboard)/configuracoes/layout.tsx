// app/(dashboard)/configuracoes/layout.tsx

import { notFound } from 'next/navigation'
import { ehAdmin } from '@/lib/auth'

// Este layout envolve TUDO dentro de /configuracoes — tanto
// /configuracoes/fiscais quanto /configuracoes/usuarios — então a
// checagem só precisa existir aqui, uma vez, em vez de repetida em
// cada página. notFound() em vez de redirecionar: pra quem não é
// admin, essa área nem deveria parecer existir, não só "estar
// bloqueada".
export default async function LayoutConfiguracoes({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await ehAdmin())) {
    notFound()
  }

  return children
}