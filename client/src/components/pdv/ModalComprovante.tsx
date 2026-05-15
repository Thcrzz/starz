import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ComprovanteContent from '@/components/comprovante/ComprovanteContent';
import {
  buscarDadosComprovante,
  type DadosComprovante,
} from '@/services/vendasService';

interface Props {
  aberto: boolean;
  vendaId: number | null;
  onFechar: () => void;
  tipoOperacao?: 'venda' | 'orcamento';
  /**
   * Se true, NÃO abre o Dialog mas renderiza o body-portal escondido em tela
   * e dispara window.print() automaticamente assim que os dados carregam.
   * Usado pelo fluxo legado de "Finalizar Venda e Imprimir".
   */
  imprimirAutomaticamente?: boolean;
}

/**
 * Modal de pré-visualização do comprovante. Carrega os dados, mostra o
 * ComprovanteContent dentro de um Dialog e, em paralelo, renderiza uma
 * cópia em portal direto no <body> com a classe `comprovante-print-wrapper`
 * (escondida em tela; revelada apenas em @media print pela regra que vive
 * em `index.css`).
 *
 * Quando o modal dispara impressão, marca `body.printing-modal` pra ativar
 * a regra `body.printing-modal > *:not(.comprovante-print-wrapper) {
 * display: none }`. O afterprint (ou cleanup) remove a classe. Isso evita
 * que essa mesma regra atrapalhe a impressão da ComprovantePage standalone.
 */
export default function ModalComprovante({
  aberto,
  vendaId,
  onFechar,
  tipoOperacao = 'venda',
  imprimirAutomaticamente = false,
}: Props) {
  const [dados, setDados] = useState<DadosComprovante | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ativo = aberto || imprimirAutomaticamente;

  useEffect(() => {
    if (!ativo || !vendaId) {
      setDados(null);
      setErro(null);
      return;
    }
    let vivo = true;
    setCarregando(true);
    setErro(null);
    buscarDadosComprovante(vendaId)
      .then((d) => {
        if (vivo) setDados(d);
      })
      .catch(() => {
        if (vivo) setErro('Falha ao carregar comprovante');
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [ativo, vendaId]);

  // Limpa a classe printing-modal quando a impressão termina (ou cancelada).
  useEffect(() => {
    function handler() {
      document.body.classList.remove('printing-modal');
    }
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

  // Auto-print no fluxo legado: dispara window.print() assim que os dados
  // chegam (com pequeno delay pro DOM montar).
  useEffect(() => {
    if (!imprimirAutomaticamente || !dados) return;
    const t = window.setTimeout(() => {
      document.body.classList.add('printing-modal');
      window.print();
      onFechar();
    }, 300);
    return () => window.clearTimeout(t);
  }, [imprimirAutomaticamente, dados, onFechar]);

  function handleImprimir() {
    document.body.classList.add('printing-modal');
    window.print();
  }

  const ehOrcamento =
    dados?.venda.tipo_operacao === 'orcamento' ||
    (dados?.venda.tipo_operacao === undefined && tipoOperacao === 'orcamento');
  const tituloModal = ehOrcamento
    ? 'Comprovante de Orçamento'
    : 'Comprovante de Venda';

  return (
    <>
      <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tituloModal}</DialogTitle>
          </DialogHeader>

          {carregando && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          )}

          {erro && (
            <div className="py-8 text-center text-sm text-red-500">{erro}</div>
          )}

          {dados && <ComprovanteContent dadosComprovante={dados} />}

          <DialogFooter className="no-print flex-col items-stretch gap-2 sm:flex-col sm:items-stretch sm:space-x-0">
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onFechar}>
                Fechar
              </Button>
              <Button onClick={handleImprimir} disabled={!dados}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              Dica: ative &quot;Gráficos de plano de fundo&quot; no diálogo de
              impressão para manter as cores
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*
       * Cópia do comprovante portalada em <body> com a classe
       * `comprovante-print-wrapper`. Escondida em tela via display:none
       * inline; o CSS de impressão (body.printing-modal > *:not(...)) esconde
       * tudo OUTRO menos esse wrapper.
       */}
      {ativo &&
        dados &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="comprovante-print-wrapper"
            style={{ display: 'none' }}
          >
            <ComprovanteContent dadosComprovante={dados} />
          </div>,
          document.body,
        )}
    </>
  );
}
