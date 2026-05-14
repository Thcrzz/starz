import { AlertTriangle, ShoppingCart, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {itens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum produto adicionado
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card text-xs uppercase text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left">Produto</th>
                <th className="px-3 py-2 text-right">Qtd</th>
                <th className="px-3 py-2 text-right">Preço Unit.</th>
                <th className="px-3 py-2 text-right">Desconto</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const precoAlterado =
                  item.preco_unitario !== item.preco_original;
                const passoQtd =
                  item.unidade === 'm' || item.unidade === 'kg' ? 0.001 : 1;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.descricao}</span>
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
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        min={0.001}
                        step={passoQtd}
                        value={item.quantidade}
                        onChange={(e) =>
                          atualizarQuantidade(item.id, parseNumero(e.target.value))
                        }
                        className="h-8 w-20 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
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
                          className="h-8 w-28 pl-8 text-right"
                        />
                        {precoAlterado && (
                          <AlertTriangle
                            className="absolute -right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                            aria-label="Preço alterado"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
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
                          className="h-8 w-24 pl-8 text-right"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-green-500">
                      {formatBRL(item.total_item)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerItem(item.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
