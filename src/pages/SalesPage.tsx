import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ShoppingCart, Eye, Download } from 'lucide-react';
import { salesApi } from '../api/sales.api';
import type { Sale } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../store/auth.store';
import { useSalesStore } from '../store/sales.store';
import { SaleForm } from '../components/sales/SaleForm';
import { DraftSalesList } from '../components/sales/DraftSalesList';
import { generateInvoicePDF } from '../utils/generateInvoice';

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: '💵 Efectivo',
  TRANSFERENCIA: '🏦 Transferencia',
  PUNTO_VENTA: '💳 P.V.',
  PAGO_MOVIL: '📱 P. Móvil',
  ZELLE: '💸 Zelle',
};

type PageMode = 'list' | 'form';

export default function SalesPage() {
  const { user } = useAuthStore();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';

  const {
    currentSale,
    draftSales,
    initNewSale,
    saveDraftSale,
    loadDraftSale,
    deleteDraftSale,
    clearCurrentSale,
  } = useSalesStore();

  const [pageMode, setPageMode] = useState<PageMode>('list');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesApi.getAll({
        search: search || undefined,
        page: currentPage,
        limit: 15,
      });
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    if (pageMode === 'list') {
      loadSales();
    }
  }, [loadSales, pageMode]);

  const handleNewSale = () => {
    initNewSale();
    setPageMode('form');
  };

  const handleSaveSale = async () => {
    if (!currentSale) return;

    try {
      const saleData = {
        clientId: currentSale.customer?.id || '',
        items: currentSale.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discount: currentSale.discount,
        paymentMethod: currentSale.paymentMethod as 'EFECTIVO' | 'TRANSFERENCIA' | 'PUNTO_VENTA' | 'PAGO_MOVIL' | 'ZELLE',
        notes: currentSale.notes,
        freight: currentSale.freight,
      };

      const createdSale = await salesApi.create(saleData);
      
      // Generar PDF
      if (createdSale) {
        generateInvoicePDF(createdSale);
      }

      // Limpiar y redirigir
      clearCurrentSale();
      deleteDraftSale(currentSale.id);
      setPageMode('list');
      loadSales();
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
      alert(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Error al guardar venta');
    }
  };

  const handleHoldSale = () => {
    saveDraftSale();
    alert('Venta guardada en espera. Puedes continuar con otra venta.');
  };

  const handleLoadDraft = (id: string) => {
    loadDraftSale(id);
    setPageMode('form');
  };

  const handleDownloadInvoice = async (sale: Sale) => {
    try {
      const full = await salesApi.getById(sale.id);
      generateInvoicePDF(full);
    } catch {
      generateInvoicePDF(sale);
    }
  };

  const getClientName = (sale: Sale) => {
    const c = sale.client;
    if (c.clientType === 'JURIDICO') return c.companyName || 'Sin nombre';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Sin nombre';
  };

  if (pageMode === 'form') {
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={() => {
          clearCurrentSale();
          setPageMode('list');
        }} className="mb-4">
          ← Volver a Lista
        </Button>
        <SaleForm
          onSaveComplete={handleSaveSale}
          onHold={handleHoldSale}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-1">
            {totalItems} venta{totalItems !== 1 ? 's' : ''} registrada{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleNewSale}>
            <Plus className="w-5 h-5 mr-2" />
            Nueva Venta
          </Button>
        )}
      </div>

      {/* Ventas en espera */}
      {draftSales.length > 0 && (
        <DraftSalesList
          drafts={draftSales}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={deleteDraftSale}
          onNewSale={handleNewSale}
        />
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número de venta o cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="mt-4 text-gray-600">Cargando ventas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No se encontraron ventas</p>
            {canCreate && (
              <Button className="mt-4" onClick={handleNewSale}>
                Registrar primera venta
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">N° Venta</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pago</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {sale.saleNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{getClientName(sale)}</p>
                          <p className="text-xs text-gray-500">{sale.client.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-600">
                          {sale.items.length} ítem{sale.items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold text-gray-900">
                          ${Number(sale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString('es-VE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 flex gap-1 justify-end">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsDetailOpen(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Descargar factura"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal Detalle */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSale(null);
        }}
        title={`Venta ${selectedSale?.saleNumber}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="font-semibold">{getClientName(selectedSale)}</p>
              </div>
              <div>
                <p className="text-gray-500">Vendedor</p>
                <p className="font-semibold">
                  {selectedSale.seller.firstName} {selectedSale.seller.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Método de pago</p>
                <p className="font-semibold">{PAYMENT_LABELS[selectedSale.paymentMethod]}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha</p>
                <p className="font-semibold">
                  {new Date(selectedSale.createdAt).toLocaleDateString('es-VE')}
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
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
                  {selectedSale.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2 px-3">{item.product.name}</td>
                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">${Number(item.unitPrice).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-semibold">${Number(item.subtotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${Number(selectedSale.subtotal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(selectedSale.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-${Number(selectedSale.discount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>TOTAL</span>
                <span>${Number(selectedSale.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {selectedSale.notes && (
              <p className="text-sm text-gray-600 italic">Notas: {selectedSale.notes}</p>
            )}

            <div className="flex justify-end pt-2 border-t">
              <Button onClick={() => handleDownloadInvoice(selectedSale)}>
                <Download className="w-4 h-4 mr-2" />
                Descargar Factura
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
