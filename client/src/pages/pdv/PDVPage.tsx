import Carrinho from '@/components/pdv/Carrinho';
import SeletorVendedor from '@/components/pdv/SeletorVendedor';
import SeletorCliente from '@/components/pdv/SeletorCliente';
import ParteFinanceira from '@/components/pdv/ParteFinanceira';
import AcoesPDV from '@/components/pdv/AcoesPDV';
import SeletorTipoOperacao from '@/components/pdv/SeletorTipoOperacao';
import { usePDVStore } from '@/store/pdvStore';

/**
 * Página de PDV — layout base com duas colunas.
 * Coluna esquerda: carrinho (flex-1) + financeira compacta (somente em modo venda).
 * Coluna direita (~380px): tipo de operação / vendedor / cliente / botões de ação.
 */
export default function PDVPage() {
  const tipoOperacao = usePDVStore((s) => s.tipo_operacao);
  const ehOrcamento = tipoOperacao === 'orcamento';

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden p-4">
      {/* Coluna esquerda */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Carrinho — sempre toma todo o espaço disponível */}
        <section
          id="pdv-carrinho"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card"
        >
          <Carrinho />
        </section>

        {/* Financeiro — só aparece em modo venda; altura compacta */}
        {!ehOrcamento && (
          <section
            id="pdv-financeiro"
            className="flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card"
          >
            <ParteFinanceira />
          </section>
        )}
      </div>

      {/* Coluna direita */}
      <aside className="flex w-[380px] flex-shrink-0 flex-col gap-4 overflow-y-auto">
        <SeletorTipoOperacao />

        <SeletorVendedor />

        <SeletorCliente />

        <AcoesPDV />
      </aside>
    </div>
  );
}
