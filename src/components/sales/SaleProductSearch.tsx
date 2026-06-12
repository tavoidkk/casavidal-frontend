import { useCallback, useEffect, useState } from 'react';
import { Search, X, ScanLine } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { BarcodeScanner } from '../common/BarcodeScanner';
import { productsApi } from '../../api/products.api';
import { useCurrencyStore } from '../../store/currency.store';
import { formatBs } from '../../utils/currency';
import type { Product } from '../../types';

interface SaleProductSearchProps {
  onSelectProduct: (product: any, quantity: number) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function SaleProductSearch({ onSelectProduct, searchInputRef }: SaleProductSearchProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showScanner, setShowScanner] = useState(false);
  const usdToBsRate = useCurrencyStore((s) => s.usdToBsRate);

  const loadProducts = useCallback(async (query = '') => {
    try {
      const response = await productsApi.getAll({
        search: query.trim() || undefined,
        limit: 30,
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadProducts(search);
    }, search.trim() ? 250 : 0);

    return () => window.clearTimeout(timeout);
  }, [loadProducts, search]);

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
      <div className="mb-2">
        <label className="block text-sm font-semibold text-gray-700">Productos</label>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          ref={searchInputRef}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={() => setShowScanner(true)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Escanear código">
            <ScanLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      {products.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
          {products.map((product) => (
            <div key={product.id} className="p-2.5 border-b hover:bg-gray-50 cursor-pointer last:border-b-0">
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{product.category?.name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-primary-700">
                  ${Number(product.salePrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
                {usdToBsRate && (
                  <span className="text-xs text-gray-500">
                    {formatBs(product.salePrice * usdToBsRate)}
                  </span>
                )}
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

      {products.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">No se encontraron productos</div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={async (code) => {
            try {
              const found = await productsApi.findByCode(code);
              if (found) {
                handleSelectProduct(found);
              } else {
                setSearch(code);
              }
            } catch {
              setSearch(code);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </Card>
  );
}
