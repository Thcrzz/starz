import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ComprovanteContent from '@/components/comprovante/ComprovanteContent';
import {
  buscarDadosComprovante,
  type DadosComprovante,
} from '@/services/vendasService';
import { baixarPdfComprovante } from '@/utils/gerarPdfComprovante';

/**
 * Página dedicada do comprovante — abre numa nova aba quando o usuário
 * clica em "Finalizar Venda e Imprimir Pedido". Renderiza sem o Layout
 * principal (sem Topbar/Sidebar/BackgroundEffects) pra focar na folha.
 *
 * Header escuro com Voltar + Título + 4 ações (Imprimir, Baixar PDF,
 * WhatsApp, Email). Conteúdo centralizado, fundo branco simulando A4.
 *
 * As ações de PDF, WhatsApp e Email são plugadas nos próximos grupos.
 */
export default function ComprovantePage() {
  const navigate = useNavigate();
  const { vendaId } = useParams<{ vendaId: string }>();

  const [dados, setDados] = useState<DadosComprovante | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(vendaId);
    if (!Number.isInteger(id) || id <= 0) {
      setErro('ID inválido');
      setCarregando(false);
      return;
    }
    let vivo = true;
    setCarregando(true);
    setErro(null);
    buscarDadosComprovante(id)
      .then((d) => {
        if (vivo) setDados(d);
      })
      .catch(() => {
        if (vivo) setErro('Comprovante não encontrado');
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [vendaId]);

  function handleImprimir() {
    window.print();
  }

  async function handleBaixarPdf() {
    if (!dados) return;
    const tipo = ehOrcamento ? 'orcamento' : 'venda';
    const nome = `comprovante-${tipo}-${dados.venda.numero}.pdf`;
    try {
      await baixarPdfComprovante('comprovante-content', nome);
      toast.success(`PDF ${nome} gerado`);
    } catch {
      toast.error('Falha ao gerar o PDF');
    }
  }

  function handleWhatsApp() {
    toast.info('Envio por WhatsApp em breve');
  }

  function handleEmail() {
    toast.info('Envio por email em breve');
  }

  const ehOrcamento = dados?.venda.tipo_operacao === 'orcamento';
  const titulo = dados
    ? `${ehOrcamento ? 'Comprovante de Orçamento' : 'Comprovante de Venda'} #${dados.venda.numero}`
    : 'Comprovante';

  return (
    <div className="min-h-screen bg-background">
      <header
        className="comprovante-page-header sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900"
      >
        <div className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-white">
            {titulo}
          </h1>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleImprimir}
              disabled={!dados}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            >
              <Printer className="mr-1 h-4 w-4" /> Imprimir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBaixarPdf}
              disabled={!dados}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            >
              <Download className="mr-1 h-4 w-4" /> Baixar PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              disabled={!dados}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            >
              <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEmail}
              disabled={!dados}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            >
              <Mail className="mr-1 h-4 w-4" /> Email
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-4 py-8">
        {carregando && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando comprovante…
          </div>
        )}

        {erro && !carregando && (
          <div className="py-20 text-center text-sm text-red-400">{erro}</div>
        )}

        {dados && !carregando && (
          <div className="comprovante-page-content bg-white shadow-2xl">
            <ComprovanteContent
              dadosComprovante={dados}
              id="comprovante-content"
            />
          </div>
        )}
      </main>
    </div>
  );
}
