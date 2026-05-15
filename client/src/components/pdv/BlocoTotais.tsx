import { useMemo } from 'react';
import { formatMoney } from '@/hooks/useMoneyInput';
import { usePDVStore } from '@/store/pdvStore';
import { calcularDescontoAbsoluto } from '@/utils/calculosVenda';

/**
 * Coluna direita do bloco horizontal — SUBTOTAL e DESCONTO em fonte
 * média, TOTAL em fonte gigante (3xl). Tudo alinhado à direita;
 * desconto exibido com sinal de menos.
 */
export default function BlocoTotais() {
  const itens = usePDVStore((s) => s.itens);
  const subtotal = usePDVStore((s) => s.subtotal());
  const totalComDesconto = usePDVStore((s) => s.totalComDesconto());
  const descontoGeral = usePDVStore((s) => s.desconto_geral);
  const tipoDesconto = usePDVStore((s) => s.tipo_desconto);

  const descontoAbs = useMemo(
    () => calcularDescontoAbsoluto(itens, descontoGeral, tipoDesconto),
    [itens, descontoGeral, tipoDesconto],
  );

  return (
    <div className="flex flex-col items-end justify-end gap-2 text-right">
      <div className="flex w-full items-baseline justify-between gap-4 text-sm">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          Subtotal:
        </span>
        <span className="font-medium">{formatMoney(subtotal)}</span>
      </div>
      <div className="flex w-full items-baseline justify-between gap-4 text-sm">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          Desconto:
        </span>
        <span className="font-medium">
          {descontoAbs > 0 ? `-${formatMoney(descontoAbs)}` : formatMoney(0)}
        </span>
      </div>
      <div className="mt-2 flex w-full items-baseline justify-between gap-4 border-t border-border pt-2">
        <span className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">
          Total:
        </span>
        <span className="text-3xl font-bold text-white">
          {formatMoney(totalComDesconto)}
        </span>
      </div>
    </div>
  );
}
