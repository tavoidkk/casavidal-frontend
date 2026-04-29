import { useState, useEffect } from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import { useQuotationStore } from '../../store/quotations.store';
import { ClientSelector } from './ClientSelector';
import { ProductSearch } from './ProductSearch';
import { QuotationItems } from './QuotationItems';
import { QuotationSummary } from './QuotationSummary';
import { QuotationPDF } from './QuotationPDF';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface QuotationContainerProps {
  onBack?: () => void;
  quotationId?: string;
}

export const QuotationContainer: React.FC<QuotationContainerProps> = ({ onBack, quotationId }) => {
  const { selectedClient, items, reset, saveQuotation, loadQuotation, currentQuotationId } = useQuotationStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar cotización si viene un ID
  useEffect(() => {
    if (quotationId) {
      loadQuotation(quotationId);
    }
  }, [quotationId, loadQuotation]);

  const handleSave = async () => {
    if (!selectedClient || items.length === 0) {
      alert('Por favor selecciona un cliente y agrega productos');
      return;
    }

    setIsSaving(true);
    try {
      const saved = saveQuotation();
      if (saved) {
        setSaveSuccess(true);
        // Guardar por 1 segundo y luego volver a la lista
        setTimeout(() => {
          reset();
          onBack?.();
        }, 1000);
      }
    } catch (error) {
      alert('Error al guardar la cotización');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Volver"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 font-display">
              {currentQuotationId ? 'Editar Cotización' : 'Nueva Cotización'}
            </h1>
            <p className="text-gray-600 mt-1">
              {currentQuotationId ? 'Modifica los datos de la cotización' : 'Crea un presupuesto profesional para tu cliente'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <Card className="bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="text-green-600">✓</div>
            <p className="text-green-700 font-medium">Cotización guardada exitosamente</p>
          </div>
        </Card>
      )}

      {/* Layout: 2 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <ClientSelector />
          <ProductSearch />
          <QuotationItems />
        </div>

        {/* Columna derecha: Resumen y Acciones */}
        <div className="lg:col-span-1">
          <QuotationSummary />
        </div>
      </div>

      {/* Acciones */}
      <Card className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="text-sm text-gray-600">
          {selectedClient && items.length > 0 ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Listo para guardar cotización
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Completa los datos antes de continuar
            </span>
          )}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onBack?.();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!selectedClient || items.length === 0}
            title="Guardar cambios"
          >
            <Save className="w-4 h-4 mr-2" />
            {currentQuotationId ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </Card>

      {/* Generar PDF - Full width si hay datos */}
      {selectedClient && items.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-display">Exportar</h3>
              <p className="text-sm text-gray-600">
                Descarga la cotización en formato PDF listo para enviar al cliente
              </p>
            </div>
            <QuotationPDF />
          </div>
        </Card>
      )}
    </div>
  );
};
