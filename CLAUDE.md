# STARZ — Sistema Integrado de Gestão Korta Terra

## O que é este projeto
STARZ é uma plataforma de gestão integrada para a **Korta Terra**, empresa de irrigação e peças agrícolas de Piedade, SP (18+ anos de mercado, 1.800+ produtos). O sistema substitui o ERP online atual, rodando localmente na rede da loja sem dependência de internet para operação básica.

---

## Stack técnico
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** SQLite via better-sqlite3 (arquivo: server/data/starz.db)
- **Autenticação:** JWT 8h com perfis RBAC — `admin` e `user`
- **Estrutura:** Monorepo — /client (frontend) e /server (backend)
- **Estado global:** Zustand (authStore, pdvStore)
- **HTTP:** axios com interceptors JWT

## Portas
- Backend: **3001**
- Frontend dev: **5173** (proxy /api → 3001)
- Produção: Express serve client/dist/ na porta 3001

## Como rodar em desenvolvimento
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev

# Acesso
http://localhost:5173
```

## Login padrão (desenvolvimento)
- Email: `admin@kortaterra.com.br`
- Senha: `admin123`

---

## Convenções OBRIGATÓRIAS
- **Código:** inglês (variáveis, funções, arquivos, nomes de rotas)
- **Interface:** 100% português (labels, placeholders, mensagens, toasts, títulos)
- **Comentários:** português
- **Tabelas do banco:** snake_case plural em português (ex: `itens_venda`, `movimentacoes_estoque`)
- **Soft-delete:** campo `excluido_em TEXT` — NULL = ativo, preenchido = deletado
- **Datas:** TEXT formato ISO 8601
- **Valores monetários:** REAL no SQLite
- **Migrations:** arquivos em `server/src/db/migrations/` numerados sequencialmente (001, 002, 003...)
- **Commits:** sempre em português, prefixo feat/fix/refactor

## Regras importantes
- **NUNCA commitar:** .env, server/data/starz.db, server/data/files/, server/data/xmls/
- **Sempre fazer commit por grupo** de tarefas — não commitar tudo de uma vez no final
- **Não implementar** features além do que foi pedido na tarefa atual
- **Resolver erros** antes de avançar para o próximo grupo
- **Soft-delete** em todas as tabelas — nunca DELETE direto, sempre UPDATE excluido_em

---

## Arquitetura — Dois Mundos Isolados

O sistema tem dois mundos que NÃO se comunicam automaticamente:

### Mundo Operacional (Admin + User)
PDV, produtos, clientes, vendas, estoque, NFC-e, NF-e

### Mundo Financeiro (Admin apenas)
Gestão financeira (antigo STRUZ Company): transações, boletos, cheques, notas fiscais, investimentos, contatos, contas, bancos, categorias, InboxIA, importação de extratos, lixeira

---

## Design System
- **Tema:** dark
- **Cor primária:** laranja `#F97316` (CSS var: `--primary: 24 91% 50%`)
- **Fonte:** Inter (Google Fonts)
- **Background:** `hsl(0 0% 7%)`
- **Card:** `hsl(0 0% 10%)`
- **Border:** `hsl(0 0% 18%)`
- **Componentes:** shadcn/ui com tema customizado

### Assets em client/public/
- Logo Korta Terra: `Logo_Korta_Terra_Primario_Laranja_0,75.png`
- Logo STARZ: `STARZ LOGO Vermelha.png`
- Favicon: `STARZ-FAVICON.png`

---

## Banco de Dados — Tabelas existentes

### Mundo Operacional
| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários do sistema (perfil: admin/user) |
| `marcas` | Marcas dos produtos |
| `produtos` | Produto pai (nome + marca) |
| `variacoes` | Produto filho com SKU, preço, estoque, campos fiscais. Campo `status`: 'ativo'/'pendente'. Campo `produto_pai_pendente`: 1 = criado via cadastro rápido |
| `clientes` | Clientes com CPF/CNPJ, endereço, fiado_liberado |
| `vendas` | Vendas com situacao, forma_pagamento, tipo_operacao ('venda'/'orcamento') |
| `itens_venda` | Itens da venda com snapshot de preço. `e_avulso=1` para produtos sem cadastro |
| `nfe_emitidas` | NF-e e NFC-e emitidas |
| `nfe_recebidas` | NF-e recebidas de fornecedores (MD-e) |
| `movimentacoes_estoque` | Histórico de entradas/saídas de estoque |
| `configuracoes` | Chave/valor: empresa_nome, empresa_cnpj, empresa_endereco, empresa_telefone, empresa_email, venda_numero_sequencial, nfce_serie, nfe_serie |

### Mundo Financeiro (prefixo fin_)
| Tabela | Descrição |
|--------|-----------|
| `fin_contas` | Contas bancárias e caixa físico |
| `fin_bancos` | Cadastro de bancos |
| `fin_categorias` | Categorias de receita/despesa (hierárquicas) |
| `fin_contatos` | Contatos financeiros (fornecedores, clientes) |
| `fin_transacoes` | Receitas, despesas, transferências |
| `fin_boletos` | Boletos (9 tipos), com arquivo PDF/PNG — expira 2 anos |
| `fin_cheques` | Cheques recebidos com gestão de depósito/devolução |
| `fin_notas_fiscais` | NF manual financeiro com PDF — permanente |
| `fin_investimentos` | CDB, Tesouro, LCI, LCA, poupança |
| `fin_movimentacoes_investimento` | Aplicações e resgates |
| `fin_emails_processados` | Emails processados pelo InboxIA |
| `fin_importacoes_extrato` | Importações OFX/PDF/CSV |
| `fin_agente_config` | Configuração do InboxIA (palavras-chave, dias) |
| `arquivos` | Controle centralizado de arquivos com data_expiracao |

---

## Armazenamento de Arquivos
```
server/data/
├── starz.db                    # Banco SQLite
├── xmls/                       # XMLs NF-e emitidas (permanente)
│   └── recebidas/              # XMLs NF-e recebidas (permanente)
└── files/
    ├── boletos/                # PDFs boletos — expira 2 anos
    ├── comprovantes/           # Comprovantes pagamento — expira 2 anos
    ├── notas-fiscais/          # DANFEs e NFs — permanente
    └── extratos/               # Extratos importados — permanente
```
Job noturno `limpar-arquivos.ts` deleta arquivos com `data_expiracao <= hoje`.

---

## Rotas da API existentes

### Auth
- `POST /api/auth/login` — login, retorna JWT
- `GET /api/auth/me` — dados do usuário logado

### Produtos
- `GET /api/produtos/busca?q=&limit=` — busca variações para o PDV
- `POST /api/produtos/avulso` — cria produto rápido (status='pendente')

### Clientes
- `GET /api/clientes/busca?q=` — busca por nome/CPF/CNPJ
- `GET /api/clientes/:id` — detalhe completo
- `POST /api/clientes` — cria cliente

### Usuários
- `GET /api/usuarios` — lista usuários ativos

### Vendas
- `POST /api/vendas` — cria venda com itens (transaction: decrementa estoque se venda, não decrementa se orçamento)
- `GET /api/vendas/:id` — detalhe com itens
- `GET /api/vendas/:id/comprovante-dados` — dados completos para comprovante

---

## PDV — Estado atual (pdvStore)
Campos: `itens`, `cliente_id`, `cliente_nome`, `retirado_por`, `vendedor_id`, `vendedor_nome`, `forma_pagamento`, `parcelas`, `desconto_geral`, `tipo_desconto` ('valor'/'porcentagem'), `observacao`, `tipo_operacao` ('venda'/'orcamento')

Getters: `subtotal`, `totalComDesconto` (considera tipo_desconto)

O carrinho NÃO persiste no localStorage — resetado ao recarregar.

---

## Módulos implementados (Fases concluídas)

### ✅ Fase 1 — Base
Estrutura monorepo, SQLite + migrations, JWT + RBAC, layout com sidebar, login, rotas com placeholder

### ✅ Fase 2 — PDV completo
- **2A:** Layout duas colunas, busca de produtos com dropdown, modal de variações, produto avulso, carrinho com edição inline
- **2B:** Seletor de vendedor, busca de cliente com dropdown, campo "Retirado por", formas de pagamento, parcelas 1x-12x, validações nos botões
- **2C:** Finalização real de venda (transaction), modal de conclusão, comprovante com impressão, cadastro rápido de cliente/produto no dropdown
- **2D:** Toggle Venda/Orçamento, correções de alinhamento, impressão corrigida, simplificação cadastro rápido
- **2E:** Logos (Korta Terra na sidebar, STARZ no rodapé), favicon, melhorias visuais do carrinho (zebra, lixeira, sem setas, colunas separadas), desconto com toggle R$/%
- **2F:** Hook `useMoneyInput` + componente `MoneyInput` com máscara BR (digitar números, formata automaticamente ex: 1234567 → 12.345,67). Aplicado em todos inputs monetários do carrinho e produto avulso. Parte Financeira oculta em modo Orçamento. Layout compacto da Parte Financeira.
- **2G:** Logo Korta Terra no comprovante (substituindo texto), rodapé "Powered by STARZ" no comprovante, assinatura com espaço dobrado.

---

## Componentes e hooks reutilizáveis
- `useMoneyInput` — hook em `client/src/hooks/useMoneyInput.ts`. Mantém estado em centavos e formata da direita pra esquerda. Retorna `{ value, display, handleChange, setValue }`.
- `MoneyInput` — componente em `client/src/components/ui/MoneyInput.tsx`. Input controlado com máscara monetária BR e prefixo "R$" opcional. Props: `value`, `onChange`, `prefix?`, `className?`, `placeholder?`, `disabled?`.
- `formatMoney(value)` — função utilitária em `client/src/hooks/useMoneyInput.ts` para formatar número como moeda BR (sem prefixo). Ex: `1234.5` → `"1.234,50"`.
- `parseMoney(display)` — função utilitária em `client/src/hooks/useMoneyInput.ts` para parsear string monetária BR para número. Ex: `"1.234,56"` → `1234.56`.

---

## Próximas fases planejadas
- **Fase 3** — NFC-e real via Focus NFe (contingência offline, DANFE)
- **Fase 4** — Hardware (impressora térmica ESC/POS, leitor código de barras)
- **Fase 5** — Implantação na loja (PC servidor, deploy, multi-PC)
- **Fase 6** — Notas Recebidas (MD-e, download automático XMLs)
- **Fase 7** — Estoque integrado
- **Fase 8** — Módulo Financeiro (migração STRUZ Company)
- **Fase 9** — Automações IA (Gmail, boletos, NF-e)
- **Fase 10** — Marketing (Instagram Insights, Meta Ads)
- **Fase 11** — Dashboard Unificado

---

## Integrações externas planejadas
- **Focus NFe** — NFC-e, NF-e, DF-e, MD-e (Fase 3+)
- **Brasil API** — consulta CNPJ gratuita (já integrada no cadastro de clientes)
- **Anthropic API** — claude-sonnet-4-20250514 (Fase 9+)
- **Gmail API** — OAuth2, leitura automática (Fase 9)
- **Instagram Graph API** — métricas @kortaterra (Fase 10)
- **Meta Marketing API** — campanhas (Fase 10)

---

## Variáveis de ambiente (.env na raiz)
```
PORT=3001
JWT_SECRET=...
NODE_ENV=development
DB_PATH=./data/starz.db
FILES_PATH=./data/files
FOCUS_NFE_TOKEN=
FOCUS_NFE_AMBIENTE=homologacao
ANTHROPIC_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
META_APP_ID=
META_APP_SECRET=
```
