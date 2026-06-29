import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getImageFormat } from './pdfLogo';

export const PDF_COLORS = {
  primary: [50, 102, 60] as [number, number, number],
  primaryLight: [236, 243, 238] as [number, number, number],
  primaryDark: [37, 75, 45] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  grayText: [100, 116, 139] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  greenLight: [220, 252, 231] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  redLight: [254, 226, 226] as [number, number, number],
  amber: [200, 124, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export const PDF_CONFIG = {
  format: 'letter' as const,
  orientation: 'portrait' as const,
  margin: 15,
  headerHeight: 45,
  contentWidth: 180,
};

export function createPDFDocument(): jsPDF {
  return new jsPDF({ orientation: PDF_CONFIG.orientation, unit: 'mm', format: PDF_CONFIG.format });
}

export function drawHeader(pdf: jsPDF, title: string, dateStr: string, logoBase64?: string): void {
  pdf.setFillColor(...PDF_COLORS.primary);
  pdf.rect(0, 0, 210, PDF_CONFIG.headerHeight, 'F');

  const rightX = PDF_CONFIG.margin + PDF_CONFIG.contentWidth;

  if (logoBase64) {
    const logoHeight = 24;
    const logoWidth = 24;
    const logoY = (PDF_CONFIG.headerHeight - logoHeight) / 2;
    const format = getImageFormat(logoBase64);
    pdf.addImage(logoBase64, format, PDF_CONFIG.margin, logoY, logoWidth, logoHeight);

    const textX = PDF_CONFIG.margin + logoWidth + 6;
    pdf.setTextColor(...PDF_COLORS.white);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CASAVIDAL', textX, 20);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Ferretería Integral', textX, 26);
  } else {
    pdf.setTextColor(...PDF_COLORS.white);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CASAVIDAL', PDF_CONFIG.margin, 22);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Ferretería Integral', PDF_CONFIG.margin, 28);
  }

  pdf.setTextColor(...PDF_COLORS.white);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, rightX, 20, { align: 'right' });

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fecha: ${dateStr}`, rightX, 26, { align: 'right' });
}

export function drawSectionLabel(pdf: jsPDF, y: number, label: string): void {
  pdf.setFillColor(...PDF_COLORS.primaryLight);
  pdf.rect(PDF_CONFIG.margin, y - 5, PDF_CONFIG.contentWidth, 8, 'F');
  pdf.setTextColor(...PDF_COLORS.primaryDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(label, PDF_CONFIG.margin, y);
}

export function drawInfoLine(pdf: jsPDF, y: number, label: string, value: string): void {
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...PDF_COLORS.dark);
  pdf.text(`${label}: ${value}`, PDF_CONFIG.margin, y);
}

export function drawLabelValueLine(
  pdf: jsPDF,
  y: number,
  label: string,
  value: string,
  options?: {
    labelColor?: [number, number, number];
    valueColor?: [number, number, number];
    valueAlign?: 'right' | 'left' | 'center';
  }
): void {
  const leftX = PDF_CONFIG.margin;
  const rightX = PDF_CONFIG.margin + PDF_CONFIG.contentWidth;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');

  pdf.setTextColor(...(options?.labelColor ?? PDF_COLORS.dark));
  pdf.text(label, leftX, y);

  pdf.setTextColor(...(options?.valueColor ?? PDF_COLORS.dark));
  pdf.text(value, rightX, y, { align: options?.valueAlign ?? 'right' });
}

export function drawInfoLineRight(pdf: jsPDF, y: number, label: string, value: string, xOffset?: number): void {
  const x = (xOffset ?? 0) + 130;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...PDF_COLORS.dark);
  pdf.text(`${label}: ${value}`, x, y);
}

export function createItemsTable(pdf: jsPDF, startY: number, head: string[][], body: string[][]): number {
  autoTable(pdf, {
    head,
    body,
    startY,
    theme: 'grid',
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 11,
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.primaryLight,
    },
    margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
    columnStyles: {
      2: { halign: 'center' as const },
      3: { halign: 'right' as const },
      4: { halign: 'right' as const },
    },
  });
  return (pdf as any).lastAutoTable.finalY;
}

export function drawSummaryLine(
  pdf: jsPDF,
  y: number,
  label: string,
  value: string,
  color?: [number, number, number]
): void {
  const rightEdge = PDF_CONFIG.margin + PDF_CONFIG.contentWidth;
  const summaryWidth = 65;
  const summaryX = rightEdge - summaryWidth;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  if (color) {
    pdf.setTextColor(...color);
  } else {
    pdf.setTextColor(...PDF_COLORS.dark);
  }

  pdf.text(label, summaryX, y);
  pdf.text(value, rightEdge, y, { align: 'right' });

  if (color) {
    pdf.setTextColor(...PDF_COLORS.dark);
  }
}

export function drawTotalBox(pdf: jsPDF, y: number, label: string, value: string): void {
  const rightEdge = PDF_CONFIG.margin + PDF_CONFIG.contentWidth;
  const summaryWidth = 65;
  const summaryX = rightEdge - summaryWidth;

  pdf.setFillColor(...PDF_COLORS.primaryDark);
  pdf.rect(summaryX - 2, y - 3, summaryWidth + 4, 8, 'F');
  pdf.setTextColor(...PDF_COLORS.white);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(label, summaryX, y + 1);
  pdf.text(value, rightEdge, y + 1, { align: 'right' });
}

export function drawInfoCard(
  pdf: jsPDF,
  startY: number,
  title: string,
  items: { label: string; value: string; valueColor?: [number, number, number] }[],
  rightHeader?: string
): number {
  const leftX = PDF_CONFIG.margin;
  const rightX = PDF_CONFIG.margin + PDF_CONFIG.contentWidth;
  const rowH = 6;
  const padY = 3;
  const headerH = 10;
  const bodyH = items.length * rowH + padY * 2;
  const totalH = headerH + bodyH + 2;

  pdf.setDrawColor(...PDF_COLORS.primaryLight);
  pdf.setLineWidth(0.5);
  pdf.rect(leftX, startY, PDF_CONFIG.contentWidth, totalH);

  pdf.setFillColor(...PDF_COLORS.primaryLight);
  pdf.rect(leftX, startY, PDF_CONFIG.contentWidth, headerH, 'F');

  pdf.setTextColor(...PDF_COLORS.primaryDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, leftX + 3, startY + 6.5);

  if (rightHeader) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...PDF_COLORS.grayText);
    pdf.text(rightHeader, rightX - 3, startY + 6.5, { align: 'right' });
  }

  const valueX = leftX + 52;
  const maxValueWidth = rightX - valueX - 4;

  items.forEach((item, i) => {
    const iy = startY + headerH + padY + i * rowH;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...PDF_COLORS.grayText);
    pdf.text(item.label, leftX + 4, iy + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...(item.valueColor ?? PDF_COLORS.dark));
    pdf.text(item.value, valueX, iy + 4, { maxWidth: maxValueWidth });
  });

  return startY + totalH + 6;
}

export function drawKpiRow(
  pdf: jsPDF,
  y: number,
  cards: { value: string; label: string; valueColor?: [number, number, number] }[]
): number {
  const totalWidth = PDF_CONFIG.contentWidth;
  const gap = 4;
  const cardW = (totalWidth - gap * (cards.length - 1)) / cards.length;
  const cardH = 22;

  cards.forEach((card, i) => {
    const cx = PDF_CONFIG.margin + i * (cardW + gap);

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.rect(cx, y, cardW, cardH, 'FD');

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...(card.valueColor ?? PDF_COLORS.primary));
    pdf.text(card.value, cx + cardW / 2, y + 10, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...PDF_COLORS.grayText);
    pdf.text(card.label, cx + cardW / 2, y + 16, { align: 'center' });
  });

  return y + cardH + 6;
}

export function drawDividerLine(pdf: jsPDF, y: number): void {
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(PDF_CONFIG.margin, y, PDF_CONFIG.margin + PDF_CONFIG.contentWidth, y);
}

export function drawSectionNote(
  pdf: jsPDF,
  y: number,
  title: string,
  body: string,
  accentColor?: [number, number, number]
): number {
  const leftX = PDF_CONFIG.margin;
  const rightX = PDF_CONFIG.margin + PDF_CONFIG.contentWidth;

  pdf.setFillColor(...(accentColor ? (accentColor === PDF_COLORS.red ? PDF_COLORS.redLight : PDF_COLORS.greenLight) : PDF_COLORS.primaryLight));
  pdf.rect(leftX, y - 5, PDF_CONFIG.contentWidth, 11, 'F');

  pdf.setTextColor(...(accentColor ?? PDF_COLORS.primaryDark));
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, leftX + 3, y + 1);

  const lines = pdf.splitTextToSize(body, PDF_CONFIG.contentWidth - 6);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...PDF_COLORS.grayText);
  lines.forEach((line: string, i: number) => {
    pdf.text(line, leftX + 3, y + 12 + i * 4.5);
  });

  return y + 13 + lines.length * 4.5;
}

export function drawFooter(pdf: jsPDF, text: string): void {
  pdf.setTextColor(...PDF_COLORS.grayText);
  pdf.setFontSize(8);
  pdf.text(text, PDF_CONFIG.margin, pdf.internal.pageSize.getHeight() - 15, { maxWidth: PDF_CONFIG.contentWidth });
}

/**
 * Dibuja un recuadro con la firma digital de la empresa al final del PDF.
 * Centrado horizontalmente, con etiqueta "Firma Autorizada" debajo.
 * Si no hay suficiente espacio en la página actual, agrega una nueva.
 * Retorna la nueva posición Y después del bloque.
 */
export function drawSignature(pdf: jsPDF, y: number, signatureBase64: string): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const blockHeight = 38;
  if (y + blockHeight > pageHeight - 25) {
    pdf.addPage();
    y = PDF_CONFIG.margin + 10;
  }

  const centerX = PDF_CONFIG.margin + PDF_CONFIG.contentWidth / 2;
  const maxWidth = 60;
  const maxHeight = 22;

  let imgWidth = maxWidth;
  let imgHeight = maxHeight;
  try {
    const props = pdf.getImageProperties(signatureBase64);
    if (props && props.width && props.height) {
      const ratio = props.width / props.height;
      if (imgWidth / ratio <= maxHeight) {
        imgHeight = imgWidth / ratio;
      } else {
        imgHeight = maxHeight;
        imgWidth = imgHeight * ratio;
      }
    }
  } catch {
    // mantener dimensiones por defecto
  }

  const imgX = centerX - imgWidth / 2;
  const imgY = y;
  pdf.addImage(signatureBase64, 'PNG', imgX, imgY, imgWidth, imgHeight);

  const lineY = imgY + imgHeight + 3;
  const lineX1 = centerX - 35;
  const lineX2 = centerX + 35;
  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(0.3);
  pdf.line(lineX1, lineY, lineX2, lineY);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...PDF_COLORS.grayText);
  pdf.text('Firma Autorizada', centerX, lineY + 4, { align: 'center' });

  return lineY + 8;
}
