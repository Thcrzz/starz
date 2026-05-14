# STARZ — Sistema Integrado de Gestão Korta Terra

Sistema integrado de gestão para a **Korta Terra**, empresa de irrigação e peças
agrícolas de Piedade-SP. Inclui PDV, controle de produtos e estoque, clientes,
vendas, emissão de NF-e/NFC-e, financeiro, marketing e relatórios.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Banco:** SQLite via better-sqlite3
- **Auth:** JWT com perfis RBAC (admin / user)

## Instalação

Pré-requisitos: Node.js 18+ e npm.

```bash
# 1. Clone o repositório
git clone <url-do-repo> starz
cd starz

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env
# edite .env e gere um JWT_SECRET seguro

# 3. Instale as dependências do backend
cd server
npm install

# 4. Instale as dependências do frontend
cd ../client
npm install
```

## Execução em desenvolvimento

Abra dois terminais.

**Terminal 1 — backend (porta 3001):**

```bash
cd server
npm run dev
```

**Terminal 2 — frontend (porta 5173):**

```bash
cd client
npm run dev
```

Acesse <http://localhost:5173>.

Login padrão: `admin@kortaterra.com.br` / `admin123`.

## Build para produção

```bash
cd client && npm run build
cd ../server && npm run build && npm start
```

O servidor servirá o build do front em produção.
