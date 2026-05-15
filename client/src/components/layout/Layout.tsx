import { Outlet, useLocation } from 'react-router-dom';
import BackgroundEffects from './BackgroundEffects';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Layout principal. BackgroundEffects atrás de tudo (z-0), Topbar fixa no
 * topo (z-40), Sidebar fixa à esquerda começando abaixo da topbar (z-40).
 *
 * Comportamento de altura por rota:
 * - /pdv → main trava em h-screen + overflow-hidden e vira flex-col; a div
 *          interna usa flex-1 + overflow-hidden pra deixar PDVPage usar
 *          h-full sem que o sistema role.
 * - outras rotas → min-h-screen normal (cresce com o conteúdo).
 */
export default function Layout() {
  const isPdv = useLocation().pathname === '/pdv';

  return (
    <div className="relative min-h-screen text-foreground">
      <BackgroundEffects />
      <Topbar />
      <Sidebar />

      <main
        className={`relative z-10 ml-60 pt-20 ${
          isPdv
            ? 'flex h-screen flex-col overflow-hidden'
            : 'min-h-screen'
        }`}
      >
        <div
          className={`w-full px-3 py-3 ${
            isPdv ? 'flex-1 min-h-0 overflow-hidden' : ''
          }`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
