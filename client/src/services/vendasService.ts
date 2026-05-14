import api from './api';
import type { Cliente, ItemVenda, Venda } from '@/types';

export interface NovoItemVenda {
  variacao_id?: number;
  descricao_snapshot: string;
  preco_unitario: number;
  preco_original?: number;
  quantidade: number;
  desconto_item: number;
  total_item: number;
  e_avulso: boolean;
}

export interface NovoPagamento {
  forma: string;
  valor: number;
  parcelas?: number;
}

export interface NovaVendaPayload {
  cliente_id?: number;
  retirado_por?: string;
  vendedor_id?: number;
  situacao: 'pago' | 'a_pagar';
  forma_pagamento?: string | null;
  parcelas: number;
  desconto: number;
  observacao?: string;
  tipo_operacao?: 'venda' | 'orcamento';
  pagamentos?: NovoPagamento[];
  itens: NovoItemVenda[];
}

export interface PagamentoSalvo {
  id: number;
  venda_id: number;
  forma: string;
  valor: number;
  parcelas: number;
  ordem: number;
}

export interface VendaCompleta extends Venda {
  itens: ItemVenda[];
  pagamentos?: PagamentoSalvo[];
}

export interface DadosComprovante {
  venda: VendaCompleta;
  cliente: Cliente | null;
  vendedor: { nome: string } | null;
  empresa: {
    nome: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
  };
}

export async function criarVenda(
  payload: NovaVendaPayload,
): Promise<VendaCompleta> {
  const { data } = await api.post<VendaCompleta>('/vendas', payload);
  return data;
}

export async function buscarVenda(id: number): Promise<VendaCompleta> {
  const { data } = await api.get<VendaCompleta>(`/vendas/${id}`);
  return data;
}

export async function buscarDadosComprovante(
  id: number,
): Promise<DadosComprovante> {
  const { data } = await api.get<DadosComprovante>(
    `/vendas/${id}/comprovante-dados`,
  );
  return data;
}
