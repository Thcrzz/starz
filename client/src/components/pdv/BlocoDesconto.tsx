import { Input } from '@/components/ui/input';
import MoneyInput from '@/components/ui/MoneyInput';
import { usePDVStore } from '@/store/pdvStore';

function parseNumero(s: string): number {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Coluna central do bloco horizontal — toggle R$/% e o input do valor.
 * Toggle ativo em laranja com texto branco; inativo em cinza claro
 * com texto preto. Input com fundo claro e texto preto pra contrastar
 * com o card escuro.
 */
export default function BlocoDesconto() {
  const descontoGeral = usePDVStore((s) => s.desconto_geral);
  const setDescontoGeral = usePDVStore((s) => s.setDescontoGeral);
  const tipoDesconto = usePDVStore((s) => s.tipo_desconto);
  const setTipoDesconto = usePDVStore((s) => s.setTipoDesconto);

  const inputBaseCls =
    'h-9 border border-zinc-300 bg-zinc-200 text-black text-right focus-visible:ring-0 focus-visible:ring-offset-0';

  return (
    <div className="flex flex-col gap-2 border-r border-zinc-700/50 px-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Desconto
      </h3>

      <div className="flex overflow-hidden border border-border w-fit">
        <button
          type="button"
          onClick={() => setTipoDesconto('valor')}
          className={
            tipoDesconto === 'valor'
              ? 'bg-primary px-3 py-1 text-xs font-semibold text-white'
              : 'bg-zinc-300 px-3 py-1 text-xs text-black hover:bg-zinc-200'
          }
        >
          R$
        </button>
        <button
          type="button"
          onClick={() => setTipoDesconto('porcentagem')}
          className={
            tipoDesconto === 'porcentagem'
              ? 'bg-primary px-3 py-1 text-xs font-semibold text-white'
              : 'bg-zinc-300 px-3 py-1 text-xs text-black hover:bg-zinc-200'
          }
        >
          %
        </button>
      </div>

      {tipoDesconto === 'valor' ? (
        <div className="relative">
          <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-xs font-semibold text-black">
            R$
          </span>
          <MoneyInput
            value={descontoGeral}
            onChange={setDescontoGeral}
            className={`${inputBaseCls} pl-9 w-32`}
            ariaLabel="Desconto geral em reais"
          />
        </div>
      ) : (
        <div className="relative">
          <Input
            type="number"
            min={0}
            step={1}
            max={100}
            value={descontoGeral}
            onChange={(e) => setDescontoGeral(parseNumero(e.target.value))}
            placeholder="0"
            className={`${inputBaseCls} pr-7 w-32`}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-black">
            %
          </span>
        </div>
      )}
    </div>
  );
}
