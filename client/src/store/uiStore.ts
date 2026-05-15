import { create } from 'zustand';

const STORAGE_KEY = 'starz.ui.sidebarColapsada';

function lerLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function gravarLocal(v: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(v));
  } catch {
    // localStorage indisponível (ex.: navegador em modo privado) — ignora
  }
}

interface UIStore {
  /** Sidebar recolhida (w-16, só ícones) vs expandida (w-60). */
  sidebarColapsada: boolean;
  alternarSidebar: () => void;
  setSidebarColapsada: (v: boolean) => void;
}

/**
 * Estado de UI compartilhado entre Layout e Sidebar (e qualquer outro
 * componente que precise reagir ao colapso). Persiste no localStorage
 * entre sessões.
 */
export const useUIStore = create<UIStore>((set) => ({
  sidebarColapsada: lerLocal(),
  alternarSidebar: () =>
    set((state) => {
      const novo = !state.sidebarColapsada;
      gravarLocal(novo);
      return { sidebarColapsada: novo };
    }),
  setSidebarColapsada: (v) => {
    gravarLocal(v);
    set({ sidebarColapsada: v });
  },
}));
