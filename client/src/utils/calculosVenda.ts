import type { ItemCarrinho } from '@/types/pdv';

/**
 * Valor absoluto do desconto geral em R$, independente do tipo.
 * Usado tanto pra exibir o equivalente em R$ quando o usuário digita %, quanto
 * pra mandar o campo `desconto` na criação da venda — o backend então calcula
 * total = subtotal - desconto.
 */
export function calcularDescontoAbsoluto(
  itens: ItemCarrinho[],
  descontoGeral: number,
  tipoDesconto: 'valor' | 'porcentagem',
): number {
  const subtotal = itens.reduce((acc, i) => acc + i.total_item, 0);
  if (tipoDesconto === 'porcentagem') {
    const pct = Math.min(100, Math.max(0, descontoGeral));
    return Math.max(0, subtotal * (pct / 100));
  }
  return Math.min(subtotal, Math.max(0, descontoGeral));
}
