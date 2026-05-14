import { Button } from '@/components/ui/button';
import Carrinho from '@/components/pdv/Carrinho';
import SeletorVendedor from '@/components/pdv/SeletorVendedor';
import SeletorCliente from '@/components/pdv/SeletorCliente';
import ParteFinanceira from '@/components/pdv/ParteFinanceira';

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

        <section className="flex flex-col gap-2">
          <Button
            disabled
            className="w-full py-6 text-base font-bold text-white"
            style={{ backgroundColor: '#16a34a' }}
          >
            Finalizar Venda
          </Button>
          <Button
            disabled
            className="w-full py-6 text-base font-bold text-white"
            style={{ backgroundColor: '#15803d' }}
          >
            Finalizar Venda e Imprimir Pedido
          </Button>
          <Button
            disabled
            className="w-full py-6 text-base font-bold text-white"
            style={{ backgroundColor: '#d97706' }}
          >
            Finalizar Venda e Emitir NFC-e
          </Button>
          <Button
            disabled
            className="w-full py-6 text-base font-bold text-white"
            style={{ backgroundColor: '#dc2626' }}
          >
            Cancelar Venda
          </Button>
        </section>
      </aside>
    </div>
  );
}
