import { Request, Response, NextFunction } from 'express';

/**
 * Permite acesso apenas a usuários com perfil 'admin'.
 * Deve ser usado após o middleware `autenticar`.
 */
export function apenasAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.usuario || req.usuario.perfil !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
