import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sale } from '../types';

const EMPRESA_NOMBRE = 'CASAVIDAL C.A.';
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
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  // ── Encabezado ──
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA_NOMBRE, margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`RIF: ${EMPRESA_RIF}`, margin, 27);

  // Número y fecha (derecha)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', pageW - margin, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${sale.saleNumber}`, pageW - margin, 27, { align: 'right' });
  const fechaStr = new Date(sale.createdAt).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Fecha: ${fechaStr}`, pageW - margin, 33, { align: 'right' });

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 38, pageW - margin, 38);

  // ── Datos del cliente ──
  let y = 45;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(`Nombre: ${getClientName(sale)}`, margin, y);
  y += 5;
  doc.text(`Teléfono: ${sale.client.phone || '—'}`, margin, y);

  // Vendedor (derecha)
  doc.setFont('helvetica', 'bold');
  doc.text('VENDEDOR', pageW / 2 + 10, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sale.seller.firstName} ${sale.seller.lastName}`, pageW / 2 + 10, 51);
  doc.text(`Método de pago: ${PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}`, pageW / 2 + 10, 56);

  y += 10;

  // ── Tabla de ítems ──
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Producto', 'SKU', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: sale.items.map((item) => [
      item.product.name,
      item.product.sku,
      `${item.quantity} ${item.product.unit || ''}`.trim(),
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

  // ── Total ──
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageW - margin - 70, finalY, pageW - margin, finalY);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageW - margin - 70, finalY + 8);
  doc.text(
    `$${Number(sale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    pageW - margin,
    finalY + 8,
    { align: 'right' }
  );

  // Notas
  if (sale.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Notas: ${sale.notes}`, margin, finalY + 16);
  }

  // ── Pie ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este documento es una factura de control interno.',
    pageW / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`Factura-${sale.saleNumber}.pdf`);
}
