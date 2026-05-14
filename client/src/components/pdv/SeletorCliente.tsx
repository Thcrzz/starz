import { useEffect, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  buscarClientePorId,
  buscarClientes,
  type ResumoCliente,
} from '@/services/clientesService';
import { usePDVStore } from '@/store/pdvStore';
import type { Cliente } from '@/types';
import ModalCadastroRapidoCliente from './ModalCadastroRapidoCliente';

export default function SeletorCliente() {
  const clienteId = usePDVStore((s) => s.cliente_id);
  const setCliente = usePDVStore((s) => s.setCliente);
  const limparCliente = usePDVStore((s) => s.limparCliente);
  const retiradoPor = usePDVStore((s) => s.retirado_por) ?? '';
  const setRetiradoPor = usePDVStore((s) => s.setRetiradoPor);

  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResumoCliente[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [clienteCompleto, setClienteCompleto] = useState<Cliente | null>(null);
  const [modalCadastro, setModalCadastro] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Debounce 300ms na busca
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
        const data = await buscarClientes(t);
        setResultados(data);
        setAberto(true);
      } finally {
        setCarregando(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [termo]);

  // Clique fora fecha dropdown
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

  // Quando clienteId muda no store, carrega detalhe completo
  useEffect(() => {
    let ativo = true;
    if (clienteId) {
      buscarClientePorId(clienteId)
        .then((c) => {
          if (ativo) setClienteCompleto(c);
        })
        .catch(() => {
          if (ativo) setClienteCompleto(null);
        });
    } else {
      setClienteCompleto(null);
    }
    return () => {
      ativo = false;
    };
  }, [clienteId]);

  function selecionar(c: ResumoCliente) {
    setCliente(c.id, c.nome);
    setTermo('');
    setResultados([]);
    setAberto(false);
  }

  function limpar() {
    limparCliente();
    setClienteCompleto(null);
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
        Cliente
      </h3>

      {clienteId && clienteCompleto ? (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {clienteCompleto.nome}
              </div>
              {clienteCompleto.cpf_cnpj && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {clienteCompleto.cpf_cnpj}
                </div>
              )}
              {clienteCompleto.telefone && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {clienteCompleto.telefone}
                </div>
              )}
              {(clienteCompleto.cidade || clienteCompleto.uf) && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {clienteCompleto.cidade}
                  {clienteCompleto.cidade && clienteCompleto.uf ? ' / ' : ''}
                  {clienteCompleto.uf}
                </div>
              )}
              <div className="mt-2">
                {clienteCompleto.fiado_liberado ? (
                  <Badge
                    variant="outline"
                    className="border-green-600 bg-green-600/10 text-green-500"
                  >
                    Fiado liberado
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-600 bg-red-600/10 text-red-500"
                  >
                    Fiado bloqueado
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={limpar}
              className="h-7 w-7 flex-shrink-0 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Limpar cliente"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div ref={wrapperRef} className="relative">
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
            placeholder="Buscar por nome, CPF ou CNPJ..."
            className="pl-9"
          />

          {aberto && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
              {carregando && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Buscando...
                </div>
              )}
              {!carregando && resultados.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              )}
              {!carregando && termo.trim().length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    setModalCadastro(true);
                  }}
                  className="flex w-full items-center gap-2 border-t border-border bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  Criar cliente &quot;{termo.trim()}&quot;
                </button>
              )}
              {!carregando &&
                resultados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selecionar(c)}
                    className="flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {c.nome}
                      </span>
                      {c.fiado_liberado ? (
                        <Badge
                          variant="outline"
                          className="border-green-600 bg-green-600/10 text-green-500"
                        >
                          Fiado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-red-600 bg-red-600/10 text-red-500"
                        >
                          Bloq.
                        </Badge>
                      )}
                    </div>
                    {c.cpf_cnpj && (
                      <span className="text-xs text-muted-foreground">
                        {c.cpf_cnpj}
                      </span>
                    )}
                    {(c.cidade || c.uf) && (
                      <span className="text-xs text-muted-foreground">
                        {c.cidade}
                        {c.cidade && c.uf ? ' / ' : ''}
                        {c.uf}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="retirado-por" className="text-xs text-muted-foreground">
          Retirado por
        </Label>
        <Input
          id="retirado-por"
          value={retiradoPor}
          onChange={(e) => setRetiradoPor(e.target.value)}
          placeholder="Nome de quem retirou..."
        />
      </div>

      <ModalCadastroRapidoCliente
        aberto={modalCadastro}
        onFechar={() => {
          setModalCadastro(false);
          setTermo('');
        }}
        nomeInicial={termo.trim()}
      />
    </section>
  );
}
