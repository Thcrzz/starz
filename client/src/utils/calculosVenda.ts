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

/**
 * Rateia proporcionalmente o desconto geral (em R$) entre os itens. Retorna
 * um array do mesmo tamanho com o valor distribuído pra cada item — sem
 * somar com o desconto_item original; quem combinar é o caller.
 *
 * O último item absorve o resíduo de arredondamento (2 casas) pra garantir
 * que a soma do array bata exatamente com `descontoGeralReais`.
 *
 * NOTA: o resultado é apenas visual — o pdvStore continua armazenando o
 * desconto_item original e o desconto_geral separados (decisão da Fase 2:
 * backend é a fonte da verdade do total). Consumir via useMemo no componente
 * pra evitar criar arrays novos em cada render.
 */
export function distribuirDescontoGeral(
  itens: ItemCarrinho[],
  subtotal: number,
  descontoGeralReais: number,
): number[] {
  if (descontoGeralReais <= 0 || subtotal <= 0) {
    return itens.map(() => 0);
  }
  const valores: number[] = [];
  let acumulado = 0;
  itens.forEach((it, idx) => {
    if (idx === itens.length - 1) {
      valores.push(Math.max(0, descontoGeralReais - acumulado));
    } else {
      const valor =
        Math.round((it.total_item / subtotal) * descontoGeralReais * 100) /
        100;
      valores.push(valor);
      acumulado += valor;
    }
  });
  return valores;
}
