import type { PurchaseOrder } from '../types';
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

export function generatePurchaseOrderPDF(order: PurchaseOrder): void {
  const pdf = createPDFDocument();

  const dateStr = new Date(order.createdAt).toLocaleDateString('es-VE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  drawHeader(pdf, `ORDEN DE COMPRA ${order.orderNumber}`, dateStr);

  let yPos = 55;
  drawSectionLabel(pdf, yPos, 'DATOS DEL PROVEEDOR');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`RIF: ${EMPRESA_RIF}`, 130, yPos);

  yPos += 10;
  drawInfoLine(pdf, yPos, 'Nombre', order.supplier.name);
  yPos += 5;
  drawInfoLine(pdf, yPos, 'Teléfono', order.supplier.phone || '—');

  drawInfoLineRight(pdf, 65, 'Estado', order.status, 0);
  if (order.expectedDate) {
    drawInfoLineRight(pdf, 71, 'Fecha estimada', new Date(order.expectedDate).toLocaleDateString('es-VE'), 0);
  }
  if (order.paymentTerms) {
    drawInfoLineRight(pdf, 77, 'Pago', order.paymentTerms, 0);
  }

  yPos += 10;

  const tableBody = order.items.map((item) => [
    item.productName,
    item.productSku || '—',
    `${item.quantity}`,
    `$${Number(item.unitPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    `$${Number(item.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
  ]);
  yPos = createItemsTable(pdf, yPos, [['Producto', 'SKU', 'Cant.', 'P. Unit.', 'Subtotal']], tableBody) + 10;

  drawTotalBox(pdf, yPos, 'TOTAL:', `$${Number(order.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);

  if (order.notes) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Notas: ${order.notes}`, 15, yPos + 12);
  }

  drawFooter(pdf, 'Este documento es una orden de compra de control interno.');

  pdf.save(`OC-${order.orderNumber}.pdf`);
}
