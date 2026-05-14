import { Button } from '@/components/ui/button';
import { usePDVStore } from '@/store/pdvStore';

export default function SeletorTipoOperacao() {
  const tipo = usePDVStore((s) => s.tipo_operacao);
  const setTipo = usePDVStore((s) => s.setTipoOperacao);

  const baseInativo =
    'flex-1 bg-secondary text-muted-foreground hover:bg-secondary/80';
  const baseAtivo =
    'flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90';

  return (
    <section className="flex gap-2">
      <Button
        type="button"
        onClick={() => setTipo('venda')}
        className={tipo === 'venda' ? baseAtivo : baseInativo}
      >
        Venda
      </Button>
      <Button
        type="button"
        onClick={() => setTipo('orcamento')}
        className={tipo === 'orcamento' ? baseAtivo : baseInativo}
      >
        Orçamento
      </Button>
    </section>
  );
}
