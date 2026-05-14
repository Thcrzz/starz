import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/auth/Login';
import Placeholder from '@/pages/Placeholder';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Raiz redireciona para PDV */}
              <Route path="/" element={<Navigate to="/pdv" replace />} />

              {/* Operacional — admin + user */}
              <Route path="/pdv" element={<Placeholder titulo="PDV" />} />
              <Route path="/produtos" element={<Placeholder titulo="Produtos" />} />
              <Route path="/clientes" element={<Placeholder titulo="Clientes" />} />
              <Route path="/vendas" element={<Placeholder titulo="Vendas" />} />
              <Route path="/estoque" element={<Placeholder titulo="Estoque" />} />
              <Route path="/nfe" element={<Placeholder titulo="Notas Fiscais" />} />

              {/* Financeiro — apenas admin */}
              <Route
                path="/financeiro"
                element={
                  <ProtectedRoute apenasAdmin>
                    <Placeholder titulo="Dashboard Financeiro" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notas-recebidas"
                element={
                  <ProtectedRoute apenasAdmin>
                    <Placeholder titulo="Notas Recebidas" />
                  </ProtectedRoute>
                }
              />

              {/* Gerencial — apenas admin */}
              <Route
                path="/marketing"
                element={
                  <ProtectedRoute apenasAdmin>
                    <Placeholder titulo="Marketing" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute apenasAdmin>
                    <Placeholder titulo="Relatórios" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute apenasAdmin>
                    <Placeholder titulo="Configurações" />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
