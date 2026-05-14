import { Button } from '@/components/ui/button';
import Carrinho from '@/components/pdv/Carrinho';
import SeletorVendedor from '@/components/pdv/SeletorVendedor';

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
          className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card"
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold">Parte Financeira</h2>
          </div>
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            Formas de pagamento, parcelas e finalização serão implementadas na Parte 2B.
          </div>
        </section>
      </div>

      {/* Coluna direita */}
      <aside className="flex w-[380px] flex-shrink-0 flex-col gap-4 overflow-y-auto">
        <SeletorVendedor />

        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Identificar Cliente
          </h3>
          <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Seleção / cadastro de cliente (em breve)
          </div>
        </section>

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
