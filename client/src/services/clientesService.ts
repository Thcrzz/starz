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

export interface NovoClientePayload {
  nome: string;
  cpf_cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  inscricao_estadual?: string | null;
}

export async function criarCliente(payload: NovoClientePayload): Promise<Cliente> {
  const { data } = await api.post<Cliente>('/clientes', payload);
  return data;
}

export interface CnpjConsulta {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
}

/**
 * Consulta CNPJ na BrasilAPI (sem autenticação, chamado direto do browser).
 */
export async function consultarCnpj(cnpj: string): Promise<CnpjConsulta> {
  const numero = cnpj.replace(/\D/g, '');
  if (numero.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }
  const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numero}`);
  if (!resp.ok) {
    throw new Error('CNPJ não encontrado');
  }
  return (await resp.json()) as CnpjConsulta;
}
