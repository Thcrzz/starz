import { Router, Request, Response } from 'express';
import db from '../db/database';
import { autenticar } from '../middleware/auth';

const router = Router();

interface VariacaoRow {
  id: number;
  produto_id: number | null;
  produto_nome: string | null;
  marca_nome: string | null;
  especificacao: string | null;
  sku: string | null;
  codigo_barras: string | null;
  unidade: string;
  preco: number;
  controla_estoque: number;
  estoque_atual: number;
  estoque_minimo: number;
  status: string;
}

interface VariacaoResposta {
  id: number;
  produto_id: number | null;
  produto_nome: string;
  marca_nome: string | null;
  especificacao: string | null;
  sku: string | null;
  unidade: string;
  preco: number;
  controla_estoque: number;
  estoque_atual: number;
  estoque_minimo: number;
  status: string;
  tem_variacoes: boolean;
  variacoes_do_grupo: VariacaoResposta[];
}

/**
 * GET /api/produtos/busca?q=&limit=10
 * Busca variações ativas (com produto pai não excluído) por nome, marca,
 * especificação, sku ou código de barras.
 */
router.get('/busca', autenticar, (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  if (q.length < 2) {
    return res.json([]);
  }

  const like = `%${q}%`;

  const linhas = db
    .prepare(
      `
      SELECT
        v.id              AS id,
        v.produto_id      AS produto_id,
        p.nome            AS produto_nome,
        m.nome            AS marca_nome,
        v.especificacao   AS especificacao,
        v.sku             AS sku,
        v.codigo_barras   AS codigo_barras,
        v.unidade         AS unidade,
        v.preco           AS preco,
        v.controla_estoque AS controla_estoque,
        v.estoque_atual   AS estoque_atual,
        v.estoque_minimo  AS estoque_minimo,
        v.status          AS status
      FROM variacoes v
      LEFT JOIN produtos p ON p.id = v.produto_id AND p.excluido_em IS NULL
      LEFT JOIN marcas m   ON m.id = p.marca_id   AND m.excluido_em IS NULL
      WHERE v.ativo = 1
        AND v.excluido_em IS NULL
        AND (
          v.especificacao LIKE ? COLLATE NOCASE
          OR v.sku LIKE ? COLLATE NOCASE
          OR v.codigo_barras LIKE ? COLLATE NOCASE
          OR p.nome LIKE ? COLLATE NOCASE
          OR m.nome LIKE ? COLLATE NOCASE
        )
      ORDER BY p.nome COLLATE NOCASE, v.especificacao COLLATE NOCASE
      LIMIT ?
    `,
    )
    .all(like, like, like, like, like, limit) as VariacaoRow[];

  // Conta quantas variações ativas existem para cada produto pai
  const idsProdutoPai = Array.from(
    new Set(linhas.map((l) => l.produto_id).filter((id): id is number => id !== null)),
  );

  const grupoPorProduto = new Map<number, VariacaoResposta[]>();
  if (idsProdutoPai.length > 0) {
    const placeholders = idsProdutoPai.map(() => '?').join(',');
    const todasVariacoes = db
      .prepare(
        `
        SELECT
          v.id              AS id,
          v.produto_id      AS produto_id,
          p.nome            AS produto_nome,
          m.nome            AS marca_nome,
          v.especificacao   AS especificacao,
          v.sku             AS sku,
          v.codigo_barras   AS codigo_barras,
          v.unidade         AS unidade,
          v.preco           AS preco,
          v.controla_estoque AS controla_estoque,
          v.estoque_atual   AS estoque_atual,
          v.estoque_minimo  AS estoque_minimo,
          v.status          AS status
        FROM variacoes v
        LEFT JOIN produtos p ON p.id = v.produto_id AND p.excluido_em IS NULL
        LEFT JOIN marcas m   ON m.id = p.marca_id   AND m.excluido_em IS NULL
        WHERE v.ativo = 1
          AND v.excluido_em IS NULL
          AND v.produto_id IN (${placeholders})
        ORDER BY v.especificacao COLLATE NOCASE
      `,
      )
      .all(...idsProdutoPai) as VariacaoRow[];

    for (const row of todasVariacoes) {
      if (row.produto_id === null) continue;
      const arr = grupoPorProduto.get(row.produto_id) ?? [];
      arr.push(toResposta(row, false, []));
      grupoPorProduto.set(row.produto_id, arr);
    }
  }

  const resposta: VariacaoResposta[] = linhas.map((row) => {
    if (row.produto_id !== null) {
      const grupo = grupoPorProduto.get(row.produto_id) ?? [];
      const temVariacoes = grupo.length > 1;
      return toResposta(row, temVariacoes, temVariacoes ? grupo : []);
    }
    return toResposta(row, false, []);
  });

  return res.json(resposta);
});

/**
 * POST /api/produtos/avulso
 * Body: { nome, preco, unidade }
 * Cria uma variação sem produto_id (avulsa, pendente de cadastro completo).
 */
router.post('/avulso', autenticar, (req: Request, res: Response) => {
  const { nome, preco, unidade } = req.body ?? {};

  if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
    return res.status(400).json({ erro: 'Nome do produto é obrigatório' });
  }
  const precoNum = Number(preco);
  if (!Number.isFinite(precoNum) || precoNum < 0) {
    return res.status(400).json({ erro: 'Preço inválido' });
  }
  const unidadeFinal =
    typeof unidade === 'string' && unidade.trim().length > 0 ? unidade.trim() : 'un';

  const info = db
    .prepare(
      `
      INSERT INTO variacoes
        (produto_id, sku, especificacao, unidade, preco,
         controla_estoque, estoque_atual, status, produto_pai_pendente, ativo)
      VALUES
        (NULL, NULL, ?, ?, ?, 0, 0, 'pendente', 1, 1)
    `,
    )
    .run(nome.trim(), unidadeFinal, precoNum);

  const id = Number(info.lastInsertRowid);

  return res.status(201).json({
    id,
    nome: nome.trim(),
    preco: precoNum,
    unidade: unidadeFinal,
    status: 'pendente',
  });
});

function toResposta(
  row: VariacaoRow,
  temVariacoes: boolean,
  grupo: VariacaoResposta[],
): VariacaoResposta {
  return {
    id: row.id,
    produto_id: row.produto_id,
    produto_nome: row.produto_nome ?? row.especificacao ?? 'Produto avulso',
    marca_nome: row.marca_nome,
    especificacao: row.especificacao,
    sku: row.sku,
    unidade: row.unidade,
    preco: row.preco,
    controla_estoque: row.controla_estoque,
    estoque_atual: row.estoque_atual,
    estoque_minimo: row.estoque_minimo,
    status: row.status,
    tem_variacoes: temVariacoes,
    variacoes_do_grupo: grupo,
  };
}

export default router;
