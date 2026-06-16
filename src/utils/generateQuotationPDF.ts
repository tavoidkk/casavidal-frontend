import type { QuotationItem } from '../api/quotations.api';
import {
  createPDFDocument,
  drawHeader,
  drawSectionLabel,
  drawInfoLine,
  createItemsTable,
  drawSummaryLine,
  drawTotalBox,
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
  drawSectionLabel(pdf, yPos, 'DATOS DEL CLIENTE');

  yPos += 10;
  drawInfoLine(pdf, yPos, 'Nombre', data.clientName || 'No especificado');
  yPos += 5;
  drawInfoLine(pdf, yPos, 'Teléfono', data.clientPhone || 'No especificado');
  yPos += 5;
  if (data.clientEmail) {
    drawInfoLine(pdf, yPos, 'Email', data.clientEmail);
    yPos += 5;
  }
  yPos += 5;

  const tableBody = data.items.map((item) => [
    item.productName,
    item.productCode,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    `$${item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
  ]);
  yPos = createItemsTable(pdf, yPos, [['Producto', 'Código', 'Cant.', 'P. Unit.', 'Subtotal']], tableBody) + 10;

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
