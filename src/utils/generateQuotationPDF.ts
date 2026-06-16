import type { QuotationItem } from '../api/quotations.api';
import {
  createPDFDocument,
  drawHeader,
  drawInfoCard,
  createItemsTable,
  drawSummaryLine,
  drawTotalBox,
  drawDividerLine,
  drawSectionNote,
  drawFooter,
} from './pdfLayout';

interface QuotationPDFData {
  number?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  items: QuotationItem[];
  subtotal: number;
  freight: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdAt?: string;
  logoBase64?: string;
}

export function generateQuotationPDF(data: QuotationPDFData): void {
  const pdf = createPDFDocument();

  const cotNumber = data.number || `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`;
  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });

  drawHeader(pdf, `COTIZACIÓN ${cotNumber}`, dateStr, data.logoBase64);

  let yPos = 55;

  const clientItems: { label: string; value: string }[] = [
    { label: 'Nombre', value: data.clientName || 'No especificado' },
    { label: 'Teléfono', value: data.clientPhone || 'No especificado' },
  ];
  if (data.clientEmail) {
    clientItems.push({ label: 'Email', value: data.clientEmail });
  }
  yPos = drawInfoCard(pdf, yPos, 'DATOS DEL CLIENTE', clientItems);
  drawDividerLine(pdf, yPos - 3);

  const tableBody = data.items.map((item) => [
    item.productName,
    item.productCode,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    `$${item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
  ]);
  yPos = createItemsTable(pdf, yPos, [['Producto', 'Código', 'Cant.', 'P. Unit.', 'Subtotal']], tableBody) + 10;

  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  yPos = drawSectionNote(pdf, yPos, 'RESUMEN',
    `Esta cotizacion incluye ${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} con un subtotal de $${data.subtotal.toFixed(2)}. Los precios estan expresados en dolares americanos e incluyen el IVA correspondiente. Valida por 7 dias a partir de la fecha de emision.`
  );

  drawSummaryLine(pdf, yPos, 'Subtotal:', `$${data.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
  yPos += 5;

  if (data.freight > 0) {
    drawSummaryLine(pdf, yPos, 'Flete:', `$${data.freight.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
    yPos += 5;
  }

  if (data.taxRate > 0) {
    drawSummaryLine(pdf, yPos, `IVA (${data.taxRate.toFixed(1)}%):`, `$${data.taxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, [200, 124, 0]);
    yPos += 5;
  }

  if (data.discountAmount > 0) {
    drawSummaryLine(pdf, yPos, 'Descuento:', `-$${data.discountAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, [22, 163, 74]);
    yPos += 5;
  }

  drawTotalBox(pdf, yPos, 'TOTAL:', `$${data.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);

  drawFooter(pdf, 'Esta cotización tiene validez de 7 días. Válido únicamente para los datos especificados arriba.');

  const fileName = data.number
    ? `cotizacion-${data.number}.pdf`
    : `cotizacion-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
