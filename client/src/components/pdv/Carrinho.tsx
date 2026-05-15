import { AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import MoneyInput from '@/components/ui/MoneyInput';
import { formatMoney } from '@/hooks/useMoneyInput';
import { usePDVStore } from '@/store/pdvStore';
import BlocoDesconto from './BlocoDesconto';
import BlocoFinanceiro from './BlocoFinanceiro';
import BlocoTotais from './BlocoTotais';
import BuscaProduto from './BuscaProduto';

function parseNumero(s: string): number {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Grid das colunas da tabela do carrinho. Cabeçalho e linhas usam o mesmo
 * template pra casar perfeitamente:
 * # 50px | Produto 1fr | Valor Unit. 110px | Quant. 80px | Desconto 100px |
 * Total 110px | 🗑 40px
 */
const GRID_COLS = 'grid-cols-[50px_1fr_110px_80px_100px_110px_40px]';

/** Estilo padrão dos inputs editáveis dentro de cada linha: fundo claro
 *  com texto preto e borda fina pra destacar sobre o cinza da linha. */
const CELL_INPUT =
  'h-8 border border-zinc-300 bg-zinc-200 text-black focus-visible:ring-0 focus-visible:ring-offset-0';

export default function Carrinho() {
  const itens = usePDVStore((s) => s.itens);
  const tipoOperacao = usePDVStore((s) => s.tipo_operacao);
  const atualizarQuantidade = usePDVStore((s) => s.atualizarQuantidade);
  const atualizarPreco = usePDVStore((s) => s.atualizarPreco);
  const atualizarDesconto = usePDVStore((s) => s.atualizarDesconto);
  const removerItem = usePDVStore((s) => s.removerItem);

  const ehOrcamento = tipoOperacao === 'orcamento';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Cabeçalho do card */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Carrinho</h2>
          <Badge className="bg-primary text-primary-foreground">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
      </div>

      {/* Tabela: scroll único contendo o cabeçalho sticky + as linhas
         (ou a mensagem de estado vazio). Só essa área rola — o resto do
         card fica fixo. */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-700/20">
        <div
          className={`sticky top-0 z-10 grid ${GRID_COLS} gap-x-2 border-b border-border bg-card px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground`}
        >
          <div className="text-left">#</div>
          <div className="text-left">Produto</div>
          <div className="text-right">Valor Unit.</div>
          <div className="text-right">Quant.</div>
          <div className="text-right">Desconto</div>
          <div className="text-right">Total</div>
          <div></div>
        </div>

        {itens.length === 0 ? (
          <div className="flex items-center justify-center px-4 py-16 text-center text-sm text-muted-foreground">
            Adicione produtos usando a busca abaixo
          </div>
        ) : (
          itens.map((item, idx) => {
              const precoAlterado =
                item.preco_unitario !== item.preco_original;
              const passoQtd =
                item.unidade === 'm' || item.unidade === 'kg' ? 0.001 : 1;
              const fundo =
                idx % 2 === 0 ? 'bg-zinc-700/40' : 'bg-zinc-700/30';
              return (
                <div
                  key={item.id}
                  className={`grid ${GRID_COLS} items-center gap-x-2 px-3 py-3 ${fundo}`}
                >
                  <div className="text-left text-sm text-muted-foreground">
                    {idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {item.descricao}
                      </span>
                      {item.e_avulso && (
                        <Badge
                          variant="outline"
                          className="border-zinc-500 bg-zinc-500/10 text-zinc-400"
                        >
                          Avulso
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.unidade}
                    </div>
                  </div>

                  <div className="relative">
                    <MoneyInput
                      value={item.preco_unitario}
                      onChange={(v) => atualizarPreco(item.id, v)}
                      className={CELL_INPUT}
                      ariaLabel="Preço unitário"
                    />
                    {precoAlterado && (
                      <AlertTriangle
                        className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary"
                        aria-label="Preço alterado"
                      />
                    )}
                  </div>

                  <Input
                    type="number"
                    min={0.001}
                    step={passoQtd}
                    value={item.quantidade}
                    onChange={(e) =>
                      atualizarQuantidade(item.id, parseNumero(e.target.value))
                    }
                    className={`${CELL_INPUT} w-full px-2 text-right`}
                  />

                  <div className="relative">
                    {item.desconto_item > 0 && (
                      <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-sm text-black">
                        -
                      </span>
                    )}
                    <MoneyInput
                      value={item.desconto_item}
                      onChange={(v) => atualizarDesconto(item.id, v)}
                      className={`${CELL_INPUT} ${
                        item.desconto_item > 0 ? 'pl-5' : ''
                      }`}
                      ariaLabel="Desconto do item"
                    />
                  </div>

                  <div className="text-right text-sm font-bold text-white">
                    {formatMoney(item.total_item)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removerItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center justify-self-center rounded text-red-500 transition-colors hover:text-red-400"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

      {/* Busca de produto — abaixo da tabela */}
      <div className="border-t border-border bg-card/40 p-3">
        <BuscaProduto />
      </div>

      {/* Bloco horizontal: Financeiro | Desconto | Totais.
         Em VENDA → 3 colunas (Financeiro 1fr | Desconto auto | Totais 1fr).
         Em ORÇAMENTO → 2 colunas (Desconto assume o lado esquerdo, Totais
         continua à direita). `gap-0` permite que o border-r de cada bloco
         encoste no próximo (cada bloco já tem px-4 interno, então o
         conteúdo respira); `items-start` alinha o topo. */}
      <div
        className={`grid items-start gap-0 border-t border-border bg-card/60 py-4 ${
          ehOrcamento
            ? 'grid-cols-[auto_1fr]'
            : 'grid-cols-[1fr_auto_1fr]'
        }`}
      >
        {!ehOrcamento && <BlocoFinanceiro />}
        <BlocoDesconto />
        <BlocoTotais />
      </div>
    </div>
  );
}
