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

interface Props {
  aberto: boolean;
  vendaId: number | null;
  onFechar: () => void;
  tipoOperacao?: 'venda' | 'orcamento';
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
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
}: Props) {
  const [dados, setDados] = useState<DadosComprovante | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto || !vendaId) {
      setDados(null);
      setErro(null);
      return;
    }
    let ativo = true;
    setCarregando(true);
    setErro(null);
    buscarDadosComprovante(vendaId)
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch(() => {
        if (ativo) setErro('Falha ao carregar comprovante');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [aberto, vendaId]);

  function handleImprimir() {
    window.print();
  }

  const venda = dados?.venda;
  const cliente = dados?.cliente;
  const vendedor = dados?.vendedor;
  const empresa = dados?.empresa;

  const ehOrcamento = tipoOperacao === 'orcamento';
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
    const formaLbl =
      labelsFormaPagamento[venda.forma_pagamento ?? ''] ??
      venda.forma_pagamento ??
      '-';
    if (venda.forma_pagamento === 'credito' && venda.parcelas > 1) {
      const valorParcela = venda.total / venda.parcelas;
      return Array.from({ length: venda.parcelas }, (_, i) => ({
        n: i + 1,
        valor: valorParcela,
        dataPgto,
        forma: formaLbl,
        situacao: venda.situacao === 'pago' ? 'Pago' : 'A pagar',
      }));
    }
    return [
      {
        n: 1,
        valor: venda.total,
        dataPgto,
        forma: formaLbl,
        situacao: venda.situacao === 'pago' ? 'Pago' : 'A pagar',
      },
    ];
  })();

  /**
   * Renderiza o conteúdo do comprovante. Usado em dois lugares:
   * 1) Dentro do Dialog (visualização na tela)
   * 2) Em um portal direto no <body> com classe `comprovante-print-wrapper`
   *    (somente visível durante @media print — escondido em tela via inline style)
   */
  function renderComprovante() {
    if (!venda || !empresa) return null;
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
            <thead>
              <tr className="print-header-bg bg-[#FE6100] font-bold text-white">
                <th className="px-2 py-1 text-left">Tipo</th>
                <th className="px-2 py-1 text-left">
                  Descrição
                </th>
                <th className="px-2 py-1 text-right">
                  Preço Unit.
                </th>
                <th className="px-2 py-1 text-right">
                  Quant.
                </th>
                <th className="px-2 py-1 text-right">
                  Desconto
                </th>
                <th className="px-2 py-1 text-right">
                  Total
                </th>
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
                    <td className="px-2 py-1">
                      {it.e_avulso ? 'Avulso' : 'Produto'}
                    </td>
                    <td className="px-2 py-1">
                      {it.descricao_snapshot}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatBRL(it.preco_unitario)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {it.quantidade}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatBRL(it.desconto_item ?? 0)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatBRL(it.total_item)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {/* Linha SUBTOTAL — "SUBTOTAL" sob Preço Unit., qtd sob Quant. */}
              <tr className="bg-[#f5f5f5] font-bold print-row-odd">
                <td className="px-2 py-1"></td>
                <td className="px-2 py-1"></td>
                <td className="px-2 py-1 text-right">SUBTOTAL</td>
                <td className="px-2 py-1 text-center">
                  {venda.itens.length}
                </td>
                <td className="px-2 py-1"></td>
                <td className="px-2 py-1 text-right">
                  {formatBRL(venda.subtotal)}
                </td>
              </tr>
              {/* Linha TOTAL GERAL — fundo laranja, dentro da tabela */}
              <tr className="print-header-bg bg-[#FE6100] font-bold text-white">
                <td
                  colSpan={5}
                  className="px-2 py-1.5 text-right text-sm"
                >
                  TOTAL GERAL
                </td>
                <td className="px-2 py-1.5 text-right text-base">
                  {formatBRL(venda.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Financeiro */}
        <div
          className="mb-4 pb-4"
          style={{ borderBottom: '1px solid #e0e0e0' }}
        >
          <div className="mb-2 text-sm font-bold text-gray-900">FINANCEIRO</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="print-header-bg bg-[#FE6100] font-bold text-white">
                <th className="px-2 py-1 text-left">#</th>
                <th className="px-2 py-1 text-right">
                  Valor
                </th>
                <th className="px-2 py-1 text-left">
                  Data pgto
                </th>
                <th className="px-2 py-1 text-left">
                  Forma de pagamento
                </th>
                <th className="px-2 py-1 text-left">
                  Situação
                </th>
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
                    <td className="px-2 py-1 text-right">
                      {formatBRL(l.valor)}
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
          </table>
        </div>

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

          <DialogFooter className="no-print">
            <Button variant="ghost" onClick={onFechar}>
              Fechar
            </Button>
            <Button onClick={handleImprimir} disabled={!dados}>
              <Printer className="mr-1 h-4 w-4" /> Imprimir
            </Button>
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
      {aberto &&
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
