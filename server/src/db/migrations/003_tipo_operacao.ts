import type Database from 'better-sqlite3';

/**
 * Migration 003 — adiciona coluna `tipo_operacao` em `vendas`.
 * Diferencia uma venda real de um orçamento.
 */
export function up(db: Database.Database): void {
  db.exec(
    `ALTER TABLE vendas ADD COLUMN tipo_operacao TEXT NOT NULL DEFAULT 'venda'`,
  );
}
