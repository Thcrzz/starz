import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Gera e baixa um PDF do conteúdo do comprovante.
 *
 * @param elementId id do elemento DOM a ser convertido (vide
 *   `id="comprovante-content"` no ComprovanteContent)
 * @param nomeArquivo nome do arquivo .pdf que será baixado
 *
 * Estratégia (substitui o html2pdf.js que quebrava em cores oklch()
 * usadas pelo Tailwind v4): html2canvas-pro renderiza o elemento como
 * canvas — diferentemente do html2canvas original, suporta as funções
 * de cor modernas (oklch, color, color-mix). O canvas é convertido em
 * JPEG e injetado no PDF via jspdf.
 *
 * Se a imagem couber em 297mm (A4), entra direto em uma página. Se
 * for maior, particionamos em múltiplas páginas usando offsets
 * negativos no Y de cada addImage.
 */
export async function baixarPdfComprovante(
  elementId: string,
  nomeArquivo: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do comprovante não encontrado');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    // Quebra em múltiplas páginas: cada addImage usa o mesmo imgData mas
    // com Y deslocado pra baixo (negativo) na próxima página, simulando
    // "rolagem" do conteúdo dentro do A4.
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }

  pdf.save(nomeArquivo);
}
