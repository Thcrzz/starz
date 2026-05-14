import { AlertTriangle } from 'lucide-react';
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
import { usePDVStore } from '@/store/pdvStore';

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

export default function ParteFinanceira() {
  const formaPagamento = usePDVStore((s) => s.forma_pagamento);
  const setFormaPagamento = usePDVStore((s) => s.setFormaPagamento);
  const parcelas = usePDVStore((s) => s.parcelas);
  const setParcelas = usePDVStore((s) => s.setParcelas);
  const observacao = usePDVStore((s) => s.observacao) ?? '';
  const setObservacao = usePDVStore((s) => s.setObservacao);
  const clienteId = usePDVStore((s) => s.cliente_id);

  const requerNfce =
    formaPagamento === 'debito' || formaPagamento === 'credito';
  const fiadoSemCliente = formaPagamento === 'fiado' && !clienteId;
  const mostraParcelas = formaPagamento === 'credito';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-2">
        <h2 className="text-sm font-semibold">Parte Financeira</h2>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="flex flex-col gap-3">
          {/* Linha 1: forma de pagamento + parcelas lado a lado */}
          <div className="flex flex-row gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="text-xs">Forma de Pagamento</Label>
              <Select
                value={formaPagamento ?? ''}
                onValueChange={(v) => setFormaPagamento(v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
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

            {mostraParcelas && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Parcelas</Label>
                <div className="grid grid-cols-6 gap-1">
                  {parcelasDisponiveis.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={parcelas === n ? 'default' : 'secondary'}
                      onClick={() => setParcelas(n)}
                      className={
                        parcelas === n
                          ? 'h-8 px-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90'
                          : 'h-8 px-2'
                      }
                    >
                      {n}x
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avisos */}
          {requerNfce && (
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
