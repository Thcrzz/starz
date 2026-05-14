import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  apenasAdmin?: boolean;
}

/**
 * Protege rotas autenticadas.
 * - Sem token: redireciona para /login.
 * - Usuário comum tentando rota apenasAdmin: redireciona para /pdv.
 */
export default function ProtectedRoute({ children, apenasAdmin = false }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token || !usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (apenasAdmin && usuario.perfil !== 'admin') {
    return <Navigate to="/pdv" replace />;
  }

  return <>{children}</>;
}
