import Carrinho from '@/components/pdv/Carrinho';
import SeletorVendedor from '@/components/pdv/SeletorVendedor';
import SeletorCliente from '@/components/pdv/SeletorCliente';
import Observacoes from '@/components/pdv/Observacoes';
import AcoesPDV from '@/components/pdv/AcoesPDV';
import SeletorTipoOperacao from '@/components/pdv/SeletorTipoOperacao';

/**
 * Página de PDV — duas colunas, sem scroll geral (Layout trava em
 * h-screen quando a rota é /pdv).
 * - Coluna esquerda: card único do Carrinho (flex-1; o scroll vive
 *   internamente na área de linhas da tabela).
 * - Coluna direita (380px): SeletorTipoOperacao fixo no topo,
 *   Vendedor/Cliente/Observações no meio (com scroll interno se
 *   estourar), AcoesPDV fixa no rodapé.
 */
export default function PDVPage() {
  return (
    <div className="flex h-full w-full gap-3 overflow-hidden p-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <section
          id="pdv-carrinho"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          <Carrinho />
        </section>
      </div>

      <aside className="flex w-[380px] min-h-0 flex-shrink-0 flex-col gap-3 overflow-hidden">
        <SeletorTipoOperacao />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          <SeletorVendedor />
          <SeletorCliente />
          <Observacoes />
        </div>

        <AcoesPDV />
      </aside>
    </div>
  );
}
