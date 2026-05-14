import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { up as migration001 } from './migrations/001_initial';
import { up as migration002 } from './migrations/002_movimentacoes_estoque';
import { up as migration003 } from './migrations/003_tipo_operacao';
import { up as migration004 } from './migrations/004_pagamentos';

dotenv.config();

// Resolve o caminho do banco a partir do .env, relativo à pasta server/
const dbPath = path.resolve(
  __dirname,
  '..',
  '..',
  process.env.DB_PATH || './data/starz.db',
);

// Garante que o diretório do banco exista antes de conectar
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(dbPath);

// Modo WAL melhora concorrência leitura/escrita
db.pragma('journal_mode = WAL');
// Habilita verificação de foreign keys
db.pragma('foreign_keys = ON');

/**
 * Tabela de controle das migrations executadas.
 */
function ensureMigrationsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      executada_em TEXT DEFAULT (datetime('now'))
    );
  `);
}

/**
 * Executa uma migration caso ainda não tenha sido aplicada.
 */
function executarMigration(nome: string, fn: (db: Database.Database) => void): void {
  const jaExecutada = db
    .prepare(`SELECT id FROM _migrations WHERE nome = ?`)
    .get(nome);

  if (jaExecutada) return;

  const transacao = db.transaction(() => {
    fn(db);
    db.prepare(`INSERT INTO _migrations (nome) VALUES (?)`).run(nome);
  });
  transacao();
}

/**
 * Roda todas as migrations conhecidas na ordem.
 */
export function inicializarBanco(): void {
  ensureMigrationsTable();
  executarMigration('001_initial', migration001);
  executarMigration('002_movimentacoes_estoque', migration002);
  executarMigration('003_tipo_operacao', migration003);
  executarMigration('004_pagamentos', migration004);
}

// Inicializa imediatamente ao importar este módulo
inicializarBanco();

export default db;
