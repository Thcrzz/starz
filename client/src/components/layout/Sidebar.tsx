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

interface SidebarProps {
  colapsada: boolean;
  onToggle: () => void;
}

export default function Sidebar({ colapsada, onToggle }: SidebarProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const ehAdmin = usuario?.perfil === 'admin';

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-card transition-[width] duration-200',
        colapsada ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-border',
          colapsada ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {!colapsada && (
          <span className="text-2xl font-bold tracking-tight text-primary">STARZ</span>
        )}
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
        >
          {colapsada ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {SECOES.map((secao) => {
          const itensVisiveis = secao.itens.filter((i) => !i.apenasAdmin || ehAdmin);
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
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            colapsada && 'justify-center px-2',
                            isActive
                              ? 'bg-primary/15 text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
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
    </aside>
  );
}
