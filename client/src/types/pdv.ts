export interface ItemCarrinho {
  id: string;
  variacao_id?: number;
  descricao: string;
  preco_unitario: number;
  preco_original: number;
  quantidade: number;
  desconto_item: number;
  total_item: number;
  e_avulso: boolean;
  unidade: string;
}

export interface BuscaProdutoResultado {
  id: number;
  produto_id?: number;
  produto_nome: string;
  marca_nome?: string;
  especificacao?: string;
  sku?: string;
  unidade: string;
  preco: number;
  controla_estoque: number;
  estoque_atual: number;
  estoque_minimo?: number;
  status: string;
  tem_variacoes: boolean;
  variacoes_do_grupo: BuscaProdutoResultado[];
}

export interface EstadoPDV {
  itens: ItemCarrinho[];
  cliente_id?: number;
  cliente_nome?: string;
  retirado_por?: string;
  vendedor_id?: number;
  vendedor_nome?: string;
  forma_pagamento?: string;
  parcelas: number;
  desconto_geral: number;
  observacao?: string;
}
