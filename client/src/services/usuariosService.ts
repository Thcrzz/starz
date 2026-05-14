import api from './api';
import type { Usuario } from '@/types';

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/usuarios');
  return data;
}
