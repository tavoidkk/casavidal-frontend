import type { Sale } from '../types';
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

export function generateInvoicePDF(sale: Sale, logoBase64?: string): void {
  const pdf = createPDFDocument();

  const dateStr = new Date(sale.createdAt).toLocaleDateString('es-VE', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  drawHeader(pdf, `FACTURA ${sale.saleNumber}`, dateStr, logoBase64);

  let yPos = 55;

  const clientItems: { label: string; value: string }[] = [
    { label: 'Nombre', value: getClientName(sale) },
    { label: 'Teléfono', value: sale.client.phone || '—' },
    { label: 'Vendedor', value: `${sale.seller.firstName} ${sale.seller.lastName}` },
  ];
  yPos = drawInfoCard(pdf, yPos, 'DATOS DEL CLIENTE', clientItems, `RIF: ${EMPRESA_RIF}`);
  drawDividerLine(pdf, yPos - 3);

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
    const paymentItems: { label: string; value: string; valueColor?: [number, number, number] }[] = sale.payments.map((payment) => {
      const label = `${PAYMENT_LABELS[payment.paymentMethod] || payment.paymentMethod}`;
      const currencyLabel = payment.currency === 'USD' ? 'USD' : 'Bs.';
      const amountDisplay = payment.currency === 'USD'
        ? formatAmount(Number(payment.amount))
        : `Bs. ${Number(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
      const conversion = payment.currency === 'USD' || exchangeRate === 0
        ? ''
        : ` (~${formatAmount(Number(payment.amount) / exchangeRate)})`;
      const ref = payment.reference ? ` - Ref: ${payment.reference}` : '';
      return {
        label: `${label} (${currencyLabel})`,
        value: `${amountDisplay}${conversion}${ref}`,
        valueColor: PDF_COLORS.dark,
      };
    });
    yPos = drawInfoCard(pdf, yPos, 'PAGOS', paymentItems);
    drawDividerLine(pdf, yPos - 3);
  }

  const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  yPos = drawSectionNote(pdf, yPos + 4, 'RESUMEN',
    `Esta factura documenta la venta de ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'} por un total de ${sale.currency === 'BS' ? formatBs(Number(sale.total)) : `$${Number(sale.total).toFixed(2)}`}. Agradecemos su preferencia y quedamos a su disposicion para cualquier consulta.`
  );

  const isBs = sale.currency === 'BS';
  const totalValue = isBs
    ? (hasPaymentTotals && paymentTotalBs > 0
      ? formatBs(paymentTotalBs)
      : formatBs(Number(sale.total)))
    : (hasPaymentTotals
      ? formatAmount(paymentTotalUsd)
      : formatAmount(Number(sale.total)));

  yPos += 4;
  drawDividerLine(pdf, yPos - 2);

  if (Number(sale.tax) > 0) {
    drawSummaryLine(pdf, yPos, 'IVA', formatAmount(Number(sale.tax)), PDF_COLORS.amber);
    yPos += 6;
  }

  drawTotalBox(pdf, yPos, isBs ? 'TOTAL Bs.' : 'TOTAL', totalValue);

  if (isBs && sale.usdToBsRateAtSale) {
    yPos += 10;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...PDF_COLORS.grayText);
    const usdRef = `$${Number(sale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })} (tasa ${sale.usdToBsRateAtSale})`;
    pdf.text(`USD ref: ${usdRef}`, 130, yPos);
  }

  if (sale.notes) {
    yPos += 8;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...PDF_COLORS.grayText);
    pdf.text(`Notas: ${sale.notes}`, PDF_CONFIG.margin, yPos);
  }

  drawFooter(pdf, 'Este documento es una factura de control interno.');

  pdf.save(`Factura-${sale.saleNumber}.pdf`);
}
