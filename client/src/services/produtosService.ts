import api from './api';
import type { BuscaProdutoResultado } from '@/types/pdv';

export async function buscarProdutos(
  q: string,
): Promise<BuscaProdutoResultado[]> {
  if (!q || q.trim().length < 2) return [];
  const { data } = await api.get<BuscaProdutoResultado[]>(
    '/produtos/busca',
    { params: { q, limit: 10 } },
  );
  return data;
}

export interface ProdutoAvulsoCriado {
  id: number;
  nome: string;
  preco: number;
  unidade: string;
  status: string;
}

export async function criarProdutoAvulso(payload: {
  nome: string;
  preco: number;
  unidade: string;
}): Promise<ProdutoAvulsoCriado> {
  const { data } = await api.post<ProdutoAvulsoCriado>(
    '/produtos/avulso',
    payload,
  );
  return data;
}
