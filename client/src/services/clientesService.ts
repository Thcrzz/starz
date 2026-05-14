import api from './api';
import type { Cliente } from '@/types';

export type ResumoCliente = Pick<
  Cliente,
  | 'id'
  | 'nome'
  | 'cpf_cnpj'
  | 'telefone'
  | 'cidade'
  | 'uf'
  | 'fiado_liberado'
  | 'limite_credito'
>;

export async function buscarClientes(q: string): Promise<ResumoCliente[]> {
  if (!q || q.trim().length < 2) return [];
  const { data } = await api.get<ResumoCliente[]>('/clientes/busca', {
    params: { q },
  });
  return data;
}

export async function buscarClientePorId(id: number): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
}
