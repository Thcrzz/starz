import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ComprovanteContent from '@/components/comprovante/ComprovanteContent';
import { formatMoney } from '@/hooks/useMoneyInput';
import {
  buscarDadosComprovante,
  type DadosComprovante,
} from '@/services/vendasService';
import { baixarPdfComprovante } from '@/utils/gerarPdfComprovante';

function formatarDataBR(s: string): string {
  // criado_em vem como "YYYY-MM-DD HH:MM:SS" (SQLite UTC)
  const d = new Date(s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function montarMensagem(
  dados: DadosComprovante,
  ehOrcamento: boolean,
): string {
  const { venda } = dados;
  const rotuloOperacao = ehOrcamento ? 'orçamento' : 'venda';
  const rotuloNumero = ehOrcamento ? 'orçamento' : 'venda';
  return [
    `Olá! Segue o comprovante do seu ${rotuloOperacao} na Korta Terra.`,
    '',
    `Número do ${rotuloNumero}: #${venda.numero}`,
    `Total: R$ ${formatMoney(venda.total)}`,
    `Data: ${formatarDataBR(venda.criado_em)}`,
    '',
    'Atenciosamente,',
    'Korta Terra',
    'Tel: (15) 3244-2655',
  ].join('\n');
}

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

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [telefone, setTelefone] = useState('');

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailDest, setEmailDest] = useState('');

  const [loadingPdf, setLoadingPdf] = useState(false);

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
    setLoadingPdf(true);
    try {
      await baixarPdfComprovante('comprovante-content', nome);
      toast.success(`PDF ${nome} gerado`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      toast.error(`Erro ao gerar PDF: ${msg}`);
    } finally {
      setLoadingPdf(false);
    }
  }

  function handleWhatsApp() {
    if (!dados) return;
    setTelefone(dados.cliente?.telefone ?? '');
    setWhatsappOpen(true);
  }

  function enviarWhatsapp() {
    if (!dados) return;
    const digits = telefone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Número inválido — informe DDD + número (mínimo 10 dígitos)');
      return;
    }
    // Se o usuário não digitou o DDI, prefixa 55 (Brasil)
    const comDDI =
      digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;

    const msg = montarMensagem(dados, ehOrcamento);
    const url = `https://wa.me/${comDDI}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setWhatsappOpen(false);
  }

  function handleEmail() {
    if (!dados) return;
    setEmailDest(dados.cliente?.email ?? '');
    setEmailOpen(true);
  }

  function enviarEmail() {
    if (!dados) return;
    // Validação simples: precisa ter @ e um ponto depois (RFC-ish, suficiente
    // pra evitar typos antes do mailto)
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDest.trim());
    if (!ok) {
      toast.error('Email inválido');
      return;
    }
    const { venda } = dados;
    const assunto = `Comprovante de ${
      ehOrcamento ? 'Orçamento' : 'Venda'
    } #${venda.numero} — Korta Terra`;
    const corpo = [
      'Olá!',
      '',
      `Segue em anexo o comprovante do seu ${
        ehOrcamento ? 'orçamento' : 'pedido'
      } na Korta Terra.`,
      '',
      `Número do ${ehOrcamento ? 'orçamento' : 'pedido'}: #${venda.numero}`,
      `Total: R$ ${formatMoney(venda.total)}`,
      `Data: ${formatarDataBR(venda.criado_em)}`,
      '',
      'Em caso de dúvidas, entre em contato:',
      'Tel: (15) 3244-2655',
      'Email: kortaterra@gmail.com',
      '',
      'Atenciosamente,',
      'Korta Terra',
    ].join('\n');
    const url = `mailto:${encodeURIComponent(
      emailDest.trim(),
    )}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
    setEmailOpen(false);
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
        {/* flex + flex-1 no h1 evita sobreposição: Voltar (esquerda) toma o
            espaço do seu conteúdo, o título cresce pra preencher o meio
            (text-center centraliza dentro do espaço alocado) e os 4 botões
            (direita) também tomam o espaço do conteúdo. */}
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>

          <h1 className="flex-1 truncate text-center text-base font-semibold text-white">
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
              disabled={!dados || loadingPdf}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            >
              {loadingPdf ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}{' '}
              Baixar PDF
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
          // Folha A4: largura fixa 210mm e altura MÍNIMA 297mm (cresce se
          // o conteúdo passar). Sombra leve simula o papel sobre o fundo
          // escuro da página.
          <div
            className="comprovante-page-content"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '15mm',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
              margin: '20px auto',
            }}
          >
            <ComprovanteContent
              dadosComprovante={dados}
              id="comprovante-content"
            />
          </div>
        )}
      </main>

      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar por WhatsApp</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Após abrir o WhatsApp, clique em &quot;Baixar PDF&quot; e
                anexe manualmente o arquivo na conversa.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="whatsapp-tel" className="text-xs">
                Número de telefone
              </Label>
              <Input
                id="whatsapp-tel"
                type="tel"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(15) 99999-9999"
              />
              <span className="text-xs text-muted-foreground">
                Aceita formatos como (15) 99999-9999, 15999999999 ou
                +55 15 99999-9999. Se não digitar o DDI, +55 é adicionado.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setWhatsappOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={enviarWhatsapp}>Abrir WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar por email</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Após abrir o email, clique em &quot;Baixar PDF&quot; e
                anexe manualmente o arquivo na mensagem.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email-dest" className="text-xs">
                Email do destinatário
              </Label>
              <Input
                id="email-dest"
                type="email"
                inputMode="email"
                value={emailDest}
                onChange={(e) => setEmailDest(e.target.value)}
                placeholder="cliente@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={enviarEmail}>Abrir Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
