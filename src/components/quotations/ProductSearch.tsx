import { useState, useEffect, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { productsApi } from '../../api/products.api';
import { useQuotationStore } from '../../store/quotations.store';
import type { Product } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const ProductSearch: React.FC = () => {
  const { addItem, selectedClient } = useQuotationStore();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<Record<string, number>>({});

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!search.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    const loadProducts = async () => {
      try {
        const response = await productsApi.getAll({
          search: search.trim(),
          limit: 20,
        });
        // Ordenar por relevancia: coincidencias exactas primero, luego por nombre
        const sorted = (response.data || []).sort((a, b) => {
          const aExact = a.name.toLowerCase() === search.toLowerCase();
          const bExact = b.name.toLowerCase() === search.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return a.name.localeCompare(b.name);
        });
        setProducts(sorted);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadProducts, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddProduct = (product: Product) => {
    const qty = Math.max(1, quantity[product.id] || 1);
    const unitPrice = Number(product.salePrice);
    const subtotal = qty * unitPrice;

    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productCode: product.sku,
      unitPrice,
      quantity: qty,
      subtotal,
    });

    setQuantity({ ...quantity, [product.id]: 1 });
    setSearch('');
    setProducts([]);
  };

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          Number(p.currentStock) > 0 &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()))
      ),
    [products, search]
  );

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Agregar Productos</h3>
          {!selectedClient && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              Selecciona un cliente primero
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!selectedClient}
            autoComplete="off"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
            <p className="text-sm mt-2">Buscando productos...</p>
          </div>
        ) : search.trim() && filteredProducts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">
              {products.length === 0 ? 'No se encontraron productos' : 'Productos sin stock disponible'}
            </p>
          </div>
        ) : search.trim() && filteredProducts.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => {
              const lowStock = Number(product.currentStock) <= Number(product.minStock);
              
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                      </div>
                      {product.category && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        ${Number(product.salePrice).toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        lowStock 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Stock: {product.currentStock}
                      </span>
                      {Number(product.currentStock) > Number(product.minStock) && (
                        <span className="text-xs text-gray-500">Mín: {product.minStock}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number"
                      min="1"
                      max={Number(product.currentStock)}
                      value={quantity[product.id] || 1}
                      onChange={(e) =>
                        setQuantity({
                          ...quantity,
                          [product.id]: Math.min(Math.max(1, Number(e.target.value)), Number(product.currentStock)),
                        })
                      }
                      className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500 group-hover:border-primary-300"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddProduct(product)}
                      className="whitespace-nowrap"
                      title="Agregar al carrito"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !search.trim() ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Comienza a escribir para buscar productos</p>
            <p className="text-xs mt-1">Por nombre o código SKU</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
