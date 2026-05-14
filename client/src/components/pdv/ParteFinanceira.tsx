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
import { Textarea } from '@/components/ui/textarea';
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
  return (
    formasPagamento.find((f) => f.value === value)?.label ?? value
  );
}

export default function ParteFinanceira() {
  const observacao = usePDVStore((s) => s.observacao) ?? '';
  const setObservacao = usePDVStore((s) => s.setObservacao);
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
    // Sugere valor inicial = diferença que falta (ou total se for o primeiro)
    const sugerido = pagamentos.length === 0 ? totalComDesconto : Math.max(0, diferenca);
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-2">
        <h2 className="text-sm font-semibold">Parte Financeira</h2>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="flex flex-col gap-3">
          {/* Lista de pagamentos */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Formas de Pagamento</Label>
            {pagamentos.length === 0 && !showAdd && (
              <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                Nenhuma forma de pagamento adicionada
              </div>
            )}
            {pagamentos.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2"
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
                  className="h-8 w-32"
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
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remover pagamento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Form de adicionar */}
            {showAdd && (
              <div className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 p-2">
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
                      className="h-8 w-32"
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
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Adicionar forma de pagamento
              </Button>
            )}
          </div>

          {/* Indicador de conferência */}
          {pagamentos.length > 0 && (
            <div className="flex flex-col gap-1 rounded-md border border-border bg-secondary/20 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total da venda</span>
                <span className="font-medium">
                  R$ {formatMoney(totalComDesconto)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total recebido</span>
                <span className="font-medium">R$ {formatMoney(totalPago)}</span>
              </div>
              <div className="mt-1 flex items-center justify-end">
                {Math.abs(diffArred) < 0.005 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-green-600 bg-green-600/10 px-2 py-1 text-green-500">
                    <Check className="h-3.5 w-3.5" /> Valores conferem
                  </span>
                ) : diffArred > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-red-600 bg-red-600/10 px-2 py-1 text-red-500">
                    Faltam R$ {formatMoney(diffArred)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
                    Sobram R$ {formatMoney(-diffArred)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Avisos contextuais */}
          {temCartao && (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
              <AlertTriangle className="h-3.5 w-3.5" />
              NFC-e obrigatória
            </div>
          )}
          {fiadoSemCliente && (
            <div className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Atenção: venda a prazo requer identificação do cliente
              </span>
            </div>
          )}

          {/* Observação compacta */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="obs-venda" className="text-xs">
              Observação
            </Label>
            <Textarea
              id="obs-venda"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação (opcional)..."
              rows={2}
              className="min-h-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
