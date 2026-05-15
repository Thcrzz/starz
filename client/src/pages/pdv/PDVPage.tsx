import Carrinho from '@/components/pdv/Carrinho';
import SeletorVendedor from '@/components/pdv/SeletorVendedor';
import SeletorCliente from '@/components/pdv/SeletorCliente';
import AcoesPDV from '@/components/pdv/AcoesPDV';
import SeletorTipoOperacao from '@/components/pdv/SeletorTipoOperacao';

/**
 * Página de PDV — duas colunas.
 * Coluna esquerda: card único do Carrinho (tabela + busca + financeiro +
 * desconto + totais + observação).
 * Coluna direita (~380px): tipo de operação / vendedor / cliente / ações.
 */
export default function PDVPage() {
  return (
    <div className="flex h-full w-full gap-4 overflow-hidden p-4">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <section
          id="pdv-carrinho"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          <Carrinho />
        </section>
      </div>

      <aside className="flex w-[380px] flex-shrink-0 flex-col gap-4 overflow-y-auto">
        <SeletorTipoOperacao />
        <SeletorVendedor />
        <SeletorCliente />
        <AcoesPDV />
      </aside>
    </div>
  );
}
