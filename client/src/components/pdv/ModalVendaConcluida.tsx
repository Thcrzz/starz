import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { VendaCompleta } from '@/services/vendasService';

interface Props {
  aberto: boolean;
  venda: VendaCompleta | null;
  clienteNome?: string;
  tipoOperacao?: 'venda' | 'orcamento';
  onFechar: () => void;
  onVerComprovante: () => void;
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const labelsFormaPagamento: Record<string, string> = {
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
  pix: 'Pix',
  cheque: 'Cheque',
  transferencia: 'Transferência',
  fiado: 'Fiado / Prazo',
};

export default function ModalVendaConcluida({
  aberto,
  venda,
  clienteNome,
  tipoOperacao = 'venda',
  onFechar,
  onVerComprovante,
}: Props) {
  const ehOrcamento = tipoOperacao === 'orcamento';
  useEffect(() => {
    if (!aberto) return;
    const t = window.setTimeout(onFechar, 10_000);
    return () => window.clearTimeout(t);
  }, [aberto, onFechar]);

  if (!venda) return null;

  const forma = venda.forma_pagamento
    ? (labelsFormaPagamento[venda.forma_pagamento] ?? venda.forma_pagamento)
    : '-';

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {ehOrcamento ? 'Orçamento concluído' : 'Venda concluída'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2
            className="h-16 w-16 text-green-500"
            strokeWidth={1.5}
          />
          <div className="text-3xl font-bold">
            {ehOrcamento ? 'Orçamento' : 'Venda'} #{venda.numero}
          </div>

          <div className="mt-2 grid w-full gap-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatBRL(venda.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Pagamento</span>
              <span>
                {forma}
                {venda.forma_pagamento === 'credito' && venda.parcelas > 1
                  ? ` em ${venda.parcelas}x`
                  : ''}
              </span>
            </div>
            {clienteNome && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Cliente</span>
                <span className="truncate">{clienteNome}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onFechar}>
            {ehOrcamento ? 'Novo Orçamento' : 'Nova Venda'}
          </Button>
          <Button onClick={onVerComprovante}>Ver Comprovante</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
