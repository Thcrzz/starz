import { NavLink } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Users,
  Receipt,
  Boxes,
  FileText,
  BarChart3,
  FileInput,
  Megaphone,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

type ItemMenu = {
  rotulo: string;
  rota: string;
  icone: LucideIcon;
  apenasAdmin?: boolean;
};

type Secao = {
  titulo: string;
  itens: ItemMenu[];
};

const SECOES: Secao[] = [
  {
    titulo: 'Operacional',
    itens: [
      { rotulo: 'PDV', rota: '/pdv', icone: ShoppingCart },
      { rotulo: 'Produtos', rota: '/produtos', icone: Package },
      { rotulo: 'Clientes', rota: '/clientes', icone: Users },
      { rotulo: 'Vendas', rota: '/vendas', icone: Receipt },
      { rotulo: 'Estoque', rota: '/estoque', icone: Boxes },
      { rotulo: 'Notas Fiscais', rota: '/nfe', icone: FileText },
    ],
  },
  {
    titulo: 'Financeiro',
    itens: [
      {
        rotulo: 'Dashboard Financeiro',
        rota: '/financeiro',
        icone: BarChart3,
        apenasAdmin: true,
      },
      {
        rotulo: 'Notas Recebidas',
        rota: '/notas-recebidas',
        icone: FileInput,
        apenasAdmin: true,
      },
    ],
  },
  {
    titulo: 'Gerencial',
    itens: [
      { rotulo: 'Marketing', rota: '/marketing', icone: Megaphone, apenasAdmin: true },
      { rotulo: 'Relatórios', rota: '/relatorios', icone: TrendingUp, apenasAdmin: true },
      { rotulo: 'Configurações', rota: '/configuracoes', icone: Settings, apenasAdmin: true },
    ],
  },
];

/**
 * Sidebar fixa à esquerda começando logo abaixo da Topbar (top-20).
 * Glass effect, hover translada o item levemente, item ativo com borda
 * laranja à esquerda.
 *
 * Colapso (via useUIStore.sidebarColapsada):
 * - Expandida: w-60, todos os labels visíveis, "Powered by STARZ" no rodapé.
 * - Colapsada: w-16, só ícones; títulos de seção, labels dos itens e o
 *   rodapé Powered by ficam escondidos.
 *
 * O toggle fica logo acima do rodapé Powered by e mostra "Recolher" (com
 * ChevronLeft) quando expandida e só o ChevronRight quando colapsada.
 */
export default function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario);
  const ehAdmin = usuario?.perfil === 'admin';
  const colapsada = useUIStore((s) => s.sidebarColapsada);
  const alternar = useUIStore((s) => s.alternarSidebar);

  return (
    <aside
      className={cn(
        'fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] flex-col border-r transition-[width] duration-200',
        colapsada ? 'w-16' : 'w-60',
      )}
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      <nav className="min-h-0 flex-1 overflow-y-auto py-4">
        {SECOES.map((secao) => {
          const itensVisiveis = secao.itens.filter(
            (i) => !i.apenasAdmin || ehAdmin,
          );
          if (itensVisiveis.length === 0) return null;

          return (
            <div key={secao.titulo} className="mb-4">
              {!colapsada && (
                <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {secao.titulo}
                </div>
              )}
              <ul className="space-y-0.5 px-2">
                {itensVisiveis.map((item) => {
                  const Icone = item.icone;
                  return (
                    <li key={item.rota}>
                      <NavLink
                        to={item.rota}
                        title={colapsada ? item.rotulo : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:bg-white/5',
                            colapsada && 'justify-center px-2',
                            isActive
                              ? 'border-l-2 border-primary bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground',
                          )
                        }
                      >
                        <Icone className="h-4 w-4 shrink-0" />
                        {!colapsada && <span>{item.rotulo}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={alternar}
        aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
        className={cn(
          'flex items-center gap-2 border-t py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
          colapsada ? 'justify-center px-2' : 'px-4',
        )}
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        {colapsada ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Recolher</span>
          </>
        )}
      </button>

      {!colapsada && (
        <div
          className="flex items-center justify-center gap-2 border-t px-4 py-3"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <span className="text-xs text-muted-foreground">Powered by</span>
          <img src="/STARZ LOGO Vermelha.png" alt="STARZ" className="h-4 w-auto" />
        </div>
      )}
    </aside>
  );
}
