import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

/**
 * Topbar fixa (80px) — glass effect com blur+saturate, logo Korta Terra à
 * esquerda e dados/logout do usuário à direita. A borda inferior tem um
 * highlight laranja sutil que esmaece pras pontas.
 */
export default function Topbar() {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const iniciais =
    usuario?.nome
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() ?? '?';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 h-20 border-b"
      style={{
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Highlight laranja na borda inferior, esmaecendo pras pontas */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(249,115,22,0.4) 50%, transparent 90%)',
        }}
      />

      <div className="relative flex h-full items-center justify-between px-6">
        <div className="flex items-center py-2">
          <img
            src="/Logo_Korta_Terra_Primario_Laranja_0,75.png"
            alt="Korta Terra"
            style={{ height: '48px', width: 'auto', display: 'block' }}
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarFallback className="rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {iniciais}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-none text-foreground">
                {usuario?.nome}
              </div>
              <div className="text-xs text-muted-foreground">
                {usuario?.perfil === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
