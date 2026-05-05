import { useState, useMemo, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { productsApi } from '../../api/products.api';
import type { Category } from '../../api/products.api';
import type { Product } from '../../types';

interface SaleProductSearchProps {
  onSelectProduct: (product: any, quantity: number) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function SaleProductSearch({ onSelectProduct, searchInputRef }: SaleProductSearchProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    salePrice: '',
    costPrice: '',
    currentStock: '0',
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productsApi.getAll({ limit: 1000 });
        setProducts(response.data);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
      );
  }, [search, products]);

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(
      {
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Sin categoría',
        unitPrice: product.salePrice,
        stock: product.currentStock,
      },
      quantity
    );
    setSearch('');
    setQuantity(1);
  };

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.sku || !formData.categoryId || !formData.salePrice) return;
    setIsSubmitting(true);
    try {
      const salePrice = Number(formData.salePrice);
      const costPrice = formData.costPrice ? Number(formData.costPrice) : salePrice;
      const currentStock = Math.max(0, Number(formData.currentStock || 0));
      const created = await productsApi.create({
        name: formData.name,
        sku: formData.sku,
        categoryId: formData.categoryId,
        costPrice,
        salePrice,
        currentStock,
        unit: 'unidad',
      });
      setProducts((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      setFormData({ name: '', sku: '', categoryId: '', salePrice: '', costPrice: '', currentStock: '0' });
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 bg-white border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-700">Productos</label>
        <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Crear
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          ref={searchInputRef}
          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filteredProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-2.5 border-b hover:bg-gray-50 cursor-pointer last:border-b-0">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{product.category?.name}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Stock: {product.currentStock}</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  max={product.currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                />
                <Button
                  size="sm"
                  onClick={() => handleSelectProduct(product)}
                  disabled={product.currentStock === 0}
                  className="flex-1"
                >
                  Agregar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">No se encontraron productos</div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear producto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="Nombre del producto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="SKU"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            >
              <option value="">Seleccionar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProduct}
              className="flex-1"
              disabled={!formData.name || !formData.sku || !formData.categoryId || !formData.salePrice || isSubmitting}
            >
              Crear Producto
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
