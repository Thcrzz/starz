import { AlertTriangle, ShoppingCart, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePDVStore } from '@/store/pdvStore';
import BuscaProduto from './BuscaProduto';

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function parseNumero(s: string): number {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Layout das colunas do carrinho — usado em cabeçalho e linhas para garantir alinhamento.
 * Produto: flex-1 | QTD: 80px | Preço Unit.: 120px | Desconto: 110px | Total: 100px | Ações: 36px
 */
const GRID_COLS = 'grid-cols-[1fr_80px_120px_110px_100px_36px]';

export default function Carrinho() {
  const itens = usePDVStore((s) => s.itens);
  const subtotal = usePDVStore((s) => s.subtotal());
  const totalComDesconto = usePDVStore((s) => s.totalComDesconto());
  const descontoGeral = usePDVStore((s) => s.desconto_geral);
  const setDescontoGeral = usePDVStore((s) => s.setDescontoGeral);
  const atualizarQuantidade = usePDVStore((s) => s.atualizarQuantidade);
  const atualizarPreco = usePDVStore((s) => s.atualizarPreco);
  const atualizarDesconto = usePDVStore((s) => s.atualizarDesconto);
  const removerItem = usePDVStore((s) => s.removerItem);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Carrinho</h2>
          <Badge className="bg-primary text-primary-foreground">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </Badge>
        </div>
      </div>

      {/* Busca */}
      <div className="border-b border-border bg-card/50 p-3">
        <BuscaProduto />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-auto">
        {itens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum produto adicionado
            </p>
          </div>
        ) : (
          <div className="text-sm">
            {/* Cabeçalho do grid */}
            <div
              className={`sticky top-0 z-10 grid ${GRID_COLS} gap-x-4 border-b border-border bg-card px-3 py-2 text-xs uppercase text-muted-foreground`}
            >
              <div className="text-left">Produto</div>
              <div className="text-center">Qtd</div>
              <div className="text-center">Preço Unit.</div>
              <div className="text-center">Desconto</div>
              <div className="text-center">Total</div>
              <div></div>
            </div>

            {/* Linhas */}
            {itens.map((item, idx) => {
              const precoAlterado =
                item.preco_unitario !== item.preco_original;
              const passoQtd =
                item.unidade === 'm' || item.unidade === 'kg' ? 0.001 : 1;
              const fundo = idx % 2 === 0 ? 'bg-card' : 'bg-secondary/30';
              return (
                <div
                  key={item.id}
                  className={`grid ${GRID_COLS} items-center gap-x-4 border-b border-border px-3 py-2 last:border-b-0 ${fundo}`}
                >
                  {/* Produto */}
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

                  {/* Quantidade */}
                  <Input
                    type="number"
                    min={0.001}
                    step={passoQtd}
                    value={item.quantidade}
                    onChange={(e) =>
                      atualizarQuantidade(item.id, parseNumero(e.target.value))
                    }
                    className="h-8 w-full px-2 text-center"
                  />

                  {/* Preço unitário */}
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.preco_unitario}
                      onChange={(e) =>
                        atualizarPreco(item.id, parseNumero(e.target.value))
                      }
                      className="h-8 w-full px-2 pl-8 text-right"
                    />
                    {precoAlterado && (
                      <AlertTriangle
                        className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary"
                        aria-label="Preço alterado"
                      />
                    )}
                  </div>

                  {/* Desconto */}
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      R$
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.desconto_item}
                      onChange={(e) =>
                        atualizarDesconto(
                          item.id,
                          parseNumero(e.target.value),
                        )
                      }
                      className="h-8 w-full px-2 pl-8 text-right"
                    />
                  </div>

                  {/* Total */}
                  <div className="text-center font-semibold text-white">
                    {formatBRL(item.total_item)}
                  </div>

                  {/* Ações */}
                  <button
                    type="button"
                    onClick={() => removerItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center justify-self-center rounded text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé / totais */}
      <div className="border-t border-border bg-card/60 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatBRL(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Desconto geral</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              R$
            </span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={descontoGeral}
              onChange={(e) => setDescontoGeral(parseNumero(e.target.value))}
              className="h-8 w-32 pl-8 text-right"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold uppercase text-muted-foreground">
            Total
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatBRL(totalComDesconto)}
          </span>
        </div>
      </div>
    </div>
  );
}
