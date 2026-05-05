import { useCallback } from 'react';
import { useSalesStore, type SaleItem } from '../../../store/sales.store';
import { SaleProductSearch } from '../SaleProductSearch';
import { SaleItemsTable } from '../SaleItemsTable';

export function ProductStep() {
  const {
    currentSale,
    addSaleItem,
    updateSaleItemQuantity,
    removeSaleItem,
  } = useSalesStore();

  const handleAddProduct = useCallback(
    (product: any, quantity: number) => {
      const item: SaleItem = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity,
        unitPrice: Number(product.unitPrice || 0),
        subtotal: quantity * Number(product.unitPrice || 0),
      };
      addSaleItem(item);
    },
    [addSaleItem]
  );

  if (!currentSale) {
    return <div className="text-center py-12">Cargando venta...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Productos</h2>
      <div className="mt-3 space-y-5">
        <SaleProductSearch onSelectProduct={handleAddProduct} />
        <SaleItemsTable
          items={currentSale.items}
          onUpdateQuantity={updateSaleItemQuantity}
          onRemoveItem={removeSaleItem}
        />
      </div>
    </div>
  );
}
