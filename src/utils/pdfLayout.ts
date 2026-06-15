import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PDF_COLORS = {
  primary: [59, 130, 246] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],
  grayText: [100, 116, 139] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  amber: [200, 124, 0] as [number, number, number],
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

export function drawHeader(pdf: jsPDF, title: string, dateStr: string): void {
  pdf.setFillColor(...PDF_COLORS.primary);
  pdf.rect(0, 0, 210, PDF_CONFIG.headerHeight, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text('CASAVIDAL', PDF_CONFIG.margin, 22);
  pdf.setFontSize(8);
  pdf.text('Ferretería Integral', PDF_CONFIG.margin, 28);

  pdf.setTextColor(...PDF_COLORS.dark);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 130, 22);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fecha: ${dateStr}`, 130, 28);
}

export function drawSectionLabel(pdf: jsPDF, y: number, label: string): void {
  pdf.setFillColor(...PDF_COLORS.lightGray);
  pdf.rect(PDF_CONFIG.margin, y - 5, PDF_CONFIG.contentWidth, 8, 'F');
  pdf.setTextColor(...PDF_COLORS.dark);
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
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.lightGray,
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
  const summaryX = 130;
  const summaryWidth = 65;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  if (color) {
    pdf.setTextColor(...color);
  } else {
    pdf.setTextColor(...PDF_COLORS.dark);
  }

  pdf.text(label, summaryX, y);
  pdf.text(value, summaryX + summaryWidth - 2, y, { align: 'right' });

  if (color) {
    pdf.setTextColor(...PDF_COLORS.dark);
  }
}

export function drawTotalBox(pdf: jsPDF, y: number, label: string, value: string): void {
  const summaryX = 130;
  const summaryWidth = 65;

  pdf.setFillColor(...PDF_COLORS.primary);
  pdf.rect(summaryX - 2, y - 3, summaryWidth + 4, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(label, summaryX, y + 1);
  pdf.text(value, summaryX + summaryWidth - 2, y + 1, { align: 'right' });
}

export function drawFooter(pdf: jsPDF, text: string): void {
  pdf.setTextColor(...PDF_COLORS.grayText);
  pdf.setFontSize(8);
  pdf.text(text, PDF_CONFIG.margin, pdf.internal.pageSize.getHeight() - 15, { maxWidth: PDF_CONFIG.contentWidth });
}
