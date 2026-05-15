import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  buscarDadosComprovante,
  type DadosComprovante,
} from '@/services/vendasService';
import { formatMoney } from '@/hooks/useMoneyInput';

interface Props {
  aberto: boolean;
  vendaId: number | null;
  onFechar: () => void;
  tipoOperacao?: 'venda' | 'orcamento';
  /**
   * Se true, NÃO abre o Dialog mas renderiza o body-portal escondido em tela
   * e dispara window.print() automaticamente assim que os dados carregam.
   * Usado para "Finalizar Venda e Imprimir Pedido".
   */
  imprimirAutomaticamente?: boolean;
}


function formatData(s: string): string {
  // Vem como "YYYY-MM-DD HH:MM:SS" do SQLite (UTC).
  const d = new Date(s.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const labelsFormaPagamento: Record<string, string> = {
  dinheiro: 'Dinheiro',
  debito: 'Cartão de Débito',
  credito: 'Cartão de Crédito',
  pix: 'Pix',
  cheque: 'Cheque',
  transferencia: 'Transferência Eletrônica',
  fiado: 'Fiado / Prazo',
};

export default function ModalComprovante({
  aberto,
  vendaId,
  onFechar,
  tipoOperacao = 'venda',
  imprimirAutomaticamente = false,
}: Props) {
  const [dados, setDados] = useState<DadosComprovante | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ativo = aberto || imprimirAutomaticamente;

  useEffect(() => {
    if (!ativo || !vendaId) {
      setDados(null);
      setErro(null);
      return;
    }
    let vivo = true;
    setCarregando(true);
    setErro(null);
    buscarDadosComprovante(vendaId)
      .then((d) => {
        if (vivo) setDados(d);
      })
      .catch(() => {
        if (vivo) setErro('Falha ao carregar comprovante');
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [ativo, vendaId]);

  // Auto-print: quando o componente é montado no modo "imprimirAutomaticamente"
  // e os dados acabaram de chegar, dispara window.print() depois de pintar o DOM.
  useEffect(() => {
    if (!imprimirAutomaticamente || !dados) return;
    const t = window.setTimeout(() => {
      window.print();
      // Avisa o pai pra desmontar este componente
      onFechar();
    }, 300);
    return () => window.clearTimeout(t);
  }, [imprimirAutomaticamente, dados, onFechar]);

  function handleImprimir() {
    window.print();
  }

  const venda = dados?.venda;
  const cliente = dados?.cliente;
  const vendedor = dados?.vendedor;
  const empresa = dados?.empresa;

  // Fonte da verdade: o campo do backend; cai pra prop enquanto não carregou.
  const ehOrcamento =
    venda?.tipo_operacao === 'orcamento' ||
    (venda?.tipo_operacao === undefined && tipoOperacao === 'orcamento');
  const tituloModal = ehOrcamento ? 'Comprovante de Orçamento' : 'Comprovante de Venda';
  const tituloSecaoDados = ehOrcamento ? 'DADOS DO ORÇAMENTO' : 'DADOS DA VENDA';
  const tituloSecaoItens = ehOrcamento ? 'ITENS DO ORÇAMENTO' : 'ITENS DA VENDA';
  const labelNumero = ehOrcamento ? 'Orçamento' : 'Venda';

  const dataPgto =
    venda?.situacao === 'pago' && venda.criado_em
      ? formatData(venda.criado_em)
      : '—';

  const linhasFinanceiro = (() => {
    if (!venda) return [];
    const situacaoLbl = venda.situacao === 'pago' ? 'Pago' : 'A pagar';

    // Múltiplas formas de pagamento — uma linha por pagamento (sem detalhar parcelas)
    const pagamentos = venda.pagamentos ?? [];
    if (pagamentos.length > 0) {
      return pagamentos.map((p, idx) => {
        const formaLbl =
          labelsFormaPagamento[p.forma] ?? p.forma;
        const sufixoParcelas =
          p.forma === 'credito' && p.parcelas > 1
            ? ` (${p.parcelas}x)`
            : '';
        return {
          n: idx + 1,
          valor: p.valor,
          dataPgto,
          forma: formaLbl + sufixoParcelas,
          situacao: situacaoLbl,
        };
      });
    }

    // Compat: vendas antigas que ainda não têm pagamentos[] — usa forma_pagamento
    const formaLbl =
      labelsFormaPagamento[venda.forma_pagamento ?? ''] ??
      venda.forma_pagamento ??
      '-';
    return [
      {
        n: 1,
        valor: venda.total,
        dataPgto,
        forma: formaLbl,
        situacao: situacaoLbl,
      },
    ];
  })();

  const totalPagamentos = linhasFinanceiro.reduce(
    (acc, l) => acc + (l.valor || 0),
    0,
  );

  /**
   * Renderiza o conteúdo do comprovante. Usado em dois lugares:
   * 1) Dentro do Dialog (visualização na tela)
   * 2) Em um portal direto no <body> com classe `comprovante-print-wrapper`
   *    (somente visível durante @media print — escondido em tela via inline style)
   */
  function renderComprovante() {
    if (!venda || !empresa) return null;

    // Distribui o desconto geral proporcionalmente entre os itens — somente
    // visual no comprovante (não altera backend nem pdvStore). O último item
    // absorve o resíduo de arredondamento pra soma bater com venda.desconto.
    const subtotalItens = venda.itens.reduce(
      (acc, it) => acc + (it.total_item || 0),
      0,
    );
    const descontoGeral = venda.desconto || 0;
    const distribuidos: number[] = (() => {
      if (descontoGeral <= 0 || subtotalItens <= 0) {
        return venda.itens.map(() => 0);
      }
      const valores: number[] = [];
      let acumulado = 0;
      venda.itens.forEach((it, idx) => {
        if (idx === venda.itens.length - 1) {
          valores.push(Math.max(0, descontoGeral - acumulado));
        } else {
          const valor =
            Math.round((it.total_item / subtotalItens) * descontoGeral * 100) /
            100;
          valores.push(valor);
          acumulado += valor;
        }
      });
      return valores;
    })();

    return (
      <div className="flex min-h-screen flex-col bg-white p-6 text-sm text-gray-900">
        {/* Cabeçalho */}
        <div className="mb-4 flex items-start justify-between gap-6 border-b border-zinc-300 pb-3">
          <img
            src="/Logo_Korta_Terra_Primario_Laranja_0,75.png"
            alt="Korta Terra"
            style={{
              height: '80px',
              maxWidth: '240px',
              objectFit: 'contain',
            }}
          />
          <div className="text-right">
            <div className="text-sm font-semibold">Korta Terra</div>
            <div className="text-sm">Tel: (15) 3244-2655</div>
            <div className="text-sm">kortaterra@gmail.com</div>
            <div className="text-xs text-gray-500">
              Av. Tancredo Neves, 606, Vila Xavier, Piedade-SP, 18170-112
            </div>
          </div>
        </div>

        {/* Dados da Venda / Orçamento */}
        <div
          className="mb-4 pb-4"
          style={{ borderBottom: '1px solid #e0e0e0' }}
        >
          <div className="mb-2 text-sm font-bold text-gray-900">
            {tituloSecaoDados}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div>
              <span className="font-semibold">{labelNumero}:</span> #{venda.numero}
            </div>
            <div>
              <span className="font-semibold">Data:</span>{' '}
              {formatData(venda.criado_em)}
            </div>
            <div>
              <span className="font-semibold">Cliente:</span>{' '}
              {cliente?.nome ?? 'Consumidor final'}
            </div>
            <div>
              <span className="font-semibold">Situação:</span>{' '}
              {ehOrcamento
                ? 'Orçamento'
                : venda.situacao === 'pago'
                  ? 'Venda'
                  : 'A Pagar'}
            </div>
            <div>
              <span className="font-semibold">Telefone:</span>{' '}
              {cliente?.telefone ?? '—'}
            </div>
            <div>
              <span className="font-semibold">Vendedor:</span>{' '}
              {vendedor?.nome ?? '—'}
            </div>
            <div>
              <span className="font-semibold">Email:</span>{' '}
              {cliente?.email ?? '—'}
            </div>
            <div></div>
            <div className="col-span-2">
              <span className="font-semibold">Endereço:</span>{' '}
              {cliente
                ? [
                    cliente.logradouro,
                    cliente.numero,
                    cliente.complemento,
                    cliente.bairro,
                    cliente.cidade,
                    cliente.uf,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'
                : '—'}
            </div>
          </div>
        </div>

        {/* Itens */}
        <div
          className="mb-4 pb-4"
          style={{ borderBottom: '1px solid #e0e0e0' }}
        >
          <div className="mb-2 text-sm font-bold text-gray-900">
            {tituloSecaoItens}
          </div>
          <table className="w-full border-collapse text-xs">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr
                className="print-header-bg bg-[#FE6100] font-bold text-white"
                style={{ backgroundColor: '#FE6100', color: 'white' }}
              >
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  #
                </td>
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Descrição
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Preço Unit.
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Quant.
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Desconto
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Total
                </td>
              </tr>
            </thead>
            <tbody>
              {venda.itens.map((it, idx) => {
                const zebraScreen =
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]';
                const zebraPrint =
                  idx % 2 === 0 ? 'print-row-even' : 'print-row-odd';
                return (
                  <tr key={it.id} className={`${zebraScreen} ${zebraPrint}`}>
                    <td className="px-2 py-1">{idx + 1}</td>
                    <td className="px-2 py-1">
                      {it.descricao_snapshot}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatMoney(it.preco_unitario)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {it.quantidade}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatMoney((it.desconto_item ?? 0) + distribuidos[idx])}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatMoney(it.total_item)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {/* Linha SUBTOTAL — "SUBTOTAL" sob Preço Unit., qtd sob Quant.,
                  desconto geral sob Desconto, valor do subtotal sob Total. */}
              <tr
                className="row-subtotal bg-[#f5f5f5] font-bold"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                <td
                  className="px-2 py-1"
                  style={{ backgroundColor: '#f5f5f5' }}
                ></td>
                <td
                  className="px-2 py-1"
                  style={{ backgroundColor: '#f5f5f5' }}
                ></td>
                <td
                  className="px-2 py-1 text-right"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  SUBTOTAL
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  {venda.itens.length}
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  {formatMoney(venda.desconto)}
                </td>
                <td
                  className="px-2 py-1 text-right"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  {formatMoney(venda.subtotal)}
                </td>
              </tr>
              {/* Linha TOTAL GERAL — fundo cinza claro com texto preto */}
              <tr
                className="row-total-geral font-bold"
                style={{ backgroundColor: '#d4d4d4', color: 'black' }}
              >
                <td
                  colSpan={5}
                  className="px-2 py-1.5 text-right text-sm"
                  style={{ backgroundColor: '#d4d4d4', color: 'black' }}
                >
                  TOTAL GERAL
                </td>
                <td
                  className="px-2 py-1.5 text-right text-base"
                  style={{ backgroundColor: '#d4d4d4', color: 'black' }}
                >
                  {formatMoney(venda.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Financeiro — não aparece em orçamento */}
        {!ehOrcamento && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-bold text-gray-900">FINANCEIRO</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr
                className="print-header-bg bg-[#FE6100] font-bold text-white"
                style={{ backgroundColor: '#FE6100', color: 'white' }}
              >
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  #
                </td>
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Valor
                </td>
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Data pgto
                </td>
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Forma de pagamento
                </td>
                <td
                  className="px-2 py-1 text-left"
                  style={{
                    backgroundColor: '#FE6100',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Situação
                </td>
              </tr>
            </thead>
            <tbody>
              {linhasFinanceiro.map((l, idx) => {
                const zebraScreen =
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]';
                const zebraPrint =
                  idx % 2 === 0 ? 'print-row-even' : 'print-row-odd';
                return (
                  <tr key={l.n} className={`${zebraScreen} ${zebraPrint}`}>
                    <td className="px-2 py-1">{l.n}</td>
                    <td className="px-2 py-1 text-left">
                      {formatMoney(l.valor)}
                    </td>
                    <td className="px-2 py-1">
                      {l.dataPgto}
                    </td>
                    <td className="px-2 py-1">
                      {l.forma}
                    </td>
                    <td className="px-2 py-1">
                      {l.situacao}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {linhasFinanceiro.length > 1 && (
              <tfoot>
                <tr
                  className="row-subtotal font-bold"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  <td
                    className="px-2 py-1 text-right"
                    style={{ backgroundColor: '#f5f5f5' }}
                  >
                    Total
                  </td>
                  <td
                    className="px-2 py-1 text-left"
                    style={{ backgroundColor: '#f5f5f5' }}
                  >
                    {formatMoney(totalPagamentos)}
                  </td>
                  <td
                    colSpan={3}
                    className="px-2 py-1"
                    style={{ backgroundColor: '#f5f5f5' }}
                  ></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        )}

        {/* Rodapé — assinatura */}
        <div className="mt-6 border-t border-zinc-300 pt-3 text-xs">
          {venda.retirado_por && (
            <div className="mb-2">
              <span className="font-semibold">Retirado por:</span>{' '}
              {venda.retirado_por}
            </div>
          )}
          <div className="mb-8 mt-16 flex flex-col items-center">
            <div className="w-3/5 border-t border-zinc-700" />
            <div className="mt-1 text-center text-xs">
              {venda.retirado_por ?? cliente?.nome ?? 'Assinatura'}
            </div>
          </div>
        </div>

        {/* Powered by STARZ — pé da folha (mt-auto em tela, position fixed na impressão) */}
        <div className="comprovante-footer mt-auto flex items-center justify-center gap-2 pt-4">
          <span className="text-xs text-zinc-600">Powered by</span>
          <img
            src="/STARZ LOGO Vermelha.png"
            alt="STARZ"
            style={{ height: '16px', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tituloModal}</DialogTitle>
          </DialogHeader>

          {carregando && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          )}

          {erro && (
            <div className="py-8 text-center text-sm text-red-500">{erro}</div>
          )}

          {dados && renderComprovante()}

          <DialogFooter className="no-print flex-col items-stretch gap-2 sm:flex-col sm:items-stretch sm:space-x-0">
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onFechar}>
                Fechar
              </Button>
              <Button onClick={handleImprimir} disabled={!dados}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              Dica: ative &quot;Gráficos de plano de fundo&quot; no diálogo de
              impressão para manter as cores
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*
       * Cópia do comprovante posicionada como filha direta de <body> via portal.
       * Escondida em tela (inline display:none) e revelada apenas em @media print
       * pela regra `.comprovante-print-wrapper { display: block !important; }`.
       * Isso é necessário porque o Radix Dialog também portaliza para o body, e o
       * @media print esconde `body > *` — então o conteúdo dentro do Dialog não
       * aparece na impressão.
       */}
      {ativo &&
        dados &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="comprovante-print-wrapper"
            style={{ display: 'none' }}
          >
            {renderComprovante()}
          </div>,
          document.body,
        )}
    </>
  );
}
