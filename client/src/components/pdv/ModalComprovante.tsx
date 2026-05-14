import { useEffect, useState } from 'react';
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
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatData(s: string): string {
  // Vem como "YYYY-MM-DD HH:MM:SS" do SQLite (UTC). Mostra simples.
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

  const totalDescontos = venda
    ? venda.itens.reduce((acc, i) => acc + (i.desconto_item ?? 0), 0) +
      (venda.desconto ?? 0)
    : 0;

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

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprovante de Venda</DialogTitle>
        </DialogHeader>

        {carregando && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        )}

        {erro && (
          <div className="py-8 text-center text-sm text-red-500">{erro}</div>
        )}

        {dados && venda && empresa && (
          <div className="comprovante-print bg-white p-6 text-sm text-black">
            {/* Cabeçalho */}
            <div className="mb-4 flex items-start justify-between gap-6 border-b border-zinc-300 pb-3">
              <div>
                <div className="text-xl font-bold text-[#F97316]">
                  KORTA TERRA
                </div>
                <div className="text-xs text-zinc-600">Sistema STARZ</div>
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold">{empresa.nome}</div>
                {empresa.cnpj && <div>CNPJ: {empresa.cnpj}</div>}
                {empresa.endereco && <div>{empresa.endereco}</div>}
                {empresa.telefone && <div>Tel: {empresa.telefone}</div>}
                {empresa.email && <div>{empresa.email}</div>}
              </div>
            </div>

            {/* Dados da Venda */}
            <div className="mb-4">
              <div className="mb-1 inline-block bg-[#F97316] px-2 py-0.5 text-xs font-bold text-white">
                DADOS DA VENDA
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="font-semibold">Venda:</span> #{venda.numero}
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
                  {venda.situacao === 'pago' ? 'Venda' : 'A Pagar'}
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
            <div className="mb-4">
              <div className="mb-1 inline-block bg-[#F97316] px-2 py-0.5 text-xs font-bold text-white">
                ITENS DA VENDA
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-800">
                    <th className="border border-zinc-300 px-2 py-1 text-left">
                      Tipo
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-left">
                      Descrição
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-right">
                      Preço Unit.
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-right">
                      Quant.
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-right">
                      Desconto
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {venda.itens.map((it) => (
                    <tr key={it.id}>
                      <td className="border border-zinc-300 px-2 py-1">
                        {it.e_avulso ? 'Avulso' : 'Produto'}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1">
                        {it.descricao_snapshot}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right">
                        {formatBRL(it.preco_unitario)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right">
                        {it.quantidade}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right">
                        {formatBRL(it.desconto_item ?? 0)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right">
                        {formatBRL(it.total_item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="font-semibold">Total de itens:</span>{' '}
                  {venda.itens.length}
                </div>
                <div>
                  <span className="font-semibold">Desconto:</span>{' '}
                  {formatBRL(totalDescontos)}
                </div>
                <div>
                  <span className="font-semibold">Subtotal:</span>{' '}
                  {formatBRL(venda.subtotal)}
                </div>
                <div className="text-right">
                  <span className="font-semibold">TOTAL GERAL:</span>{' '}
                  <span className="text-base font-bold text-[#F97316]">
                    {formatBRL(venda.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financeiro */}
            <div className="mb-4">
              <div className="mb-1 inline-block bg-[#F97316] px-2 py-0.5 text-xs font-bold text-white">
                FINANCEIRO
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-800">
                    <th className="border border-zinc-300 px-2 py-1 text-left">
                      #
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-right">
                      Valor
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-left">
                      Data pgto
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-left">
                      Forma de pagamento
                    </th>
                    <th className="border border-zinc-300 px-2 py-1 text-left">
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhasFinanceiro.map((l) => (
                    <tr key={l.n}>
                      <td className="border border-zinc-300 px-2 py-1">
                        {l.n}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right">
                        {formatBRL(l.valor)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1">
                        {l.dataPgto}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1">
                        {l.forma}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1">
                        {l.situacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé */}
            <div className="mt-6 border-t border-zinc-300 pt-3 text-xs">
              {venda.retirado_por && (
                <div className="mb-2">
                  <span className="font-semibold">Retirado por:</span>{' '}
                  {venda.retirado_por}
                </div>
              )}
              <div className="mt-6 flex flex-col items-center">
                <div className="w-2/3 border-t border-zinc-700" />
                <div className="mt-1 text-center text-xs">
                  {venda.retirado_por ?? cliente?.nome ?? 'Assinatura'}
                </div>
              </div>
            </div>
          </div>
        )}

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
  );
}
