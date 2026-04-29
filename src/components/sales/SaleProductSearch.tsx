import { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { productsApi } from '../../api/products.api';
import type { Product } from '../../types';

interface SaleProductSearchProps {
  onSelectProduct: (product: any, quantity: number) => void;
}

export function SaleProductSearch({ onSelectProduct }: SaleProductSearchProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);

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

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category?.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
      )
      .slice(0, 8);
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

  return (
    <Card className="p-4 bg-white border border-gray-200">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Agregar Productos</label>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      {search && filteredProducts.length > 0 && (
        <div className="absolute bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-96 max-h-80 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-3 border-b hover:bg-gray-50 cursor-pointer last:border-b-0">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-lg">{product.category?.name}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Stock: {product.currentStock} unidades</p>
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

      {search && filteredProducts.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">No se encontraron productos</div>
      )}
    </Card>
  );
}
