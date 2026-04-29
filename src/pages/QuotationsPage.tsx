import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, Download, Edit2, Trash2, Calendar, User, DollarSign } from 'lucide-react';
import { useQuotationStore, type SavedQuotation } from '../store/quotations.store';
import { QuotationContainer } from '../components/quotations/QuotationContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { generateInvoicePDF } from '../utils/generateInvoice';
import type { Sale } from '../types';
import { staggerContainer, staggerItem } from '../utils/motion';

export default function QuotationsPage() {
  const { savedQuotations, deleteQuotation, reset } = useQuotationStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<SavedQuotation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteQuotation = (id: string) => {
    deleteQuotation(id);
    setDeleteConfirm(null);
  };

  const handleEditQuotation = (id: string) => {
    setEditingId(id);
    setIsCreating(true);
  };

  const handleViewDetails = (quotation: SavedQuotation) => {
    setSelectedQuotation(quotation);
    setIsDetailOpen(true);
  };

  const handleGeneratePDF = (quotation: SavedQuotation) => {
    // Convertir SavedQuotation a formato compatible con generateInvoicePDF
    const saleData: Sale = {
      id: quotation.id,
      saleNumber: quotation.number,
      clientId: quotation.selectedClient.id,
      client: {
        id: quotation.selectedClient.id,
        firstName: quotation.selectedClient.name.split(' ')[0] || '',
        lastName: quotation.selectedClient.name.split(' ').slice(1).join(' ') || '',
        phone: quotation.selectedClient.phone || '',
        clientType: 'NATURAL',
      },
      seller: {
        id: 'system',
        firstName: 'CasaVidal',
        lastName: 'System',
      },
      sellerId: 'system',
      items: quotation.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.productId,
          name: item.productName,
          sku: item.productCode,
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })) as any,
      subtotal: quotation.subtotal,
      tax: quotation.taxAmount,
      discount: quotation.discountAmount,
      total: quotation.total,
      paymentMethod: 'EFECTIVO',
      createdAt: quotation.createdAt,
    };

    try {
      generateInvoicePDF(saleData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar PDF');
    }
  };

  if (isCreating) {
    return (
      <div className="pb-6">
        <QuotationContainer
          onBack={() => {
            setIsCreating(false);
            setEditingId(null);
            reset();
          }}
          quotationId={editingId || undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">Cotizaciones</h1>
          <p className="text-gray-600 mt-1">
            {savedQuotations.length} cotización{savedQuotations.length !== 1 ? 'es' : ''} guardada{savedQuotations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Lista de Cotizaciones */}
      {savedQuotations.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 font-display">Bienvenido al módulo de Cotizaciones</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Crea cotizaciones profesionales de manera rápida y sencilla. Selecciona un cliente, agrega
            productos, configura los descuentos e IVA, y genera un PDF listo para enviar.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Crear Primera Cotización
          </Button>
        </Card>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4">
          {savedQuotations.map((quotation) => (
            <motion.div key={quotation.id} variants={staggerItem}>
              <Card interactive>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Número */}
                <div>
                  <p className="text-sm text-gray-600">Número</p>
                  <p className="font-mono font-bold text-primary-600 text-lg">{quotation.number}</p>
                </div>

                {/* Cliente */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Cliente</span>
                  </div>
                  <p className="font-medium text-gray-900">{quotation.selectedClient.name}</p>
                </div>

                {/* Fecha */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Fecha</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {new Date(quotation.createdAt).toLocaleDateString('es-VE')}
                  </p>
                </div>

                {/* Total */}
                <div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Total</span>
                  </div>
                  <p className="font-bold text-lg text-gray-900">
                    ${quotation.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleViewDetails(quotation)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleGeneratePDF(quotation)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                  title="Descargar PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditQuotation(quotation.id)}
                  className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-xl transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(quotation.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal de Detalles */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedQuotation(null);
        }}
        title={`Cotización ${selectedQuotation?.number}`}
        size="lg"
      >
        {selectedQuotation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-semibold">{selectedQuotation.selectedClient.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Teléfono</p>
                <p className="font-semibold">{selectedQuotation.selectedClient.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha</p>
                <p className="font-semibold">{new Date(selectedQuotation.createdAt).toLocaleDateString('es-VE')}</p>
              </div>
              <div>
                <p className="text-gray-500">Estado</p>
                <p className="font-semibold">{selectedQuotation.status}</p>
              </div>
            </div>

            {selectedQuotation.notes && (
              <div>
                <p className="text-gray-500 text-sm">Notas</p>
                <p className="text-gray-900">{selectedQuotation.notes}</p>
              </div>
            )}

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3">Producto</th>
                    <th className="text-center py-2 px-3">Cant.</th>
                    <th className="text-right py-2 px-3">P. Unit.</th>
                    <th className="text-right py-2 px-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuotation.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2 px-3">{item.productName}</td>
                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">
                        ${item.unitPrice.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        ${item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${selectedQuotation.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              {selectedQuotation.freight > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Flete</span>
                  <span>${selectedQuotation.freight.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {selectedQuotation.taxRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>IVA ({selectedQuotation.taxRate.toFixed(1)}%)</span>
                  <span>${selectedQuotation.taxAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {selectedQuotation.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-${selectedQuotation.discountAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>TOTAL</span>
                <span>${selectedQuotation.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleGeneratePDF(selectedQuotation);
                  setIsDetailOpen(false);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar Cotización"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteConfirm && handleDeleteQuotation(deleteConfirm)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
