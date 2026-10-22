import { Modal } from '@/components/modal'
import { CosturaForm } from '@/components/costura-form'
import { criarCostura } from '../../actions'

// O "(.)" no nome da pasta ao lado significa "intercepte a rota
// irmã chamada novo, neste mesmo nível". Ou seja: ele só entra em
// ação quando alguém navega para /costuras/novo vindo de dentro de
// /costuras — exatamente o nosso botão "Nova costura" na listagem.
export default function ModalNovaCostura() {
  return (
    <Modal>
      <h1 className="mb-4 text-lg font-semibold text-ink">Nova costura</h1>
      <CosturaForm aoSalvar={criarCostura} textoBotao="Cadastrar" />
    </Modal>
  )
}