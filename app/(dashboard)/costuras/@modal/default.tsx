// Quando a pessoa está só na listagem (sem o modal aberto), o
// Next.js ainda precisa de uma resposta pra esse "slot" — e a
// resposta certa, nesse caso, é simplesmente não desenhar nada.
export default function ModalPadrao() {
  return null
}