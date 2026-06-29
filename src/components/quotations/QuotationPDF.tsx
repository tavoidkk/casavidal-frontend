import { useQuotationStore } from '../../store/quotations.store';
import type { QuotationData } from '../../api/quotations.api';
import { generateQuotationPDF } from '../../utils/generateQuotationPDF';
import { getLogoBase64 } from '../../utils/pdfLogo';
import { getSignatureBase64 } from '../../utils/pdfSignature';

interface QuotationPDFProps {
  quotation?: QuotationData;
}

export const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation }) => {
  const { selectedClient, items, subtotal, freight, taxRate, taxAmount, discountAmount, total } =
    useQuotationStore();

  const handleGeneratePDF = async () => {
    const [logoBase64, signatureBase64] = await Promise.all([
      getLogoBase64(),
      getSignatureBase64(),
    ]);
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

    generateQuotationPDF({
      number: quotation?.number,
      clientName: clientInfo?.name || 'No especificado',
      clientPhone: clientInfo?.phone || 'No especificado',
      clientEmail: clientInfo?.email,
      items: itemsData,
      subtotal: finalSubtotal,
      freight: finalFreight,
      taxRate: finalTaxRate,
      taxAmount: finalTaxAmount,
      discountAmount: finalDiscountAmount,
      total: finalTotal,
      createdAt: quotation?.createdAt,
      logoBase64: logoBase64 ?? undefined,
      signatureBase64: signatureBase64 ?? undefined,
    });
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
