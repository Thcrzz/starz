import { useState } from 'react';
import { AlertTriangle, Check, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import MoneyInput from '@/components/ui/MoneyInput';
import { usePDVStore } from '@/store/pdvStore';
import { formatMoney } from '@/hooks/useMoneyInput';

const formasPagamento: Array<{ value: string; label: string }> = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'pix', label: 'Pix' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'transferencia', label: 'Transferência Eletrônica' },
  { value: 'fiado', label: 'Fiado / Prazo' },
];

const parcelasDisponiveis = Array.from({ length: 12 }, (_, i) => i + 1);

function labelForma(value: string): string {
  return formasPagamento.find((f) => f.value === value)?.label ?? value;
}

/**
 * Coluna esquerda do bloco horizontal do Carrinho — lista de pagamentos,
 * formulário pra adicionar nova forma, conferência (faltam/sobram) e os
 * avisos contextuais (NFC-e obrigatória, fiado sem cliente).
 * Renderizado apenas no modo VENDA — Carrinho decide quando montar.
 */
export default function BlocoFinanceiro() {
  const clienteId = usePDVStore((s) => s.cliente_id);
  const pagamentos = usePDVStore((s) => s.pagamentos);
  const adicionarPagamento = usePDVStore((s) => s.adicionarPagamento);
  const removerPagamento = usePDVStore((s) => s.removerPagamento);
  const atualizarPagamento = usePDVStore((s) => s.atualizarPagamento);
  const totalComDesconto = usePDVStore((s) => s.totalComDesconto());
  const totalPago = usePDVStore((s) => s.totalPago());
  const diferenca = usePDVStore((s) => s.diferencaPagamento());

  const [novaForma, setNovaForma] = useState<string>('dinheiro');
  const [novoValor, setNovoValor] = useState<number>(0);
  const [novasParcelas, setNovasParcelas] = useState<number>(1);
  const [showAdd, setShowAdd] = useState(false);

  function abrirNovo() {
    const sugerido =
      pagamentos.length === 0 ? totalComDesconto : Math.max(0, diferenca);
    setNovoValor(sugerido);
    setNovaForma('dinheiro');
    setNovasParcelas(1);
    setShowAdd(true);
  }

  function confirmarAdicionar() {
    if (novoValor <= 0) return;
    adicionarPagamento(
      novaForma,
      novoValor,
      novaForma === 'credito' ? novasParcelas : undefined,
    );
    setShowAdd(false);
  }

  const fiadoSemCliente =
    pagamentos.some((p) => p.forma === 'fiado') && !clienteId;
  const temCartao = pagamentos.some(
    (p) => p.forma === 'debito' || p.forma === 'credito',
  );
  const diffArred = Math.round(diferenca * 100) / 100;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Financeiro
      </h3>

      {pagamentos.length === 0 && !showAdd && (
        <div className="border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          Nenhuma forma de pagamento adicionada
        </div>
      )}

      {pagamentos.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-2 border border-border bg-secondary/30 p-2"
        >
          <span className="flex-1 truncate text-sm">
            {labelForma(p.forma)}
            {p.forma === 'credito' && p.parcelas && p.parcelas > 1 && (
              <span className="ml-1 text-xs text-muted-foreground">
                {p.parcelas}x
              </span>
            )}
          </span>
          <MoneyInput
            value={p.valor}
            onChange={(v) => atualizarPagamento(p.id, { valor: v })}
            className="h-8 w-28"
            ariaLabel={`Valor de ${labelForma(p.forma)}`}
          />
          {p.forma === 'credito' && (
            <Select
              value={String(p.parcelas ?? 1)}
              onValueChange={(v) =>
                atualizarPagamento(p.id, { parcelas: Number(v) })
              }
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parcelasDisponiveis.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            type="button"
            onClick={() => removerPagamento(p.id)}
            className="flex h-7 w-7 items-center justify-center text-red-500 transition-colors hover:text-red-400"
            aria-label="Remover pagamento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {showAdd && (
        <div className="flex flex-col gap-2 border border-primary/40 bg-primary/5 p-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs">Forma</Label>
              <Select value={novaForma} onValueChange={setNovaForma}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Valor</Label>
              <MoneyInput
                value={novoValor}
                onChange={setNovoValor}
                className="h-8 w-28"
              />
            </div>
            {novaForma === 'credito' && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Parcelas</Label>
                <Select
                  value={String(novasParcelas)}
                  onValueChange={(v) => setNovasParcelas(Number(v))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parcelasDisponiveis.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowAdd(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmarAdicionar}
              disabled={novoValor <= 0}
            >
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {!showAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={abrirNovo}
          className="gap-1 self-start"
        >
          <Plus className="h-4 w-4" /> Adicionar forma de pagamento
        </Button>
      )}

      {/* Conferência (faltam / sobram / conferem) */}
      {pagamentos.length > 0 && (
        <div className="flex items-center justify-end pt-1">
          {Math.abs(diffArred) < 0.005 ? (
            <span className="inline-flex items-center gap-1 border border-green-600 bg-green-600/10 px-2 py-1 text-xs text-green-500">
              <Check className="h-3.5 w-3.5" /> Valores conferem
            </span>
          ) : diffArred > 0 ? (
            <span className="inline-flex items-center gap-1 border border-red-600 bg-red-600/10 px-2 py-1 text-xs text-red-500">
              Faltam R$ {formatMoney(diffArred)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
              Sobram R$ {formatMoney(-diffArred)}
            </span>
          )}
        </div>
      )}

      {/* Avisos contextuais */}
      {temCartao && (
        <div className="inline-flex w-fit items-center gap-1.5 border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
          <AlertTriangle className="h-3.5 w-3.5" />
          NFC-e obrigatória
        </div>
      )}
      {fiadoSemCliente && (
        <div className="flex items-start gap-2 border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Venda a prazo requer identificação do cliente</span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
        <span className="text-muted-foreground">Total recebido</span>
        <span className="font-medium">R$ {formatMoney(totalPago)}</span>
      </div>
    </div>
  );
}
