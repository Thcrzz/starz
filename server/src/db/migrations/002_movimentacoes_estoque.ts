import type Database from 'better-sqlite3';

/**
 * Migration 002 — tabela de movimentações de estoque.
 * Cada venda, compra ou ajuste manual gera uma ou mais linhas aqui.
 */
export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variacao_id INTEGER NOT NULL REFERENCES variacoes(id),
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada','saida','ajuste')),
      motivo TEXT NOT NULL,
      referencia_id INTEGER,
      quantidade REAL NOT NULL,
      estoque_anterior REAL NOT NULL,
      estoque_depois REAL NOT NULL,
      observacao TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movimentacoes_variacao
      ON movimentacoes_estoque(variacao_id);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movimentacoes_referencia
      ON movimentacoes_estoque(motivo, referencia_id);
  `);
}
