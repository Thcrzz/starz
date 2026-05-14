import Carrinho from '@/components/pdv/Carrinho';
import SeletorVendedor from '@/components/pdv/SeletorVendedor';
import SeletorCliente from '@/components/pdv/SeletorCliente';
import ParteFinanceira from '@/components/pdv/ParteFinanceira';
import AcoesPDV from '@/components/pdv/AcoesPDV';

/**
 * Página de PDV — layout base com duas colunas.
 * Coluna esquerda (~70%): carrinho (topo) + financeiro (placeholder, baixo).
 * Coluna direita (~380px): vendedor / cliente / botões de ação.
 */
export default function PDVPage() {
  return (
    <div className="flex h-full w-full gap-4 overflow-hidden bg-background p-4">
      {/* Coluna esquerda */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Carrinho */}
        <section
          id="pdv-carrinho"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          <Carrinho />
        </section>

        {/* Financeiro */}
        <section
          id="pdv-financeiro"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          <ParteFinanceira />
        </section>
      </div>

      {/* Coluna direita */}
      <aside className="flex w-[380px] flex-shrink-0 flex-col gap-4 overflow-y-auto">
        <SeletorVendedor />

        <SeletorCliente />

        <AcoesPDV />
      </aside>
    </div>
  );
}
