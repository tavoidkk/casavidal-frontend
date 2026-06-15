import type { Sale } from '../types';
import {
  createPDFDocument,
  drawHeader,
  drawSectionLabel,
  drawInfoLine,
  drawInfoLineRight,
  createItemsTable,
  drawTotalBox,
  drawFooter,
} from './pdfLayout';

const EMPRESA_RIF = 'J-30999631-2';

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  PUNTO_VENTA: 'Punto de Venta',
  PAGO_MOVIL: 'Pago Móvil',
  ZELLE: 'Zelle',
};

function getClientName(sale: Sale): string {
  if (sale.client.clientType === 'JURIDICO') return sale.client.companyName || 'Sin nombre';
  return `${sale.client.firstName || ''} ${sale.client.lastName || ''}`.trim() || 'Sin nombre';
}

export function generateInvoicePDF(sale: Sale): void {
  const pdf = createPDFDocument();

  const dateStr = new Date(sale.createdAt).toLocaleDateString('es-VE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  drawHeader(pdf, `FACTURA ${sale.saleNumber}`, dateStr);

  let yPos = 55;
  drawSectionLabel(pdf, yPos, 'DATOS DEL CLIENTE');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`RIF: ${EMPRESA_RIF}`, 130, yPos);

  yPos += 10;
  drawInfoLine(pdf, yPos, 'Nombre', getClientName(sale));
  yPos += 5;
  drawInfoLine(pdf, yPos, 'Teléfono', sale.client.phone || '—');

  drawInfoLineRight(pdf, 65, 'Vendedor', `${sale.seller.firstName} ${sale.seller.lastName}`, 0);
  drawInfoLineRight(pdf, 71, 'Método de pago', PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod, 0);
  if (sale.paymentReference) {
    drawInfoLineRight(pdf, 77, 'Referencia', sale.paymentReference, 0);
  }

  yPos += 10;

  const tableBody = sale.items.map((item) => [
    item.product.name,
    item.product.sku,
    `${item.quantity} ${item.product.unit || ''}`.trim(),
    `$${Number(item.unitPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    `$${Number(item.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
  ]);
  yPos = createItemsTable(pdf, yPos, [['Producto', 'SKU', 'Cant.', 'P. Unit.', 'Subtotal']], tableBody) + 10;

  const isBs = sale.currency === 'BS';
  const totalValue = isBs && sale.usdToBsRateAtSale
    ? `Bs. ${(sale.total * sale.usdToBsRateAtSale).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
    : `$${Number(sale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

  drawTotalBox(pdf, yPos, isBs ? 'TOTAL Bs.' : 'TOTAL', totalValue);

  if (isBs && sale.usdToBsRateAtSale) {
    yPos += 10;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    const usdRef = `$${Number(sale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })} (tasa ${sale.usdToBsRateAtSale})`;
    pdf.text(`USD ref: ${usdRef}`, 130, yPos);
  }

  const notesY = isBs && sale.usdToBsRateAtSale ? yPos + 8 : yPos + 6;
  if (sale.notes) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Notas: ${sale.notes}`, 15, notesY);
  }

  drawFooter(pdf, 'Este documento es una factura de control interno.');

  pdf.save(`Factura-${sale.saleNumber}.pdf`);
}
