import { Router, Request, Response } from 'express';
import db from '../db/database';
import { autenticar } from '../middleware/auth';

const router = Router();

type Situacao = 'pago' | 'a_pagar' | 'cancelada';
type FormaPagamento =
  | 'dinheiro'
  | 'debito'
  | 'credito'
  | 'pix'
  | 'cheque'
  | 'transferencia'
  | 'fiado';

interface ItemBody {
  variacao_id?: number;
  descricao_snapshot: string;
  preco_unitario: number;
  preco_original?: number | null;
  quantidade: number;
  desconto_item: number;
  total_item: number;
  e_avulso: boolean;
}

interface VendaBody {
  cliente_id?: number;
  retirado_por?: string;
  vendedor_id?: number;
  situacao: Situacao;
  forma_pagamento: FormaPagamento;
  parcelas?: number;
  desconto?: number;
  observacao?: string;
  tipo_operacao?: 'venda' | 'orcamento';
  itens: ItemBody[];
}

interface VendaRow {
  id: number;
  numero: number;
  cliente_id: number | null;
  retirado_por: string | null;
  vendedor_id: number | null;
  situacao: Situacao;
  forma_pagamento: FormaPagamento | null;
  parcelas: number;
  subtotal: number;
  desconto: number;
  total: number;
  nfce_chave: string | null;
  nfce_status: string | null;
  nfe_id: number | null;
  observacao: string | null;
  tipo_operacao: 'venda' | 'orcamento';
  criado_em: string;
}

interface ItemRow {
  id: number;
  venda_id: number;
  variacao_id: number | null;
  descricao_snapshot: string;
  preco_unitario: number;
  preco_original: number | null;
  quantidade: number;
  desconto_item: number;
  total_item: number;
  e_avulso: number;
}

function carregarVendaCompleta(id: number): (VendaRow & { itens: ItemRow[] }) | null {
  const venda = db
    .prepare(`SELECT * FROM vendas WHERE id = ? AND excluido_em IS NULL`)
    .get(id) as VendaRow | undefined;
  if (!venda) return null;
  const itens = db
    .prepare(`SELECT * FROM itens_venda WHERE venda_id = ? ORDER BY id`)
    .all(id) as ItemRow[];
  return { ...venda, itens };
}

/**
 * POST /api/vendas
 * Cria uma nova venda completa, em transação:
 *  - reserva número sequencial
 *  - insere venda + itens_venda
 *  - decrementa estoque das variações com controla_estoque = 1
 *  - registra movimentações de estoque
 */
router.post('/', autenticar, (req: Request, res: Response) => {
  const body = req.body as VendaBody;

  if (!body || !Array.isArray(body.itens) || body.itens.length === 0) {
    return res.status(400).json({ erro: 'A venda precisa de ao menos um item' });
  }
  if (!body.forma_pagamento) {
    return res.status(400).json({ erro: 'Forma de pagamento é obrigatória' });
  }
  if (
    body.situacao !== 'pago' &&
    body.situacao !== 'a_pagar' &&
    body.situacao !== 'cancelada'
  ) {
    return res.status(400).json({ erro: 'Situação inválida' });
  }
  if (body.forma_pagamento === 'fiado' && !body.cliente_id) {
    return res
      .status(400)
      .json({ erro: 'Venda a prazo requer identificação do cliente' });
  }
  if (body.situacao === 'a_pagar' && !body.cliente_id) {
    return res
      .status(400)
      .json({ erro: 'Venda com status "a pagar" requer cliente' });
  }

  const parcelas = Math.max(1, Number(body.parcelas) || 1);
  const desconto = Math.max(0, Number(body.desconto) || 0);
  const tipoOperacao: 'venda' | 'orcamento' =
    body.tipo_operacao === 'orcamento' ? 'orcamento' : 'venda';

  const subtotal = body.itens.reduce(
    (acc, it) => acc + (Number(it.total_item) || 0),
    0,
  );
  const total = Math.max(0, subtotal - desconto);

  try {
    const resultado = db.transaction(() => {
      // 1) Reserva número sequencial
      const conf = db
        .prepare(`SELECT valor FROM configuracoes WHERE chave = ?`)
        .get('venda_numero_sequencial') as { valor: string } | undefined;
      const numero = Number(conf?.valor ?? '1');
      db.prepare(`UPDATE configuracoes SET valor = ? WHERE chave = ?`).run(
        String(numero + 1),
        'venda_numero_sequencial',
      );

      // 2) INSERT venda
      const infoVenda = db
        .prepare(
          `INSERT INTO vendas
             (numero, cliente_id, retirado_por, vendedor_id, situacao,
              forma_pagamento, parcelas, subtotal, desconto, total, observacao,
              tipo_operacao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          numero,
          body.cliente_id ?? null,
          body.retirado_por ?? null,
          body.vendedor_id ?? null,
          body.situacao,
          body.forma_pagamento,
          parcelas,
          subtotal,
          desconto,
          total,
          body.observacao ?? null,
          tipoOperacao,
        );

      const vendaId = Number(infoVenda.lastInsertRowid);

      // 3) INSERT itens, decremento de estoque e movimentações
      const insertItem = db.prepare(
        `INSERT INTO itens_venda
           (venda_id, variacao_id, descricao_snapshot, preco_unitario,
            preco_original, quantidade, desconto_item, total_item, e_avulso)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const lerVariacao = db.prepare(
        `SELECT controla_estoque, estoque_atual FROM variacoes WHERE id = ?`,
      );
      const atualizarEstoque = db.prepare(
        `UPDATE variacoes SET estoque_atual = ? WHERE id = ?`,
      );
      const insertMovimento = db.prepare(
        `INSERT INTO movimentacoes_estoque
           (variacao_id, tipo, motivo, referencia_id, quantidade,
            estoque_anterior, estoque_depois)
         VALUES (?, 'saida', 'venda', ?, ?, ?, ?)`,
      );

      for (const it of body.itens) {
        insertItem.run(
          vendaId,
          it.variacao_id ?? null,
          it.descricao_snapshot,
          Number(it.preco_unitario) || 0,
          it.preco_original ?? (Number(it.preco_unitario) || 0),
          Number(it.quantidade) || 0,
          Number(it.desconto_item) || 0,
          Number(it.total_item) || 0,
          it.e_avulso ? 1 : 0,
        );

        // Orçamento não baixa estoque — é apenas uma cotação.
        if (it.variacao_id && tipoOperacao === 'venda') {
          const v = lerVariacao.get(it.variacao_id) as
            | { controla_estoque: number; estoque_atual: number }
            | undefined;
          if (v && v.controla_estoque === 1) {
            const anterior = Number(v.estoque_atual) || 0;
            const depois = anterior - (Number(it.quantidade) || 0);
            atualizarEstoque.run(depois, it.variacao_id);
            insertMovimento.run(
              it.variacao_id,
              vendaId,
              Number(it.quantidade) || 0,
              anterior,
              depois,
            );
          }
        }
      }

      return vendaId;
    })();

    const venda = carregarVendaCompleta(resultado);
    return res.status(201).json(venda);
  } catch (err) {
    console.error('[vendas] erro ao criar venda', err);
    return res.status(500).json({ erro: 'Falha ao criar venda' });
  }
});

/**
 * GET /api/vendas/:id
 * Retorna venda completa com itens.
 */
router.get('/:id', autenticar, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'ID inválido' });
  }
  const venda = carregarVendaCompleta(id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });
  return res.json(venda);
});

interface DadosComprovante {
  venda: VendaRow & { itens: ItemRow[] };
  cliente: unknown;
  vendedor: { nome: string } | null;
  empresa: {
    nome: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
  };
}

/**
 * GET /api/vendas/:id/comprovante-dados
 * Retorna todos os dados necessários para o comprovante (venda + cliente + vendedor + empresa).
 */
router.get(
  '/:id/comprovante-dados',
  autenticar,
  (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: 'ID inválido' });
    }
    const venda = carregarVendaCompleta(id);
    if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

    let cliente: unknown = null;
    if (venda.cliente_id) {
      cliente = db
        .prepare(
          `SELECT id, nome, cpf_cnpj, telefone, email,
                  cep, logradouro, numero, complemento, bairro,
                  cidade, uf, fiado_liberado, limite_credito
           FROM clientes WHERE id = ?`,
        )
        .get(venda.cliente_id);
    }

    let vendedor: { nome: string } | null = null;
    if (venda.vendedor_id) {
      vendedor =
        (db
          .prepare(`SELECT nome FROM usuarios WHERE id = ?`)
          .get(venda.vendedor_id) as { nome: string } | undefined) ?? null;
    }

    const configs = db
      .prepare(
        `SELECT chave, valor FROM configuracoes WHERE chave IN
           ('empresa_nome','empresa_cnpj','empresa_endereco',
            'empresa_telefone','empresa_email')`,
      )
      .all() as Array<{ chave: string; valor: string }>;
    const map = new Map(configs.map((c) => [c.chave, c.valor ?? '']));

    const dados: DadosComprovante = {
      venda,
      cliente,
      vendedor,
      empresa: {
        nome: map.get('empresa_nome') ?? '',
        cnpj: map.get('empresa_cnpj') ?? '',
        endereco: map.get('empresa_endereco') ?? '',
        telefone: map.get('empresa_telefone') ?? '',
        email: map.get('empresa_email') ?? '',
      },
    };

    return res.json(dados);
  },
);

export default router;
