import type { Sale } from '../types';
import {
  createPDFDocument,
  drawHeader,
  drawSectionLabel,
  drawInfoLine,
  drawInfoLineRight,
  drawLabelValueLine,
  createItemsTable,
  drawSummaryLine,
  drawTotalBox,
  drawFooter,
  PDF_COLORS,
  PDF_CONFIG,
} from './pdfLayout';
import { formatBs } from './currency';

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
  const infoGap = 6;
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
  drawInfoLineRight(pdf, 71, 'RIF', EMPRESA_RIF, 0);
  drawInfoLineRight(pdf, 77, 'Teléfono', sale.client.phone || '—', 0);
  yPos += infoGap + 10;

  const tableBody = sale.items.map((item) => [
    item.product.name,
    item.product.sku,
    `${item.quantity} ${item.product.unit || ''}`.trim(),
    `$${Number(item.unitPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    `$${Number(item.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
  ]);
  yPos = createItemsTable(pdf, yPos, [['Producto', 'SKU', 'Cant.', 'P. Unit.', 'Subtotal']], tableBody) + 12;
  
  const formatAmount = (value: number) => `$${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  const exchangeRate = sale.usdToBsRateAtSale ?? 0;
  const payments = sale.payments ?? [];
  const paymentTotalUsd = payments.reduce((sum, payment) => sum + Number(payment.amountUsd), 0);
  const paymentTotalBs = payments.reduce((sum, payment) => {
    if (payment.currency === 'BS') return sum + Number(payment.amount);
    if (exchangeRate > 0) {
      return sum + Number(payment.amountUsd) * exchangeRate;
    }
    return sum;
  }, 0);
  const hasPaymentTotals = payments.length > 0 && paymentTotalUsd > 0;
  
  if (sale.payments && sale.payments.length > 0) {
    drawSectionLabel(pdf, yPos, 'PAGOS');
    yPos += 6;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Monto', PDF_CONFIG.margin + PDF_CONFIG.contentWidth, yPos, { align: 'right' });
    yPos += 6;
    pdf.setTextColor(...PDF_COLORS.dark);
    sale.payments.forEach((payment) => {
      const label = `${PAYMENT_LABELS[payment.paymentMethod] || payment.paymentMethod}`;
      const currencyLabel = payment.currency === 'USD' ? 'USD' : 'Bs.';
      const amountDisplay = payment.currency === 'USD'
        ? formatAmount(Number(payment.amount))
        : `Bs. ${Number(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
      const conversion = payment.currency === 'USD' || exchangeRate === 0
        ? ''
        : ` -> ${formatAmount(Number(payment.amount) / exchangeRate)}`;
      drawLabelValueLine(
        pdf,
        yPos,
        `${label} (${currencyLabel})`,
        `${amountDisplay}${conversion}`
      );
      yPos += 6;
      if (payment.reference) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...PDF_COLORS.grayText);
        pdf.text(`Referencia: ${payment.reference}`, PDF_CONFIG.margin + 4, yPos);
        yPos += 4;
        pdf.setTextColor(...PDF_COLORS.dark);
      }
    });
    yPos += 4;
  }

  const isBs = sale.currency === 'BS';
  const totalValue = isBs
    ? (hasPaymentTotals && paymentTotalBs > 0
      ? formatBs(paymentTotalBs)
      : formatBs(Number(sale.total)))
    : (hasPaymentTotals
      ? formatAmount(paymentTotalUsd)
      : formatAmount(Number(sale.total)));

  if (Number(sale.tax) > 0) {
    yPos += 5;
    drawSummaryLine(pdf, yPos, 'IVA', formatAmount(Number(sale.tax)), PDF_COLORS.amber);
    yPos += 6;
  }

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
