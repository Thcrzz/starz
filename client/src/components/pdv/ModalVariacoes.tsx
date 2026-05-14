import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BuscaProdutoResultado } from '@/types/pdv';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  produtoPaiNome: string;
  variacoes: BuscaProdutoResultado[];
  onSelecionar: (variacao: BuscaProdutoResultado) => void;
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ModalVariacoes({
  aberto,
  onFechar,
  produtoPaiNome,
  variacoes,
  onSelecionar,
}: Props) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{produtoPaiNome}</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {variacoes.map((v) => {
            const semEstoque =
              v.controla_estoque === 1 && v.estoque_atual <= 0;
            const estoqueBaixo =
              v.controla_estoque === 1 &&
              v.estoque_atual > 0 &&
              v.estoque_minimo !== undefined &&
              v.estoque_atual <= v.estoque_minimo;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelecionar(v)}
                className="flex flex-col items-start gap-1 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="text-sm font-semibold">
                  {v.especificacao ?? 'Variação'}
                </div>
                <div className="text-base font-bold text-primary">
                  {formatBRL(v.preco)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {v.controla_estoque === 1 && (
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
                      Estoque: {v.estoque_atual} {v.unidade}
                    </Badge>
                  )}
                  {v.status === 'pendente' && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 bg-amber-500/10 text-amber-400"
                    >
                      Cadastro pendente
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
