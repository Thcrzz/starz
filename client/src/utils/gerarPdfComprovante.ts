import html2pdf from 'html2pdf.js';

/**
 * Opção `pagebreak` existe em runtime do html2pdf.js mas o type.d.ts
 * bundled com o pacote não declara — usamos esse tipo local + cast pra
 * passar a config sem cair em `as any`.
 */
type PagebreakOption = {
  pagebreak?: {
    mode?: Array<'avoid-all' | 'css' | 'legacy'>;
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
};

/**
 * Gera e baixa um PDF do conteúdo do comprovante.
 *
 * @param elementId id do elemento DOM a ser convertido (vide
 *   `id="comprovante-content"` no ComprovanteContent)
 * @param nomeArquivo nome do arquivo .pdf que será baixado
 *
 * Estratégia: clona o elemento e coloca dentro de um wrapper off-screen
 * com bg branco, color preto, largura A4 (210mm). Isso isola o conteúdo
 * do tema dark da página — sem isso o html2canvas captura cores herdadas
 * (texto branco, fundo escuro) e o PDF sai ilegível.
 *
 * Config: A4 portrait, sem margem (o wrapper já tem padding 15mm),
 * scale 2x pra render nítido, windowWidth 793 (≈210mm a 96dpi), pagebreak
 * avoid-all pra não quebrar elementos no meio.
 */
export async function baixarPdfComprovante(
  elementId: string,
  nomeArquivo: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do comprovante não encontrado');
  }

  // Clone profundo + wrapper off-screen com cores e dimensões A4 forçadas.
  const clone = element.cloneNode(true) as HTMLElement;
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '210mm';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.color = '#000000';
  wrapper.style.padding = '15mm';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 793,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        // pagebreak existe em runtime mas não no .d.ts do pacote (vide
        // comment acima)
        ...({
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        } as PagebreakOption),
      })
      .from(wrapper)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}
