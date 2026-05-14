import { Router, Request, Response } from 'express';
import db from '../db/database';
import { autenticar } from '../middleware/auth';

const router = Router();

/**
 * GET /api/usuarios
 * Lista de usuários ativos (id, nome, email, perfil).
 * Acessível para admin e user (usado em seletores como vendedor do PDV).
 */
router.get('/', autenticar, (_req: Request, res: Response) => {
  const usuarios = db
    .prepare(
      `SELECT id, nome, email, perfil
       FROM usuarios
       WHERE ativo = 1
       ORDER BY nome COLLATE NOCASE`,
    )
    .all();

  return res.json(usuarios);
});

export default router;
