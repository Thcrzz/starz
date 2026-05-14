import { useEffect, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buscarProdutos } from '@/services/produtosService';
import { usePDVStore } from '@/store/pdvStore';
import type { BuscaProdutoResultado } from '@/types/pdv';
import ModalVariacoes from './ModalVariacoes';
import ModalProdutoAvulso from './ModalProdutoAvulso';

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function BuscaProduto() {
  const adicionarItem = usePDVStore((s) => s.adicionarItem);

  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<BuscaProdutoResultado[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [modalVariacoes, setModalVariacoes] =
    useState<BuscaProdutoResultado | null>(null);
  const [modalAvulso, setModalAvulso] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Debounce de 300ms na busca
  useEffect(() => {
    const t = termo.trim();
    if (t.length < 2) {
      setResultados([]);
      setAberto(false);
      return;
    }

    setCarregando(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await buscarProdutos(t);
        setResultados(data);
        setAberto(true);
      } finally {
        setCarregando(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [termo]);

  // Clique fora fecha
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  function handleSelecionar(produto: BuscaProdutoResultado) {
    if (produto.tem_variacoes) {
      setModalVariacoes(produto);
      setAberto(false);
      return;
    }
    adicionarAoCarrinho(produto);
    setTermo('');
    setResultados([]);
    setAberto(false);
  }

  function adicionarAoCarrinho(v: BuscaProdutoResultado) {
    const descricao = v.produto_id
      ? `${v.produto_nome}${v.especificacao ? ' — ' + v.especificacao : ''}`
      : v.produto_nome;

    adicionarItem({
      id: crypto.randomUUID(),
      variacao_id: v.id,
      descricao,
      preco_unitario: v.preco,
      preco_original: v.preco,
      quantidade: 1,
      desconto_item: 0,
      total_item: v.preco,
      e_avulso: false,
      unidade: v.unidade,
    });
  }

  function handleSelecionarVariacao(v: BuscaProdutoResultado) {
    adicionarAoCarrinho(v);
    setModalVariacoes(null);
    setTermo('');
    setResultados([]);
  }

  return (
    <div className="flex items-center gap-2">
      <div ref={wrapperRef} className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onFocus={() => {
            if (resultados.length > 0) setAberto(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setAberto(false);
          }}
          placeholder="Buscar produto por nome, SKU ou código de barras..."
          className="pl-9"
        />

        {aberto && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
            {carregando && (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {!carregando && resultados.length === 0 && (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Nenhum produto encontrado
              </div>
            )}
            {!carregando &&
              resultados.slice(0, 8).map((r) => {
                const semEstoque =
                  r.controla_estoque === 1 && r.estoque_atual <= 0;
                const estoqueBaixo =
                  r.controla_estoque === 1 &&
                  r.estoque_atual > 0 &&
                  r.estoque_minimo !== undefined &&
                  r.estoque_atual <= r.estoque_minimo;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelecionar(r)}
                    className="flex w-full flex-col gap-1 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-accent"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex-1 truncate text-sm font-semibold">
                        {r.produto_nome}
                        {r.especificacao && (
                          <span className="ml-1 text-foreground">
                            — {r.especificacao}
                          </span>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-sm font-bold text-primary">
                        {formatBRL(r.preco)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {r.marca_nome && (
                        <span className="text-muted-foreground">
                          {r.marca_nome}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {r.unidade}
                      </span>
                      {r.controla_estoque === 1 && (
                        <Badge
                          variant="outline"
                          className={
                            semEstoque
                              ? 'border-red-600 bg-red-600/10 text-red-500'
                              : estoqueBaixo
                                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                : 'border-green-600 bg-green-600/10 text-green-500'
                          }
                        >
                          Estoque: {r.estoque_atual}
                        </Badge>
                      )}
                      {r.status === 'pendente' && (
                        <Badge
                          variant="outline"
                          className="border-amber-500 bg-amber-500/10 text-amber-400"
                        >
                          Cadastro pendente
                        </Badge>
                      )}
                      {r.tem_variacoes && (
                        <Badge variant="secondary">
                          {r.variacoes_do_grupo.length} variações
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setModalAvulso(true)}
        className="flex-shrink-0 gap-1"
      >
        <Plus className="h-4 w-4" />
        Produto Avulso
      </Button>

      {modalVariacoes && (
        <ModalVariacoes
          aberto={!!modalVariacoes}
          onFechar={() => setModalVariacoes(null)}
          produtoPaiNome={modalVariacoes.produto_nome}
          variacoes={modalVariacoes.variacoes_do_grupo}
          onSelecionar={handleSelecionarVariacao}
        />
      )}

      <ModalProdutoAvulso
        aberto={modalAvulso}
        onFechar={() => setModalAvulso(false)}
      />
    </div>
  );
}
