/**
 * Tipos compartilhados pelo frontend.
 */

export type Perfil = 'admin' | 'user';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Marca {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  nome: string;
  marca_id: number | null;
  ativo: boolean;
  criado_em: string;
}

export type StatusVariacao = 'ativo' | 'pendente';

export interface Variacao {
  id: number;
  produto_id: number;
  sku: string | null;
  especificacao: string | null;
  unidade: string;
  preco: number;
  ncm: string | null;
  cfop: string | null;
  csosn: string | null;
  origem: number;
  codigo_barras: string | null;
  controla_estoque: boolean;
  estoque_atual: number;
  estoque_minimo: number;
  status: StatusVariacao;
  produto_pai_pendente: boolean;
  ativo: boolean;
  criado_em: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string | null;
  inscricao_estadual: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  email: string | null;
  fiado_liberado: boolean;
  limite_credito: number;
  ativo: boolean;
  criado_em: string;
}

export type FormaPagamento =
  | 'dinheiro'
  | 'debito'
  | 'credito'
  | 'pix'
  | 'cheque'
  | 'transferencia'
  | 'fiado';

export type SituacaoVenda = 'pago' | 'a_pagar' | 'cancelada';
export type StatusNFCe = 'pendente' | 'autorizada' | 'contingencia' | 'cancelada';

export interface ItemVenda {
  id: number;
  venda_id: number;
  variacao_id: number | null;
  descricao_snapshot: string;
  preco_unitario: number;
  preco_original: number | null;
  quantidade: number;
  desconto_item: number;
  total_item: number;
  e_avulso: boolean;
}

export interface Venda {
  id: number;
  numero: number;
  cliente_id: number | null;
  retirado_por: string | null;
  vendedor_id: number | null;
  situacao: SituacaoVenda;
  forma_pagamento: FormaPagamento | null;
  parcelas: number;
  subtotal: number;
  desconto: number;
  total: number;
  nfce_chave: string | null;
  nfce_status: StatusNFCe | null;
  nfe_id: number | null;
  observacao: string | null;
  criado_em: string;
  itens?: ItemVenda[];
}
