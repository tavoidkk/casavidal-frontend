import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Product } from '../../types';
import type { Category } from '../../api/products.api';

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
