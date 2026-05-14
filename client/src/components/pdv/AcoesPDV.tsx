import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import {
  criarVenda,
  type NovaVendaPayload,
  type VendaCompleta,
} from '@/services/vendasService';
import ModalVendaConcluida from './ModalVendaConcluida';
import ModalComprovante from './ModalComprovante';

type Acao = 'simples' | 'imprimir' | 'nfce';

export default function AcoesPDV() {
  const itens = usePDVStore((s) => s.itens);
  const formaPagamento = usePDVStore((s) => s.forma_pagamento);
  const clienteId = usePDVStore((s) => s.cliente_id);
  const clienteNome = usePDVStore((s) => s.cliente_nome);
  const retiradoPor = usePDVStore((s) => s.retirado_por);
  const vendedorId = usePDVStore((s) => s.vendedor_id);
  const parcelas = usePDVStore((s) => s.parcelas);
  const descontoGeral = usePDVStore((s) => s.desconto_geral);
  const observacao = usePDVStore((s) => s.observacao);
  const limparCarrinho = usePDVStore((s) => s.limparCarrinho);

  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<Acao | null>(null);

  const [vendaConcluida, setVendaConcluida] = useState<VendaCompleta | null>(
    null,
  );
  const [clienteNomeRecibo, setClienteNomeRecibo] = useState<string>('');
  const [modalConcluida, setModalConcluida] = useState(false);
  const [modalComprovante, setModalComprovante] = useState(false);

  const carrinhoVazio = itens.length === 0;
  const carregando = acaoEmAndamento !== null;

  async function finalizar(acao: Acao) {
    if (carrinhoVazio) return;

    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento');
      return;
    }
    if (formaPagamento === 'fiado' && !clienteId) {
      toast.error('Venda a prazo requer identificação do cliente');
      return;
    }

    const payload: NovaVendaPayload = {
      cliente_id: clienteId,
      retirado_por: retiradoPor,
      vendedor_id: vendedorId,
      situacao: formaPagamento === 'fiado' ? 'a_pagar' : 'pago',
      forma_pagamento: formaPagamento,
      parcelas,
      desconto: descontoGeral,
      observacao,
      itens: itens.map((i) => ({
        variacao_id: i.variacao_id,
        descricao_snapshot: i.descricao,
        preco_unitario: i.preco_unitario,
        preco_original: i.preco_original,
        quantidade: i.quantidade,
        desconto_item: i.desconto_item,
        total_item: i.total_item,
        e_avulso: i.e_avulso,
      })),
    };

    setAcaoEmAndamento(acao);
    try {
      const venda = await criarVenda(payload);
      toast.success(`Venda #${venda.numero} registrada com sucesso!`);

      // Captura nome do cliente ANTES de limpar o store
      const nomeCli = clienteNome ?? '';
      setClienteNomeRecibo(nomeCli);
      setVendaConcluida(venda);

      limparCarrinho();

      if (acao === 'imprimir') {
        setModalComprovante(true);
      } else if (acao === 'nfce') {
        toast.info('NFC-e será implementada na Fase 3');
        setModalConcluida(true);
      } else {
        setModalConcluida(true);
      }
    } catch {
      toast.error('Falha ao registrar a venda');
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  function confirmarCancelamento() {
    limparCarrinho();
    setConfirmandoCancelar(false);
    toast.success('Venda cancelada');
  }

  function abrirComprovante() {
    setModalConcluida(false);
    setModalComprovante(true);
  }

  const baseClasses = 'w-full py-6 text-base font-bold text-white';
  const desabilitadoClasses = 'disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      <section className="flex flex-col gap-2">
        <Button
          disabled={carrinhoVazio || carregando}
          onClick={() => finalizar('simples')}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#16a34a' }}
        >
          {acaoEmAndamento === 'simples' && (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          )}
          Finalizar Venda
        </Button>
        <Button
          disabled={carrinhoVazio || carregando}
          onClick={() => finalizar('imprimir')}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#15803d' }}
        >
          {acaoEmAndamento === 'imprimir' && (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          )}
          Finalizar Venda e Imprimir Pedido
        </Button>
        <Button
          disabled={carrinhoVazio || carregando}
          onClick={() => finalizar('nfce')}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#d97706' }}
        >
          {acaoEmAndamento === 'nfce' && (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          )}
          Finalizar Venda e Emitir NFC-e
        </Button>
        <Button
          disabled={carregando}
          onClick={() => setConfirmandoCancelar(true)}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
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

      <ModalVendaConcluida
        aberto={modalConcluida}
        venda={vendaConcluida}
        clienteNome={clienteNomeRecibo || undefined}
        onFechar={() => setModalConcluida(false)}
        onVerComprovante={abrirComprovante}
      />

      <ModalComprovante
        aberto={modalComprovante}
        vendaId={vendaConcluida?.id ?? null}
        onFechar={() => setModalComprovante(false)}
      />
    </>
  );
}
