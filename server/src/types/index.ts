/**
 * Tipos compartilhados pelo backend.
 */

export type Perfil = 'admin' | 'user';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface UsuarioComSenha extends Usuario {
  senha_hash: string;
  ativo: number;
}

/**
 * Payload do JWT.
 */
export interface JwtPayload {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

// Augment Express para tipar req.usuario após o middleware de autenticação
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}
