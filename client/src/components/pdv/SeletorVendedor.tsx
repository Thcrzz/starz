import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listarUsuarios } from '@/services/usuariosService';
import { usePDVStore } from '@/store/pdvStore';
import type { Usuario } from '@/types';

export default function SeletorVendedor() {
  const vendedorId = usePDVStore((s) => s.vendedor_id);
  const vendedorNome = usePDVStore((s) => s.vendedor_nome);
  const setVendedor = usePDVStore((s) => s.setVendedor);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listarUsuarios()
      .then((lista) => {
        if (ativo) setUsuarios(lista);
      })
      .catch(() => {
        if (ativo) setUsuarios([]);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  function limpar() {
    usePDVStore.setState({ vendedor_id: undefined, vendedor_nome: undefined });
  }

  const vendedorAtual = usuarios.find((u) => u.id === vendedorId);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
        Vendedor
      </h3>

      {vendedorId && vendedorNome ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{vendedorNome}</div>
            <div className="mt-1">
              {vendedorAtual?.perfil === 'admin' ? (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                  Admin
                </Badge>
              ) : (
                <Badge variant="secondary">Vendedor</Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={limpar}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Limpar vendedor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Select
          value=""
          onValueChange={(v) => {
            const id = Number(v);
            const usuario = usuarios.find((u) => u.id === id);
            if (usuario) setVendedor(usuario.id, usuario.nome);
          }}
          disabled={carregando || usuarios.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                carregando
                  ? 'Carregando...'
                  : usuarios.length === 0
                    ? 'Nenhum usuário disponível'
                    : 'Selecione o vendedor...'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                <span className="flex items-center gap-2">
                  <span>{u.nome}</span>
                  {u.perfil === 'admin' ? (
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Vendedor</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </section>
  );
}
