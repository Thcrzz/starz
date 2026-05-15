import { Outlet } from 'react-router-dom';
import BackgroundEffects from './BackgroundEffects';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Layout principal: BackgroundEffects atrás de tudo (z-0), Topbar fixa no
 * topo (z-40), Sidebar fixa à esquerda começando abaixo da topbar (z-40).
 * Main com margem-esquerda 60 (sidebar) e padding-top 80 (topbar).
 */
export default function Layout() {
  return (
    <div className="relative min-h-screen text-foreground">
      <BackgroundEffects />
      <Topbar />
      <Sidebar />

      <main className="relative z-10 ml-60 min-h-screen pt-20">
        <div className="w-full px-3 py-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
