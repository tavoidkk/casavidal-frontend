import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PurchaseOrder } from '../types';

const EMPRESA_NOMBRE = 'CASAVIDAL C.A.';
const EMPRESA_RIF = 'J-30999631-2';

export function generatePurchaseOrderPDF(order: PurchaseOrder): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA_NOMBRE, margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`RIF: ${EMPRESA_RIF}`, margin, 27);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE COMPRA', pageW - margin, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${order.orderNumber}`, pageW - margin, 27, { align: 'right' });
  const fechaStr = new Date(order.createdAt).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Fecha: ${fechaStr}`, pageW - margin, 33, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 38, pageW - margin, 38);

  let y = 45;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PROVEEDOR', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(`Nombre: ${order.supplier.name}`, margin, y);
  y += 5;
  doc.text(`Teléfono: ${order.supplier.phone || '—'}`, margin, y);

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO', pageW / 2 + 10, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.status}`, pageW / 2 + 10, 51);
  if (order.expectedDate) {
    doc.text(`Fecha estimada: ${new Date(order.expectedDate).toLocaleDateString('es-VE')}`, pageW / 2 + 10, 56);
  }
  if (order.paymentTerms) {
    doc.text(`Pago: ${order.paymentTerms}`, pageW / 2 + 10, 61);
  }

  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Producto', 'SKU', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: order.items.map((item) => [
      item.productName,
      item.productSku || '—',
      `${item.quantity}`,
      `$${Number(item.unitPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      `$${Number(item.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    ]),
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 28 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageW - margin - 70, finalY, pageW - margin, finalY);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageW - margin - 70, finalY + 8);
  doc.text(
    `$${Number(order.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    pageW - margin,
    finalY + 8,
    { align: 'right' }
  );

  if (order.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Notas: ${order.notes}`, margin, finalY + 16);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este documento es una orden de compra de control interno.',
    pageW / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`OC-${order.orderNumber}.pdf`);
}
