import type {
  ItemCarrinho,
  ItemCarrinhoCalculado,
} from '@/types/pdv';

/**
 * Funções puras de cálculo do PDV — fora do Zustand pra evitar getters que
 * retornam arrays/objetos novos a cada chamada (causa de loops de render).
 * Consumir via useMemo nos componentes.
 */

function totalDesconto(
  itens: ItemCarrinho[],
  descontoGeral: number,
  tipoDesconto: 'valor' | 'porcentagem',
): { subtotal: number; total: number } {
  const subtotal = itens.reduce((acc, i) => acc + i.total_item, 0);
  if (tipoDesconto === 'porcentagem') {
    const pct = Math.min(100, Math.max(0, descontoGeral));
    const total = Math.max(0, subtotal * (1 - pct / 100));
    return { subtotal, total };
  }
  return { subtotal, total: Math.max(0, subtotal - descontoGeral) };
}

/** Valor absoluto do desconto geral (R$ aplicado), independente do tipo. */
export function calcularDescontoAbsoluto(
  itens: ItemCarrinho[],
  descontoGeral: number,
  tipoDesconto: 'valor' | 'porcentagem',
): number {
  const { subtotal, total } = totalDesconto(itens, descontoGeral, tipoDesconto);
  return Math.max(0, subtotal - total);
}

/** Rateia o desconto geral proporcionalmente em cada item do carrinho. */
export function distribuirDesconto(
  itens: ItemCarrinho[],
  descontoGeral: number,
  tipoDesconto: 'valor' | 'porcentagem',
): ItemCarrinhoCalculado[] {
  const { subtotal, total } = totalDesconto(itens, descontoGeral, tipoDesconto);
  const descAbs = Math.max(0, subtotal - total);

  if (descAbs <= 0 || subtotal <= 0) {
    return itens.map((i) => ({
      ...i,
      desconto_distribuido: 0,
      desconto_item_final: i.desconto_item,
      total_item_final: i.total_item,
    }));
  }

  return itens.map((i) => {
    const participacao = i.total_item / subtotal;
    const distribuido = participacao * descAbs;
    const descontoFinal = (i.desconto_item || 0) + distribuido;
    const bruto = i.preco_unitario * i.quantidade;
    const totalFinalItem = Math.max(0, bruto - descontoFinal);
    return {
      ...i,
      desconto_distribuido: distribuido,
      desconto_item_final: descontoFinal,
      total_item_final: totalFinalItem,
    };
  });
}
