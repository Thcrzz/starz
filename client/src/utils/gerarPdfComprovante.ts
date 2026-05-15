import html2pdf from 'html2pdf.js';

/**
 * Gera e baixa um PDF do conteúdo do comprovante.
 *
 * @param elementId id do elemento DOM a ser convertido (vide
 *   `id="comprovante-content"` no ComprovanteContent)
 * @param nomeArquivo nome do arquivo .pdf que será baixado
 *
 * Configuração: A4 portrait, margem 10mm, jpeg quality 0.98, scale 2x
 * (renderização nítida), backgroundColor branco. O html2pdf encadeia
 * html2canvas + jsPDF internamente.
 */
export async function baixarPdfComprovante(
  elementId: string,
  nomeArquivo: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do comprovante não encontrado');
  }

  // Tipagem do html2pdf espera tupla `[number, number, number, number]`
  // pra margin com 4 valores — daí o `as const`.
  await html2pdf()
    .from(element)
    .set({
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    })
    .save();
}
