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
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">Parte Financeira</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4">
          {/* Forma de Pagamento */}
          <div className="grid gap-1.5">
            <Label>Forma de Pagamento</Label>
            <Select
              value={formaPagamento ?? ''}
              onValueChange={(v) => setFormaPagamento(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento..." />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {requerNfce && (
              <div className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary">
                <AlertTriangle className="h-3.5 w-3.5" />
                NFC-e obrigatória
              </div>
            )}

            {fiadoSemCliente && (
              <div className="mt-1 flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Atenção: venda a prazo requer identificação do cliente
                </span>
              </div>
            )}
          </div>

          {/* Parcelas — só para crédito */}
          {mostraParcelas && (
            <div className="grid gap-1.5">
              <Label>Parcelas</Label>
              <div className="grid grid-cols-4 gap-2">
                {parcelasDisponiveis.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={parcelas === n ? 'default' : 'secondary'}
                    onClick={() => setParcelas(n)}
                    className={
                      parcelas === n
                        ? 'bg-primary font-bold text-primary-foreground hover:bg-primary/90'
                        : ''
                    }
                  >
                    {n}x
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Observação */}
          <div className="grid gap-1.5">
            <Label htmlFor="obs-venda">Observação</Label>
            <Textarea
              id="obs-venda"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação (opcional)..."
              className="min-h-[60px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
