import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { JwtPayload } from '../types';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * Middleware de autenticação JWT.
 * Espera header: Authorization: Bearer <token>
 */
export function autenticar(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token de autenticação não informado' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.usuario = {
      id: payload.id,
      nome: payload.nome,
      email: payload.email,
      perfil: payload.perfil,
    };
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}
