import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  aberto: boolean;
  vendaId: number | null;
  onFechar: () => void;
}

/**
 * Placeholder do comprovante — implementação completa virá no Grupo 5.
 */
export default function ModalComprovante({ aberto, vendaId, onFechar }: Props) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comprovante #{vendaId ?? '-'}</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center text-sm text-muted-foreground">
          Comprovante em construção.
        </div>
      </DialogContent>
    </Dialog>
  );
}
