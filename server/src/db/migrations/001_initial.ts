import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

/**
 * Migration inicial — cria todas as tabelas do sistema e popula
 * dados iniciais (usuário admin e configurações da empresa).
 */
export function up(db: Database.Database): void {
  // Usuários do sistema (admin / user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK(perfil IN ('admin','user')),
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);

  // Marcas dos produtos
  db.exec(`
    CREATE TABLE IF NOT EXISTS marcas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      excluido_em TEXT
    );
  `);

  // Produtos (cabeçalho)
  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      marca_id INTEGER REFERENCES marcas(id),
      ativo INTEGER DEFAULT 1,
      excluido_em TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);

  // Variações dos produtos (SKU efetivo de venda/estoque)
  db.exec(`
    CREATE TABLE IF NOT EXISTS variacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER REFERENCES produtos(id),
      sku TEXT UNIQUE,
      especificacao TEXT,
      unidade TEXT NOT NULL DEFAULT 'un',
      preco REAL NOT NULL DEFAULT 0,
      ncm TEXT,
      cfop TEXT,
      csosn TEXT,
      origem INTEGER DEFAULT 0,
      codigo_barras TEXT,
      controla_estoque INTEGER DEFAULT 0,
      estoque_atual REAL DEFAULT 0,
      estoque_minimo REAL DEFAULT 0,
      status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo','pendente')),
      produto_pai_pendente INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      excluido_em TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);

  // Clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT UNIQUE,
      inscricao_estadual TEXT,
      cep TEXT,
      logradouro TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      uf TEXT,
      telefone TEXT,
      email TEXT,
      fiado_liberado INTEGER DEFAULT 0,
      limite_credito REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      excluido_em TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);

  // Vendas (cabeçalho)
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL,
      cliente_id INTEGER REFERENCES clientes(id),
      retirado_por TEXT,
      vendedor_id INTEGER REFERENCES usuarios(id),
      situacao TEXT DEFAULT 'pago' CHECK(situacao IN ('pago','a_pagar','cancelada')),
      forma_pagamento TEXT CHECK(forma_pagamento IN ('dinheiro','debito','credito','pix','cheque','transferencia','fiado')),
      parcelas INTEGER DEFAULT 1,
      subtotal REAL DEFAULT 0,
      desconto REAL DEFAULT 0,
      total REAL DEFAULT 0,
      nfce_chave TEXT,
      nfce_status TEXT CHECK(nfce_status IN ('pendente','autorizada','contingencia','cancelada')),
      nfe_id INTEGER,
      observacao TEXT,
      excluido_em TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    );
  `);

  // Itens da venda
  db.exec(`
    CREATE TABLE IF NOT EXISTS itens_venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL REFERENCES vendas(id),
      variacao_id INTEGER REFERENCES variacoes(id),
      descricao_snapshot TEXT NOT NULL,
      preco_unitario REAL NOT NULL,
      preco_original REAL,
      quantidade REAL DEFAULT 1,
      desconto_item REAL DEFAULT 0,
      total_item REAL NOT NULL,
      e_avulso INTEGER DEFAULT 0
    );
  `);

  // Configurações chave/valor da aplicação
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT,
      descricao TEXT
    );
  `);

  // Configurações iniciais da empresa
  const configsIniciais: Array<[string, string, string]> = [
    ['empresa_nome', 'Korta Terra', 'Razão social / nome fantasia da empresa'],
    ['empresa_cnpj', '', 'CNPJ da empresa'],
    [
      'empresa_endereco',
      'Av. Tancredo Neves, 606, Vila Xavier, Piedade-SP, 18170-112',
      'Endereço completo da empresa',
    ],
    ['empresa_telefone', '(15) 99722-7278', 'Telefone principal'],
    ['empresa_email', 'kortaterra@gmail.com', 'E-mail de contato'],
    ['venda_numero_sequencial', '1', 'Próximo número sequencial de venda'],
    ['nfce_serie', '1', 'Série atual da NFC-e'],
    ['nfe_serie', '1', 'Série atual da NF-e'],
  ];

  const insertConfig = db.prepare(
    `INSERT OR IGNORE INTO configuracoes (chave, valor, descricao) VALUES (?, ?, ?)`,
  );
  for (const [chave, valor, descricao] of configsIniciais) {
    insertConfig.run(chave, valor, descricao);
  }

  // Usuário admin padrão
  const adminExistente = db
    .prepare(`SELECT id FROM usuarios WHERE email = ?`)
    .get('admin@kortaterra.com.br');

  if (!adminExistente) {
    const senhaHash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)`,
    ).run('Administrador', 'admin@kortaterra.com.br', senhaHash, 'admin');
  }
}
