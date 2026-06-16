import type { PurchaseOrder } from '../types';
import {
  createPDFDocument,
  drawHeader,
  drawInfoCard,
  createItemsTable,
  drawTotalBox,
  drawDividerLine,
  drawFooter,
  PDF_COLORS,
} from './pdfLayout';

const EMPRESA_RIF = 'J-30999631-2';

export function generatePurchaseOrderPDF(order: PurchaseOrder, logoBase64?: string): void {
  const pdf = createPDFDocument();

  const dateStr = new Date(order.createdAt).toLocaleDateString('es-VE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  drawHeader(pdf, `ORDEN DE COMPRA ${order.orderNumber}`, dateStr, logoBase64);

  let yPos = 55;

  const supplierItems: { label: string; value: string; valueColor?: [number, number, number] }[] = [
    { label: 'Nombre', value: order.supplier.name },
    { label: 'Teléfono', value: order.supplier.phone || '—' },
    { label: 'Estado', value: order.status, valueColor: PDF_COLORS.primary },
  ];
  if (order.expectedDate) {
    supplierItems.push({
      label: 'Fecha estimada',
      value: new Date(order.expectedDate).toLocaleDateString('es-VE'),
    });
  }
  if (order.paymentTerms) {
    supplierItems.push({ label: 'Pago', value: order.paymentTerms });
  }
  yPos = drawInfoCard(pdf, yPos, 'DATOS DEL PROVEEDOR', supplierItems, `RIF: ${EMPRESA_RIF}`);
  drawDividerLine(pdf, yPos - 3);

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
