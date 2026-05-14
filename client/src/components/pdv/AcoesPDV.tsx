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
import ComprovantePrintInvisivel from './ComprovantePrintInvisivel';
import { formatMoney } from '@/hooks/useMoneyInput';

type Acao = 'simples' | 'imprimir' | 'nfce';

export default function AcoesPDV() {
  const itens = usePDVStore((s) => s.itens);
  const formaPagamento = usePDVStore((s) => s.forma_pagamento);
  const clienteId = usePDVStore((s) => s.cliente_id);
  const clienteNome = usePDVStore((s) => s.cliente_nome);
  const retiradoPor = usePDVStore((s) => s.retirado_por);
  const vendedorId = usePDVStore((s) => s.vendedor_id);
  const parcelas = usePDVStore((s) => s.parcelas);
  const observacao = usePDVStore((s) => s.observacao);
  const tipoOperacao = usePDVStore((s) => s.tipo_operacao);
  const pagamentos = usePDVStore((s) => s.pagamentos);
  const limparCarrinho = usePDVStore((s) => s.limparCarrinho);
  const itensComDescontoDistribuido = usePDVStore(
    (s) => s.itensComDescontoDistribuido,
  );
  const descontoGeralAbsoluto = usePDVStore((s) => s.descontoGeralAbsoluto);
  const totalComDesconto = usePDVStore((s) => s.totalComDesconto());
  const totalPago = usePDVStore((s) => s.totalPago());
  const diferenca = usePDVStore((s) => s.diferencaPagamento());

  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<Acao | null>(null);
  const [confirmandoDiferenca, setConfirmandoDiferenca] = useState<Acao | null>(
    null,
  );

  const [vendaConcluida, setVendaConcluida] = useState<VendaCompleta | null>(
    null,
  );
  const [clienteNomeRecibo, setClienteNomeRecibo] = useState<string>('');
  const [tipoOpRecibo, setTipoOpRecibo] = useState<'venda' | 'orcamento'>(
    'venda',
  );
  const [modalConcluida, setModalConcluida] = useState(false);
  const [modalComprovante, setModalComprovante] = useState(false);
  const [printInvisivel, setPrintInvisivel] = useState(false);

  const carrinhoVazio = itens.length === 0;
  const carregando = acaoEmAndamento !== null;
  const ehOrcamento = tipoOperacao === 'orcamento';

  const lblFinalizar = ehOrcamento ? 'Finalizar Orçamento' : 'Finalizar Venda';
  const lblImprimir = ehOrcamento
    ? 'Finalizar Orçamento e Imprimir'
    : 'Finalizar Venda e Imprimir Pedido';
  const lblCancelar = ehOrcamento ? 'Cancelar Orçamento' : 'Cancelar Venda';
  const tituloConfirmar = ehOrcamento
    ? 'Cancelar orçamento?'
    : 'Cancelar venda?';
  const textoConfirmar = ehOrcamento
    ? 'Deseja cancelar o orçamento? Todos os itens do carrinho serão removidos.'
    : 'Deseja cancelar a venda? Todos os itens do carrinho serão removidos.';
  const sucessoCancelar = ehOrcamento
    ? 'Orçamento cancelado'
    : 'Venda cancelada';

  async function finalizar(acao: Acao) {
    if (carrinhoVazio) return;

    // Orçamento não exige forma de pagamento nem conferência
    if (!ehOrcamento) {
      if (pagamentos.length === 0) {
        toast.error('Adicione ao menos uma forma de pagamento');
        return;
      }
      const temFiadoSemCli =
        pagamentos.some((p) => p.forma === 'fiado') && !clienteId;
      if (temFiadoSemCli) {
        toast.error('Venda a prazo requer identificação do cliente');
        return;
      }
      // Se valores não conferem, pede confirmação antes de prosseguir
      if (Math.abs(diferenca) >= 0.005) {
        setConfirmandoDiferenca(acao);
        return;
      }
    }

    await executarVenda(acao);
  }

  async function executarVenda(acao: Acao) {
    // Distribui o desconto geral proporcionalmente nos itens antes de salvar.
    // A tabela vendas continua guardando o desconto_geral em `desconto`, e
    // itens_venda recebe `desconto_item` já com o rateio incluído.
    const itensRateados = itensComDescontoDistribuido();

    const formaPrincipal = pagamentos[0]?.forma ?? formaPagamento ?? null;
    const temFiado = pagamentos.some((p) => p.forma === 'fiado');

    const payload: NovaVendaPayload = {
      cliente_id: clienteId,
      retirado_por: retiradoPor,
      vendedor_id: vendedorId,
      situacao: !ehOrcamento && temFiado ? 'a_pagar' : 'pago',
      forma_pagamento: formaPrincipal,
      parcelas,
      desconto: descontoGeralAbsoluto(),
      observacao,
      tipo_operacao: tipoOperacao,
      pagamentos: pagamentos.map((p) => ({
        forma: p.forma,
        valor: p.valor,
        parcelas: p.parcelas,
      })),
      itens: itensRateados.map((i) => ({
        variacao_id: i.variacao_id,
        descricao_snapshot: i.descricao,
        preco_unitario: i.preco_unitario,
        preco_original: i.preco_original,
        quantidade: i.quantidade,
        desconto_item: i.desconto_item_final,
        total_item: i.total_item_final,
        e_avulso: i.e_avulso,
      })),
    };

    setAcaoEmAndamento(acao);
    try {
      const venda = await criarVenda(payload);
      toast.success(
        ehOrcamento
          ? `Orçamento #${venda.numero} registrado com sucesso!`
          : `Venda #${venda.numero} registrada com sucesso!`,
      );

      // Captura tipo e nome do cliente ANTES de limpar o store
      const nomeCli = clienteNome ?? '';
      setClienteNomeRecibo(nomeCli);
      setTipoOpRecibo(tipoOperacao);
      setVendaConcluida(venda);

      limparCarrinho();

      if (acao === 'imprimir') {
        // Mostra o modal de conclusão E dispara impressão automática em
        // background (componente invisível que monta o comprovante, carrega
        // dados e chama window.print() sozinho).
        setModalConcluida(true);
        setPrintInvisivel(true);
      } else if (acao === 'nfce') {
        toast.info('NFC-e será implementada na Fase 3');
        setModalConcluida(true);
      } else {
        setModalConcluida(true);
      }
    } catch {
      toast.error(
        ehOrcamento
          ? 'Falha ao registrar o orçamento'
          : 'Falha ao registrar a venda',
      );
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  function confirmarCancelamento() {
    limparCarrinho();
    setConfirmandoCancelar(false);
    toast.success(sucessoCancelar);
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
          {lblFinalizar}
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
          {lblImprimir}
        </Button>

        {!ehOrcamento && (
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
        )}

        <Button
          disabled={carregando}
          onClick={() => setConfirmandoCancelar(true)}
          className={`${baseClasses} ${desabilitadoClasses} hover:opacity-90`}
          style={{ backgroundColor: '#dc2626' }}
        >
          {lblCancelar}
        </Button>
      </section>

      <Dialog
        open={confirmandoCancelar}
        onOpenChange={setConfirmandoCancelar}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tituloConfirmar}</DialogTitle>
            <DialogDescription>{textoConfirmar}</DialogDescription>
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

      <Dialog
        open={confirmandoDiferenca !== null}
        onOpenChange={(o) => !o && setConfirmandoDiferenca(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atenção: valores não conferem</DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block">
                Total da venda: R$ {formatMoney(totalComDesconto)}
              </span>
              <span className="block">
                Total dos pagamentos: R$ {formatMoney(totalPago)}
              </span>
              <span className="block font-semibold">
                Diferença: R$ {formatMoney(Math.abs(diferenca))}{' '}
                {diferenca > 0 ? '(faltando)' : '(sobrando)'}
              </span>
              <span className="mt-2 block">
                Deseja continuar mesmo assim?
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmandoDiferenca(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const acao = confirmandoDiferenca;
                setConfirmandoDiferenca(null);
                if (acao) executarVenda(acao);
              }}
            >
              Continuar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalVendaConcluida
        aberto={modalConcluida}
        venda={vendaConcluida}
        clienteNome={clienteNomeRecibo || undefined}
        tipoOperacao={tipoOpRecibo}
        onFechar={() => setModalConcluida(false)}
        onVerComprovante={abrirComprovante}
      />

      <ModalComprovante
        aberto={modalComprovante}
        vendaId={vendaConcluida?.id ?? null}
        tipoOperacao={tipoOpRecibo}
        onFechar={() => setModalComprovante(false)}
      />

      {printInvisivel && (
        <ComprovantePrintInvisivel
          vendaId={vendaConcluida?.id ?? null}
          tipoOperacao={tipoOpRecibo}
          onCompleto={() => setPrintInvisivel(false)}
        />
      )}
    </>
  );
}
