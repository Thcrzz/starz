import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Carrega o .env a partir da raiz do projeto (../) ou da pasta server/ (cwd)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config();

// Importa o database depois do dotenv para garantir variáveis carregadas
import './db/database';
import authRouter from './routes/auth';
import produtosRouter from './routes/produtos';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Healthcheck simples
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', servico: 'STARZ' });
});

// Rotas de autenticação
app.use('/api/auth', authRouter);

// Rotas de produtos (busca para PDV, produto avulso, etc)
app.use('/api/produtos', produtosRouter);

// Em produção, serve o build do front (../client/dist)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`[STARZ] Servidor rodando em http://localhost:${PORT}`);
});

export default app;
