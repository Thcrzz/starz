import type Database from 'better-sqlite3';

/**
 * Migration 004 — tabela de pagamentos da venda.
 * Suporta múltiplas formas de pagamento por venda.
 */
export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pagamentos_venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL REFERENCES vendas(id),
      forma TEXT NOT NULL,
      valor REAL NOT NULL,
      parcelas INTEGER DEFAULT 1,
      ordem INTEGER DEFAULT 0
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pagamentos_venda
      ON pagamentos_venda(venda_id);
  `);
}
