import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../db/database';
import { autenticar } from '../middleware/auth';
import type { JwtPayload, UsuarioComSenha } from '../types';

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * POST /api/auth/login
 * Body: { email, senha }
 * Retorna: { token, usuario }
 */
router.post('/login', (req: Request, res: Response) => {
  const { email, senha } = req.body ?? {};

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha' });
  }

  const usuario = db
    .prepare(
      `SELECT id, nome, email, perfil, senha_hash, ativo
       FROM usuarios
       WHERE email = ?`,
    )
    .get(email) as UsuarioComSenha | undefined;

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const payload: JwtPayload = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  return res.json({
    token,
    usuario: payload,
  });
});

/**
 * GET /api/auth/me
 * Retorna o usuário autenticado.
 */
router.get('/me', autenticar, (req: Request, res: Response) => {
  return res.json({ usuario: req.usuario });
});

export default router;
