import { AlertTriangle, ShoppingCart, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import MoneyInput from '@/components/ui/MoneyInput';
import { formatMoney } from '@/hooks/useMoneyInput';
import { usePDVStore } from '@/store/pdvStore';
import BuscaProduto from './BuscaProduto';

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
  const tipoDesconto = usePDVStore((s) => s.tipo_desconto);
  const setTipoDesconto = usePDVStore((s) => s.setTipoDesconto);
  const atualizarQuantidade = usePDVStore((s) => s.atualizarQuantidade);
  const atualizarPreco = usePDVStore((s) => s.atualizarPreco);
  const atualizarDesconto = usePDVStore((s) => s.atualizarDesconto);
  const removerItem = usePDVStore((s) => s.removerItem);
  const itensCalculados = usePDVStore((s) => s.itensComDescontoDistribuido());

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
              const distribuido =
                itensCalculados.find((c) => c.id === item.id)
                  ?.desconto_distribuido ?? 0;
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

                  {/* Quantidade — input numérico normal (suporta decimais para m/kg) */}
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

                  {/* Preço unitário — com máscara monetária */}
                  <div className="relative">
                    <MoneyInput
                      value={item.preco_unitario}
                      onChange={(v) => atualizarPreco(item.id, v)}
                      className="h-8"
                      ariaLabel="Preço unitário"
                    />
                    {precoAlterado && (
                      <AlertTriangle
                        className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary"
                        aria-label="Preço alterado"
                      />
                    )}
                  </div>

                  {/* Desconto por item — com máscara monetária */}
                  <div className="flex flex-col gap-0.5">
                    <MoneyInput
                      value={item.desconto_item}
                      onChange={(v) => atualizarDesconto(item.id, v)}
                      className="h-8"
                      ariaLabel="Desconto do item"
                    />
                    {distribuido > 0.005 && (
                      <span className="text-right text-xs text-muted-foreground">
                        + {formatMoney(distribuido)} (rateio)
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <div className="text-center font-semibold text-white">
                    R$ {formatMoney(item.total_item)}
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
          <span className="font-medium">R$ {formatMoney(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Desconto geral</span>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-border">
              <button
                type="button"
                onClick={() => setTipoDesconto('valor')}
                className={
                  tipoDesconto === 'valor'
                    ? 'bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground'
                    : 'bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground'
                }
              >
                R$
              </button>
              <button
                type="button"
                onClick={() => setTipoDesconto('porcentagem')}
                className={
                  tipoDesconto === 'porcentagem'
                    ? 'bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground'
                    : 'bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground'
                }
              >
                %
              </button>
            </div>
            {tipoDesconto === 'valor' ? (
              <MoneyInput
                value={descontoGeral}
                onChange={setDescontoGeral}
                className="h-8 w-32"
                ariaLabel="Desconto geral em reais"
              />
            ) : (
              <div className="relative">
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  max={100}
                  value={descontoGeral}
                  onChange={(e) =>
                    setDescontoGeral(parseNumero(e.target.value))
                  }
                  placeholder="0"
                  className="h-8 w-32 px-2 pr-8 text-right"
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold uppercase text-muted-foreground">
            Total
          </span>
          <span className="text-2xl font-bold text-primary">
            R$ {formatMoney(totalComDesconto)}
          </span>
        </div>
      </div>
    </div>
  );
}
