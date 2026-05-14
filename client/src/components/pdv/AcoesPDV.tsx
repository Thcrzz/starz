import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePDVStore } from '@/store/pdvStore';

export default function AcoesPDV() {
  const itens = usePDVStore((s) => s.itens);
  const formaPagamento = usePDVStore((s) => s.forma_pagamento);
  const clienteId = usePDVStore((s) => s.cliente_id);
  const limparCarrinho = usePDVStore((s) => s.limparCarrinho);

  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const carrinhoVazio = itens.length === 0;

  function tentarFinalizar() {
    if (formaPagamento === 'fiado' && !clienteId) {
      toast.error('Venda a prazo requer identificação do cliente');
      return;
    }
    toast.info('Em breve: finalização de venda');
  }

  function confirmarCancelamento() {
    limparCarrinho();
    setConfirmandoCancelar(false);
    toast.success('Venda cancelada');
  }

  const baseClasses = 'w-full py-6 text-base font-bold text-white';
  const desabilitadoClasses = 'disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      <section className="flex flex-col gap-2">
        <Button
          disabled={carrinhoVazio}
          onClick={tentarFinalizar}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#16a34a' }}
        >
          Finalizar Venda
        </Button>
        <Button
          disabled={carrinhoVazio}
          onClick={tentarFinalizar}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#15803d' }}
        >
          Finalizar Venda e Imprimir Pedido
        </Button>
        <Button
          disabled={carrinhoVazio}
          onClick={tentarFinalizar}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#d97706' }}
        >
          Finalizar Venda e Emitir NFC-e
        </Button>
        <Button
          onClick={() => setConfirmandoCancelar(true)}
          className={`${baseClasses} hover:opacity-90`}
          style={{ backgroundColor: '#dc2626' }}
        >
          Cancelar Venda
        </Button>
      </section>

      <Dialog
        open={confirmandoCancelar}
        onOpenChange={setConfirmandoCancelar}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar venda?</DialogTitle>
            <DialogDescription>
              Deseja cancelar a venda? Todos os itens do carrinho serão
              removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmandoCancelar(false)}
            >
              Voltar
            </Button>
            <Button
              onClick={confirmarCancelamento}
              className="font-bold text-white hover:opacity-90"
              style={{ backgroundColor: '#dc2626' }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
