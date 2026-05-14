import api from './api';
import type { Usuario } from '@/types';

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

interface MeResponse {
  usuario: Usuario;
}

/**
 * Faz login com e-mail e senha, retorna token + usuário.
 */
export async function login(email: string, senha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, senha });
  return data;
}

/**
 * Busca os dados do usuário autenticado a partir do token atual.
 */
export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<MeResponse>('/auth/me');
  return data.usuario;
}
