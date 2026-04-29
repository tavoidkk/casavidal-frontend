import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { productsApi } from '../api/products.api';
import type { Category, AdjustStockData, CreateProductData } from '../api/products.api';
import type { ProductFormData } from '../components/products/ProductForm';
import type { Product } from '../types';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ProductForm } from '../components/products/ProductForm';
import { StockAdjustModal } from '../components/products/StockAdjustModal';
import { useAuthStore } from '../store/auth.store';
import { staggerContainer, staggerItem } from '../utils/motion';

export default function ProductsPage() {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({
        search,
        categoryId: categoryFilter,
        lowStock: lowStockFilter || undefined,
        page: currentPage,
        limit: 15,
      });
      setProducts(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, lowStockFilter, currentPage]);

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        costPrice: Number(data.costPrice),
        salePrice: Number(data.salePrice),
        wholesalePrice: data.wholesalePrice ? Number(data.wholesalePrice) : undefined,
        currentStock: Number(data.currentStock),
        minStock: data.minStock ? Number(data.minStock) : undefined,
        maxStock: data.maxStock ? Number(data.maxStock) : undefined,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
        image: data.image || undefined,
        unit: data.unit || undefined,
      };

      if (selectedProduct) {
        await productsApi.update(selectedProduct.id, payload as Partial<CreateProductData>);
      } else {
        await productsApi.create(payload as CreateProductData);
      }
      setIsFormOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (productId: string, data: Omit<AdjustStockData, 'productId'>) => {
    setIsSubmitting(true);
    try {
      await productsApi.adjustStock({ productId, ...data });
      setIsStockOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Error al ajustar stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar este producto?')) return;
    try {
      await productsApi.delete(id);
      loadProducts();
    } catch {
      alert('Error al eliminar producto');
    }
  };

  const getStockBadge = (product: Product) => {
    if (product.currentStock === 0) {
      return <Badge variant="danger">Sin stock</Badge>;
    }
    if (product.currentStock <= product.minStock) {
      return <Badge variant="warning">Stock bajo</Badge>;
    }
    return <Badge variant="success">En stock</Badge>;
  };

  return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 font-display">Productos</h1>
            <p className="text-gray-600 mt-1">Gestión de inventario y catálogo</p>
          </div>
        {canEdit && (
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
          <div className="w-full md:w-52">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lowStockFilter"
              checked={lowStockFilter}
              onChange={(e) => { setLowStockFilter(e.target.checked); setCurrentPage(1); }}
              className="w-4 h-4 text-primary-600"
            />
            <label htmlFor="lowStockFilter" className="text-sm text-gray-700 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Solo stock bajo
            </label>
          </div>
        </div>
      </Card>

      {/* Tabla */}
        <Card>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
              <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No se encontraron productos</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Precio</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                    {products.map((product) => (
                      <motion.tr
                        key={product.id}
                        variants={staggerItem}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            {product.barcode && (
                              <p className="text-xs text-gray-400">EAN: {product.barcode}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700">
                            {product.category?.name || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              ${Number(product.salePrice).toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Costo: ${Number(product.costPrice).toLocaleString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {product.currentStock} {product.unit}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Mín: {product.minStock}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStockBadge(product)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-1">
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsStockOpen(true);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                                  title="Ajustar Stock"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsFormOpen(true);
                                  }}
                                  className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-xl transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {user?.role === 'ADMIN' && (
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Desactivar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
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

      {/* Modal Crear/Editar Producto */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedProduct(null); }}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setSelectedProduct(null); }}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal Ajustar Stock */}
      <StockAdjustModal
        isOpen={isStockOpen}
        product={selectedProduct}
        onClose={() => { setIsStockOpen(false); setSelectedProduct(null); }}
        onSubmit={handleAdjustStock}
        isLoading={isSubmitting}
      />
    </div>
  );
}
