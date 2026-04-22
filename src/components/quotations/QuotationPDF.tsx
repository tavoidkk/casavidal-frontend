import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuotationStore } from '../../store/quotations.store';
import type { QuotationData } from '../../api/quotations.api';

interface QuotationPDFProps {
  quotation?: QuotationData;
}

export const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation }) => {
  const { selectedClient, items, subtotal, freight, taxRate, taxAmount, discountAmount, total } =
    useQuotationStore();

  const handleGeneratePDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const clientInfo = quotation 
      ? { name: quotation.clientName, phone: quotation.clientPhone, email: quotation.clientEmail }
      : selectedClient;
    const itemsData = quotation ? quotation.items : items;
    const finalSubtotal = quotation ? quotation.subtotal : subtotal;
    const finalFreight = quotation ? quotation.freight : freight;
    const finalTaxRate = quotation ? quotation.taxRate : taxRate;
    const finalTaxAmount = quotation ? quotation.taxAmount : taxAmount;
    const finalDiscountAmount = quotation ? quotation.discountAmount : discountAmount;
    const finalTotal = quotation ? quotation.total : total;

    // Colores
    const primaryColor: [number, number, number] = [59, 130, 246];
    const darkColor: [number, number, number] = [30, 41, 59];
    const lightGray: [number, number, number] = [241, 245, 249];

    // Header
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, 210, 45, 'F');

    // Logo placeholder
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('CASAVIDAL', 15, 22);
    pdf.setFontSize(8);
    pdf.text('Ferretería Integral', 15, 28);

    // Número de cotización
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const cotNumber = quotation?.number || `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`;
    pdf.text(`COTIZACIÓN ${cotNumber}`, 130, 22);

    // Fecha de expedición
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
    pdf.text(`Fecha: ${dateStr}`, 130, 28);

    // Sección de cliente
    let yPos = 55;
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.rect(15, yPos - 5, 180, 8, 'F');
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS DEL CLIENTE', 15, yPos);

    yPos += 10;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const clientName = clientInfo?.name || 'No especificado';
    const clientPhone = clientInfo?.phone || 'No especificado';
    const clientEmail = clientInfo?.email || '';
    
    pdf.text(`Nombre: ${clientName}`, 15, yPos);
    yPos += 5;
    pdf.text(`Teléfono: ${clientPhone}`, 15, yPos);
    yPos += 5;
    if (clientEmail) {
      pdf.text(`Email: ${clientEmail}`, 15, yPos);
      yPos += 5;
    }

    // Tabla de productos
    yPos += 5;

    const tableData = itemsData.map((item) => [
      item.productName,
      item.productCode,
      item.quantity.toString(),
      `$${item.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      `$${item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(pdf, {
      head: [['Producto', 'Código', 'Cant.', 'P. Unit.', 'Subtotal']],
      body: tableData,
      startY: yPos,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
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
        fillColor: lightGray,
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        2: { halign: 'center' as const },
        3: { halign: 'right' as const },
        4: { halign: 'right' as const },
      },
    });

    // Resumen financiero
    yPos = (pdf as any).lastAutoTable.finalY + 10;

    const summaryX = 130;
    const summaryWidth = 65;

    // Subtotal
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    pdf.text('Subtotal:', summaryX, yPos);
    pdf.text(
      `$${finalSubtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      summaryX + summaryWidth - 2,
      yPos,
      { align: 'right' }
    );

    yPos += 5;
    if (finalFreight > 0) {
      pdf.text('Flete:', summaryX, yPos);
      pdf.text(
        `$${finalFreight.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        summaryX + summaryWidth - 2,
        yPos,
        { align: 'right' }
      );
      yPos += 5;
    }

    if (finalTaxRate > 0) {
      pdf.text(`IVA (${finalTaxRate.toFixed(1)}%):`, summaryX, yPos);
      pdf.setTextColor(200, 124, 0);
      pdf.text(
        `$${finalTaxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        summaryX + summaryWidth - 2,
        yPos,
        { align: 'right' }
      );
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      yPos += 5;
    }

    if (finalDiscountAmount > 0) {
      pdf.text('Descuento:', summaryX, yPos);
      pdf.setTextColor(22, 163, 74);
      pdf.text(
        `-$${finalDiscountAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        summaryX + summaryWidth - 2,
        yPos,
        { align: 'right' }
      );
      pdf.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      yPos += 5;
    }

    // Total
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(summaryX - 2, yPos - 3, summaryWidth + 4, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('TOTAL:', summaryX, yPos + 1);
    pdf.text(
      `$${finalTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      summaryX + summaryWidth - 2,
      yPos + 1,
      { align: 'right' }
    );

    // Footer
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text(
      'Esta cotización tiene validez de 7 días. Válido únicamente para los datos especificados arriba.',
      15,
      pdf.internal.pageSize.getHeight() - 15,
      { maxWidth: 180 }
    );

    // Descargar
    const fileName = quotation
      ? `cotizacion-${quotation.number}.pdf`
      : `cotizacion-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const isDisabled = (!selectedClient && !quotation) || (items.length === 0 && !quotation);

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={isDisabled}
      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
        isDisabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4"
        />
      </svg>
      Generar PDF
    </button>
  );
};
