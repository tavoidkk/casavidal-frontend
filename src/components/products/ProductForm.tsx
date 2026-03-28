import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Star, Truck } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Product } from '../../types';
import type { Category } from '../../api/products.api';
import { productsApi } from '../../api/products.api';
import { suppliersApi, type Supplier } from '../../api/suppliers.api';

const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  barcode: z.string().max(50).optional().or(z.literal('')),
  categoryId: z.string().uuid('Selecciona una categoría válida'),
  costPrice: z.coerce.number().positive('El precio de costo debe ser positivo'),
  salePrice: z.coerce.number().positive('El precio de venta debe ser positivo'),
  wholesalePrice: z.coerce.number().positive().optional().or(z.literal('')),
  currentStock: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  minStock: z.coerce.number().int().min(0).optional().or(z.literal('')),
  maxStock: z.coerce.number().int().min(0).optional().or(z.literal('')),
  unit: z.string().max(20).optional().or(z.literal('')),
  image: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: '',
      costPrice: 0,
      salePrice: 0,
      wholesalePrice: '',
      currentStock: 0,
      minStock: '',
      maxStock: '',
      unit: 'unidad',
      image: '',
    },
  });

  // ── Estado de proveedores (solo en modo edición) ──
  type LinkedSupplier = NonNullable<Product['productSuppliers']>[number];
  const [linkedSuppliers, setLinkedSuppliers] = useState<LinkedSupplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newSupplierPrice, setNewSupplierPrice] = useState('');
  const [newIsPreferred, setNewIsPreferred] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState('');

  // Cargar datos al abrir en modo edición
  useEffect(() => {
    if (!product) return;
    // Cargar datos frescos del producto (con productSuppliers)
    const load = async () => {
      const [fresh, suppRes] = await Promise.all([
        productsApi.getById(product.id),
        suppliersApi.getAll({ limit: 100 }),
      ]);
      setLinkedSuppliers(fresh.productSuppliers ?? []);
      setAllSuppliers(suppRes.data);
    };
    load().catch(() => {});
  }, [product]);

  const handleAddSupplier = async () => {
    if (!product || !newSupplierId || !newSupplierPrice) {
      setSupplierError('Selecciona un proveedor e ingresa el precio');
      return;
    }
    setSupplierError('');
    setSupplierLoading(true);
    try {
      await productsApi.upsertSupplier(product.id, newSupplierId, Number(newSupplierPrice), newIsPreferred);
      // Recargar lista
      const fresh = await productsApi.getById(product.id);
      setLinkedSuppliers(fresh.productSuppliers ?? []);
      setNewSupplierId('');
      setNewSupplierPrice('');
      setNewIsPreferred(false);
    } catch {
      setSupplierError('Error al vincular proveedor');
    } finally {
      setSupplierLoading(false);
    }
  };

  const handleRemoveSupplier = async (supplierId: string) => {
    if (!product) return;
    setSupplierLoading(true);
    try {
      await productsApi.removeSupplier(product.id, supplierId);
      setLinkedSuppliers((prev) => prev.filter((s) => s.supplierId !== supplierId));
    } catch {
      setSupplierError('Error al desvincular proveedor');
    } finally {
      setSupplierLoading(false);
    }
  };

  const handleSetPreferred = async (supplierId: string, currentPrice: number) => {
    if (!product) return;
    setSupplierLoading(true);
    try {
      await productsApi.upsertSupplier(product.id, supplierId, currentPrice, true);
      const fresh = await productsApi.getById(product.id);
      setLinkedSuppliers(fresh.productSuppliers ?? []);
    } catch {
      setSupplierError('Error al actualizar proveedor preferido');
    } finally {
      setSupplierLoading(false);
    }
  };

  // Proveedores disponibles para agregar (los que no están ya vinculados)
  const availableSuppliers = allSuppliers.filter(
    (s) => !linkedSuppliers.some((ls) => ls.supplierId === s.id)
  );

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.categoryId,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        wholesalePrice: product.wholesalePrice ?? '',
        currentStock: product.currentStock,
        minStock: product.minStock ?? '',
        maxStock: product.maxStock ?? '',
        unit: product.unit || 'unidad',
        image: product.image || '',
      });
    }
  }, [product, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nombre y SKU */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre *"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Pintura Látex Blanca"
        />
        <Input
          label="SKU *"
          {...register('sku')}
          error={errors.sku?.message}
          placeholder="PINT-LAT-001"
          disabled={!!product}
        />
      </div>

      {/* Categoría y Unidad */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Categoría *"
          {...register('categoryId')}
          error={errors.categoryId?.message}
          options={[
            { value: '', label: 'Selecciona una categoría' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Input
          label="Unidad"
          {...register('unit')}
          error={errors.unit?.message}
          placeholder="unidad, litro, kg..."
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Descripción opcional del producto..."
        />
      </div>

      {/* Precios */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Precio Costo *"
          type="number"
          step="0.01"
          {...register('costPrice')}
          error={errors.costPrice?.message}
          placeholder="0.00"
        />
        <Input
          label="Precio Venta *"
          type="number"
          step="0.01"
          {...register('salePrice')}
          error={errors.salePrice?.message}
          placeholder="0.00"
        />
        <Input
          label="Precio Mayorista"
          type="number"
          step="0.01"
          {...register('wholesalePrice')}
          error={errors.wholesalePrice?.message}
          placeholder="0.00"
        />
      </div>

      {/* Stock */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label={product ? 'Stock Actual' : 'Stock Inicial *'}
          type="number"
          {...register('currentStock')}
          error={errors.currentStock?.message}
          placeholder="0"
          disabled={!!product}
        />
        <Input
          label="Stock Mínimo"
          type="number"
          {...register('minStock')}
          error={errors.minStock?.message}
          placeholder="5"
        />
        <Input
          label="Stock Máximo"
          type="number"
          {...register('maxStock')}
          error={errors.maxStock?.message}
          placeholder="100"
        />
      </div>

      {/* Código de barras e imagen */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Código de Barras"
          {...register('barcode')}
          error={errors.barcode?.message}
          placeholder="7501234567890"
        />
        <Input
          label="URL Imagen"
          {...register('image')}
          error={errors.image?.message}
          placeholder="https://..."
        />
      </div>

      {product && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          ⚠️ El SKU y el stock actual no se pueden editar directamente. Usa "Ajustar Stock" para modificar el inventario.
        </p>
      )}

      {/* Sección de proveedores (solo en modo edición) */}
      {product && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Proveedores vinculados
          </h3>

          {/* Lista de proveedores vinculados */}
          {linkedSuppliers.length > 0 ? (
            <div className="space-y-2">
              {linkedSuppliers.map((ls) => (
                <div
                  key={ls.supplierId}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    {ls.isPreferred && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                    <span className="font-medium">{ls.supplier.name}</span>
                    {ls.supplier.rif && (
                      <span className="text-gray-400 text-xs">{ls.supplier.rif}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-700 font-semibold">
                      ${Number(ls.supplierPrice).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </span>
                    {!ls.isPreferred && (
                      <button
                        type="button"
                        onClick={() => handleSetPreferred(ls.supplierId, Number(ls.supplierPrice))}
                        disabled={supplierLoading}
                        className="text-xs text-amber-600 hover:text-amber-700 underline"
                        title="Marcar como preferido"
                      >
                        Preferido
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplier(ls.supplierId)}
                      disabled={supplierLoading}
                      className="text-red-400 hover:text-red-600"
                      title="Desvincular"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Sin proveedores vinculados. Los pedidos especiales se crearán sin orden de compra automática.</p>
          )}

          {/* Agregar nuevo proveedor */}
          {availableSuppliers.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">Agregar proveedor</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <select
                    value={newSupplierId}
                    onChange={(e) => setNewSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {availableSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newSupplierPrice}
                    onChange={(e) => setNewSupplierPrice(e.target.value)}
                    placeholder="Precio"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPreferred}
                    onChange={(e) => setNewIsPreferred(e.target.checked)}
                    className="rounded"
                  />
                  Preferido
                </label>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSupplier}
                  isLoading={supplierLoading}
                  disabled={!newSupplierId || !newSupplierPrice}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {supplierError && (
                <p className="text-xs text-red-600">{supplierError}</p>
              )}
            </div>
          )}

          {availableSuppliers.length === 0 && allSuppliers.length === 0 && (
            <p className="text-xs text-gray-400 italic border-t pt-2">
              No hay proveedores registrados. Crea proveedores en el módulo de Proveedores.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  );
};
