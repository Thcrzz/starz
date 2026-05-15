import { useMemo } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import MoneyInput from '@/components/ui/MoneyInput';
import { formatMoney } from '@/hooks/useMoneyInput';
import { usePDVStore } from '@/store/pdvStore';
import { calcularDescontoAbsoluto } from '@/utils/calculosVenda';
import BuscaProduto from './BuscaProduto';

function parseNumero(s: string): number {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Grid das colunas da tabela do carrinho. Mantido em uma única constante pra
 * cabeçalho e linhas casarem perfeitamente:
 * # 50px | Produto 1fr | Valor Unit. 110px | Quant. 80px | Desconto 100px |
 * Total 110px | 🗑 40px
 */
const GRID_COLS =
  'grid-cols-[50px_1fr_110px_80px_100px_110px_40px]';

/** Estilo aplicado aos inputs editáveis dentro de cada linha — fundo claro,
 * texto preto e borda fina pra contrastar com o cinza da linha. */
const CELL_INPUT =
  'h-8 border border-zinc-300 bg-zinc-200 text-black focus-visible:ring-0 focus-visible:ring-offset-0';

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

  const descontoAbs = useMemo(
    () => calcularDescontoAbsoluto(itens, descontoGeral, tipoDesconto),
    [itens, descontoGeral, tipoDesconto],
  );

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

      {/* Tabela: cabeçalho + área scrollable com linhas */}
      <div className="flex-1 overflow-hidden">
        {/* Cabeçalho fixo */}
        <div
          className={`grid ${GRID_COLS} gap-x-2 border-b border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground`}
        >
          <div className="text-left">#</div>
          <div className="text-left">Produto</div>
          <div className="text-right">Valor Unit.</div>
          <div className="text-right">Quant.</div>
          <div className="text-right">Desconto</div>
          <div className="text-right">Total</div>
          <div></div>
        </div>

        {/* Área scrollable. Min 300px com fundo levemente mais claro pra mostrar
            o espaço disponível mesmo sem itens. */}
        <div className="min-h-[300px] overflow-y-auto bg-zinc-700/20">
          {itens.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
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
                  {/* # — índice em cinza claro */}
                  <div className="text-left text-sm text-muted-foreground">
                    {idx + 1}
                  </div>

                  {/* Produto — nome + (avulso?) + unidade */}
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

                  {/* Valor unitário */}
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

                  {/* Quantidade — input numérico (decimais p/ m e kg) */}
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

                  {/* Desconto — internamente positivo, exibe com sinal de menos
                      como prefixo visual quando > 0. */}
                  <div className="relative">
                    {item.desconto_item > 0 && (
                      <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-sm text-black">
                        -
                      </span>
                    )}
                    <MoneyInput
                      value={item.desconto_item}
                      onChange={(v) => atualizarDesconto(item.id, v)}
                      className={`${CELL_INPUT} ${item.desconto_item > 0 ? 'pl-5' : ''}`}
                      ariaLabel="Desconto do item"
                    />
                  </div>

                  {/* Total — não editável, bold branco */}
                  <div className="text-right text-sm font-bold text-white">
                    {formatMoney(item.total_item)}
                  </div>

                  {/* Lixeira vermelha */}
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
      </div>

      {/* Busca de produto — agora abaixo da tabela, separada por divider */}
      <div className="border-t border-border bg-card/40 p-3">
        <BuscaProduto />
      </div>

      {/* Rodapé: subtotal + desconto + total
         (será reorganizado em horizontal nos próximos grupos) */}
      <div className="border-t border-border bg-card/60 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">R$ {formatMoney(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Desconto geral</span>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden border border-border">
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
              <div className="flex flex-col items-end gap-0.5">
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
                {descontoGeral > 0 && descontoAbs > 0 && (
                  <span className="text-xs text-muted-foreground">
                    = R$ {formatMoney(descontoAbs)}
                  </span>
                )}
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
