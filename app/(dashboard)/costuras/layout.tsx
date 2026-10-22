// "modal" aqui não é um nome escolhido por mim — ele vem direto do
// nome da pasta @modal, ali do lado. Isso é uma "rota paralela": o
// Next.js passa o conteúdo dela como mais uma prop deste layout,
// renderizada ao lado de "children" (que é a página normal, a
// listagem). As duas coisas aparecem juntas, uma por cima da outra.
export default function CosturasLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}