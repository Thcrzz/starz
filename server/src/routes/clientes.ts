import { Router, Request, Response } from 'express';
import db from '../db/database';
import { autenticar } from '../middleware/auth';

const router = Router();

/**
 * GET /api/clientes/busca?q=
 * Busca clientes ativos por nome, CPF ou CNPJ (LIKE %q%, mínimo 2 chars).
 */
router.get('/busca', autenticar, (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  if (q.length < 2) {
    return res.json([]);
  }

  const like = `%${q}%`;

  const clientes = db
    .prepare(
      `
      SELECT id, nome, cpf_cnpj, telefone, cidade, uf, fiado_liberado, limite_credito
      FROM clientes
      WHERE ativo = 1
        AND excluido_em IS NULL
        AND (
          nome LIKE ? COLLATE NOCASE
          OR cpf_cnpj LIKE ?
        )
      ORDER BY nome COLLATE NOCASE
      LIMIT ?
    `,
    )
    .all(like, like, limit);

  return res.json(clientes);
});

/**
 * GET /api/clientes/:id
 * Detalhe completo do cliente.
 */
router.get('/:id', autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  const cliente = db
    .prepare(
      `SELECT id, nome, cpf_cnpj, inscricao_estadual, cep, logradouro, numero,
              complemento, bairro, cidade, uf, telefone, email,
              fiado_liberado, limite_credito, ativo, criado_em
       FROM clientes
       WHERE id = ? AND ativo = 1 AND excluido_em IS NULL`,
    )
    .get(id);

  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado' });
  }

  return res.json(cliente);
});

interface NovoClienteBody {
  nome?: unknown;
  cpf_cnpj?: unknown;
  telefone?: unknown;
  email?: unknown;
  cidade?: unknown;
  uf?: unknown;
  cep?: unknown;
  logradouro?: unknown;
  numero?: unknown;
  complemento?: unknown;
  bairro?: unknown;
  inscricao_estadual?: unknown;
}

function s(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * POST /api/clientes
 * Cria um novo cliente. Apenas `nome` é obrigatório.
 * Retorna 409 se já existir cliente com o mesmo cpf_cnpj.
 */
router.post('/', autenticar, (req: Request, res: Response) => {
  const body = (req.body ?? {}) as NovoClienteBody;
  const nome = s(body.nome);
  if (!nome) {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }

  const cpfCnpj = s(body.cpf_cnpj);
  if (cpfCnpj) {
    const existente = db
      .prepare(
        `SELECT id FROM clientes
         WHERE cpf_cnpj = ? AND excluido_em IS NULL`,
      )
      .get(cpfCnpj);
    if (existente) {
      return res.status(409).json({ erro: 'CPF/CNPJ já cadastrado' });
    }
  }

  const info = db
    .prepare(
      `INSERT INTO clientes
         (nome, cpf_cnpj, inscricao_estadual, cep, logradouro, numero,
          complemento, bairro, cidade, uf, telefone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      nome,
      cpfCnpj,
      s(body.inscricao_estadual),
      s(body.cep),
      s(body.logradouro),
      s(body.numero),
      s(body.complemento),
      s(body.bairro),
      s(body.cidade),
      s(body.uf),
      s(body.telefone),
      s(body.email),
    );

  const id = Number(info.lastInsertRowid);
  const cliente = db
    .prepare(
      `SELECT id, nome, cpf_cnpj, inscricao_estadual, cep, logradouro, numero,
              complemento, bairro, cidade, uf, telefone, email,
              fiado_liberado, limite_credito, ativo, criado_em
       FROM clientes WHERE id = ?`,
    )
    .get(id);

  return res.status(201).json(cliente);
});

export default router;
