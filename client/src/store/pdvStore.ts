import { create } from 'zustand';
import type { EstadoPDV, ItemCarrinho, Pagamento } from '@/types/pdv';

interface PDVStore extends EstadoPDV {
  adicionarItem: (item: ItemCarrinho) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  atualizarPreco: (id: string, preco: number) => void;
  atualizarDesconto: (id: string, desconto: number) => void;
  limparCarrinho: () => void;
  setCliente: (id: number, nome: string) => void;
  limparCliente: () => void;
  setVendedor: (id: number, nome: string) => void;
  setFormaPagamento: (forma: string) => void;
  setParcelas: (n: number) => void;
  setDescontoGeral: (v: number) => void;
  setRetiradoPor: (nome: string) => void;
  setObservacao: (obs: string) => void;
  setTipoOperacao: (tipo: 'venda' | 'orcamento') => void;
  setTipoDesconto: (tipo: 'valor' | 'porcentagem') => void;
  /** Múltiplas formas de pagamento */
  adicionarPagamento: (forma: string, valor: number, parcelas?: number) => void;
  removerPagamento: (id: string) => void;
  atualizarPagamento: (id: string, dados: Partial<Pagamento>) => void;
  limparPagamentos: () => void;
  totalPago: () => number;
  diferencaPagamento: () => number;
  subtotal: () => number;
  totalComDesconto: () => number;
}

const estadoInicial: EstadoPDV = {
  itens: [],
  cliente_id: undefined,
  cliente_nome: undefined,
  retirado_por: undefined,
  vendedor_id: undefined,
  vendedor_nome: undefined,
  forma_pagamento: undefined,
  parcelas: 1,
  desconto_geral: 0,
  tipo_desconto: 'valor',
  observacao: undefined,
  tipo_operacao: 'venda',
  pagamentos: [],
};

function sincronizarLegado(pagamentos: Pagamento[]): Pick<EstadoPDV, 'forma_pagamento' | 'parcelas'> {
  const primeiro = pagamentos[0];
  return {
    forma_pagamento: primeiro?.forma,
    parcelas: primeiro?.parcelas ?? 1,
  };
}

function recalculaTotal(item: ItemCarrinho): ItemCarrinho {
  const bruto = item.preco_unitario * item.quantidade;
  const desconto = Math.max(0, item.desconto_item || 0);
  const total = Math.max(0, bruto - desconto);
  return { ...item, total_item: total };
}

export const usePDVStore = create<PDVStore>((set, get) => ({
  ...estadoInicial,

  adicionarItem: (item) =>
    set((state) => {
      if (item.variacao_id !== undefined) {
        const existente = state.itens.find(
          (i) => i.variacao_id === item.variacao_id,
        );
        if (existente) {
          return {
            itens: state.itens.map((i) =>
              i.id === existente.id
                ? recalculaTotal({
                    ...i,
                    quantidade: i.quantidade + item.quantidade,
                  })
                : i,
            ),
          };
        }
      }
      return { itens: [...state.itens, recalculaTotal(item)] };
    }),

  removerItem: (id) =>
    set((state) => ({ itens: state.itens.filter((i) => i.id !== id) })),

  atualizarQuantidade: (id, quantidade) =>
    set((state) => ({
      itens: state.itens.map((i) =>
        i.id === id
          ? recalculaTotal({ ...i, quantidade: Math.max(0, quantidade) })
          : i,
      ),
    })),

  atualizarPreco: (id, preco) =>
    set((state) => ({
      itens: state.itens.map((i) =>
        i.id === id
          ? recalculaTotal({ ...i, preco_unitario: Math.max(0, preco) })
          : i,
      ),
    })),

  atualizarDesconto: (id, desconto) =>
    set((state) => ({
      itens: state.itens.map((i) =>
        i.id === id
          ? recalculaTotal({ ...i, desconto_item: Math.max(0, desconto) })
          : i,
      ),
    })),

  limparCarrinho: () => set({ ...estadoInicial }),

  setCliente: (id, nome) => set({ cliente_id: id, cliente_nome: nome }),

  limparCliente: () =>
    set({ cliente_id: undefined, cliente_nome: undefined }),

  setVendedor: (id, nome) => set({ vendedor_id: id, vendedor_nome: nome }),

  setFormaPagamento: (forma) => set({ forma_pagamento: forma }),

  setParcelas: (n) => set({ parcelas: Math.max(1, n) }),

  setDescontoGeral: (v) => set({ desconto_geral: Math.max(0, v) }),

  setRetiradoPor: (nome) => set({ retirado_por: nome }),

  setObservacao: (obs) => set({ observacao: obs }),

  setTipoOperacao: (tipo) => set({ tipo_operacao: tipo }),

  setTipoDesconto: (tipo) =>
    // troca o tipo e zera o valor — evita interpretação ambígua do número anterior
    set({ tipo_desconto: tipo, desconto_geral: 0 }),

  adicionarPagamento: (forma, valor, parcelas) =>
    set((state) => {
      const novo: Pagamento = {
        id: crypto.randomUUID(),
        forma,
        valor: Math.max(0, valor),
        parcelas: forma === 'credito' ? Math.max(1, parcelas ?? 1) : undefined,
      };
      const pagamentos = [...state.pagamentos, novo];
      return { pagamentos, ...sincronizarLegado(pagamentos) };
    }),

  removerPagamento: (id) =>
    set((state) => {
      const pagamentos = state.pagamentos.filter((p) => p.id !== id);
      return { pagamentos, ...sincronizarLegado(pagamentos) };
    }),

  atualizarPagamento: (id, dados) =>
    set((state) => {
      const pagamentos = state.pagamentos.map((p) =>
        p.id === id
          ? {
              ...p,
              ...dados,
              valor:
                dados.valor !== undefined
                  ? Math.max(0, dados.valor)
                  : p.valor,
            }
          : p,
      );
      return { pagamentos, ...sincronizarLegado(pagamentos) };
    }),

  limparPagamentos: () =>
    set({ pagamentos: [], forma_pagamento: undefined, parcelas: 1 }),

  totalPago: () =>
    get().pagamentos.reduce((acc, p) => acc + (p.valor || 0), 0),

  diferencaPagamento: () => {
    const state = get();
    const sub = state.itens.reduce((acc, i) => acc + i.total_item, 0);
    const tot =
      state.tipo_desconto === 'porcentagem'
        ? Math.max(
            0,
            sub *
              (1 - Math.min(100, Math.max(0, state.desconto_geral)) / 100),
          )
        : Math.max(0, sub - state.desconto_geral);
    const pago = state.pagamentos.reduce((acc, p) => acc + (p.valor || 0), 0);
    return tot - pago;
  },

  subtotal: () => get().itens.reduce((acc, i) => acc + i.total_item, 0),

  totalComDesconto: () => {
    const state = get();
    const sub = state.itens.reduce((acc, i) => acc + i.total_item, 0);
    if (state.tipo_desconto === 'porcentagem') {
      const pct = Math.min(100, Math.max(0, state.desconto_geral));
      return Math.max(0, sub * (1 - pct / 100));
    }
    return Math.max(0, sub - state.desconto_geral);
  },
}));
