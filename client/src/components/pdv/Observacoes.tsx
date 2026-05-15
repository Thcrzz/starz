import { Textarea } from '@/components/ui/textarea';
import { usePDVStore } from '@/store/pdvStore';

/**
 * Card de Observações da coluna direita do PDV — visível em venda e
 * orçamento. Mantém o mesmo visual dos cards SeletorVendedor / SeletorCliente.
 */
export default function Observacoes() {
  const observacao = usePDVStore((s) => s.observacao) ?? '';
  const setObservacao = usePDVStore((s) => s.setObservacao);

  return (
    <section className="card-hover rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Observações
      </h3>
      <Textarea
        id="obs-venda"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observação (opcional)..."
        rows={3}
        className="min-h-0"
      />
    </section>
  );
}
