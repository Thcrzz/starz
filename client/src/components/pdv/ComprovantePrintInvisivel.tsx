import ModalComprovante from './ModalComprovante';

interface Props {
  vendaId: number | null;
  tipoOperacao?: 'venda' | 'orcamento';
  /** Chamado depois que window.print() dispara — pai deve desmontar este componente. */
  onCompleto: () => void;
}

/**
 * Renderiza o comprovante no DOM como filho de <body> (via portal interno do
 * ModalComprovante) escondido em tela e dispara `window.print()` automaticamente
 * assim que os dados carregam. Não abre Dialog visualmente.
 *
 * Usado pelo botão "Finalizar Venda e Imprimir Pedido" para ir direto da
 * criação da venda para a preview de impressão sem etapa intermediária.
 */
export default function ComprovantePrintInvisivel({
  vendaId,
  tipoOperacao,
  onCompleto,
}: Props) {
  return (
    <ModalComprovante
      aberto={false}
      vendaId={vendaId}
      tipoOperacao={tipoOperacao}
      onFechar={onCompleto}
      imprimirAutomaticamente
    />
  );
}
