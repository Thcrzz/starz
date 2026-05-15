import { formatMoney } from '@/hooks/useMoneyInput';
import type { DadosComprovante } from '@/services/vendasService';

interface ComprovanteContentProps {
  dadosComprovante: DadosComprovante;
  /** Id aplicado no container raiz — útil pra html2pdf mirar o nó certo. */
  id?: string;
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

function formatData(s: string): string {
  // Vem como "YYYY-MM-DD HH:MM:SS" do SQLite (UTC).
  const d = new Date(s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Conteúdo puro do comprovante (cabeçalho, dados, tabela de itens, financeiro,
 * assinatura, rodapé Powered by STARZ). Reutilizado em três lugares:
 * 1. ModalComprovante (dentro de um Dialog)
 * 2. ComprovantePage (rota standalone)
 * 3. Portal de impressão (createPortal pra body, escondido em tela)
 *
 * Mantém as classes existentes que entram em jogo no CSS de impressão
 * (`comprovante-print-wrapper`, `row-subtotal`, `row-total-geral`,
 * `print-header-bg`, `print-row-even/odd`) — toda a estética de print é
 * preservada.
 */
export default function ComprovanteContent({
  dadosComprovante,
  id,
}: ComprovanteContentProps) {
  const { venda, cliente, vendedor, empresa } = dadosComprovante;

  const ehOrcamento = venda.tipo_operacao === 'orcamento';
  const tituloSecaoDados = ehOrcamento ? 'DADOS DO ORÇAMENTO' : 'DADOS DA VENDA';
  const tituloSecaoItens = ehOrcamento ? 'ITENS DO ORÇAMENTO' : 'ITENS DA VENDA';
  const labelNumero = ehOrcamento ? 'Orçamento' : 'Venda';

  const dataPgto =
    venda.situacao === 'pago' && venda.criado_em
      ? formatData(venda.criado_em)
      : '—';

  // Linhas do quadro Financeiro — uma por pagamento. Compat com vendas antigas
  // que ainda não têm pagamentos[].
  const linhasFinanceiro = (() => {
    const situacaoLbl = venda.situacao === 'pago' ? 'Pago' : 'A pagar';
    const pagamentos = venda.pagamentos ?? [];
    if (pagamentos.length > 0) {
      return pagamentos.map((p, idx) => {
        const formaLbl = labelsFormaPagamento[p.forma] ?? p.forma;
        const sufixoParcelas =
          p.forma === 'credito' && p.parcelas > 1 ? ` (${p.parcelas}x)` : '';
        return {
          n: idx + 1,
          valor: p.valor,
          dataPgto,
          forma: formaLbl + sufixoParcelas,
          situacao: situacaoLbl,
        };
      });
    }
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

  // Distribuição visual do desconto geral entre os itens — última linha
  // absorve o resíduo de arredondamento pra soma bater exata.
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
    <div
      id={id}
      className="flex min-h-screen flex-col bg-white p-6 text-sm text-gray-900"
    >
      {/* Cabeçalho */}
      <div className="mb-4 flex items-start justify-between gap-6 border-b border-zinc-300 pb-3">
        <img
          src="/Logo_Korta_Terra_Primario_Laranja_0,75.png"
          alt="Korta Terra"
          style={{ height: '80px', maxWidth: '240px', objectFit: 'contain' }}
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
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e0e0e0' }}>
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
      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <div className="mb-2 text-sm font-bold text-gray-900">
          {tituloSecaoItens}
        </div>
        <table className="w-full border-collapse text-xs">
          <colgroup>
            <col />
            <col />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
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
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{
                  backgroundColor: '#FE6100',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                Preço Unit.
              </td>
              <td
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{
                  backgroundColor: '#FE6100',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                Quant.
              </td>
              <td
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{
                  backgroundColor: '#FE6100',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                Desconto
              </td>
              <td
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
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
              const zebraScreen = idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]';
              const zebraPrint =
                idx % 2 === 0 ? 'print-row-even' : 'print-row-odd';
              return (
                <tr key={it.id} className={`${zebraScreen} ${zebraPrint}`}>
                  <td className="px-2 py-1">{idx + 1}</td>
                  <td className="px-2 py-1">{it.descricao_snapshot}</td>
                  <td className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap">
                    {formatMoney(it.preco_unitario)}
                  </td>
                  <td className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap">
                    {it.quantidade}
                  </td>
                  <td className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap">
                    {formatMoney((it.desconto_item ?? 0) + distribuidos[idx])}
                  </td>
                  <td className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap">
                    {formatMoney(it.total_item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* Linha SUBTOTAL — Preço Unit. mostra "SUBTOTAL", Quant. mostra
                a soma das quantidades, Desconto mostra o desconto geral,
                Total mostra o subtotal (antes do desconto geral). */}
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
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                SUBTOTAL
              </td>
              <td
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                {venda.itens.reduce(
                  (acc, it) => acc + (it.quantidade || 0),
                  0,
                )}
              </td>
              <td
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                {formatMoney(venda.desconto)}
              </td>
              <td
                className="px-2 py-1 text-right min-w-[100px] whitespace-nowrap"
                style={{ backgroundColor: '#f5f5f5' }}
              >
                {formatMoney(venda.subtotal)}
              </td>
            </tr>
            {/* Linha TOTAL GERAL — fundo cinza claro, texto preto */}
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
                className="px-2 py-1.5 text-right text-base min-w-[100px] whitespace-nowrap"
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
                    <td className="px-2 py-1">{l.dataPgto}</td>
                    <td className="px-2 py-1">{l.forma}</td>
                    <td className="px-2 py-1">{l.situacao}</td>
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

      {/* Powered by STARZ — pé da folha (mt-auto em tela, fixed na impressão) */}
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
