import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { Product } from '../../types';

const adjustSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  type: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCION']),
  reference: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

interface StockAdjustModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (productId: string, data: AdjustFormData) => Promise<void>;
  isLoading?: boolean;
}

const MOVEMENT_TYPES = [
  { value: 'ENTRADA', label: '📦 Entrada (Compra a proveedor)' },
  { value: 'SALIDA', label: '📤 Salida (Venta / consumo)' },
  { value: 'AJUSTE_POSITIVO', label: '➕ Ajuste positivo' },
  { value: 'AJUSTE_NEGATIVO', label: '➖ Ajuste negativo' },
  { value: 'DEVOLUCION', label: '🔄 Devolución de cliente' },
];

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  product,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      quantity: 1,
      type: 'ENTRADA',
      reference: '',
      notes: '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: AdjustFormData) => {
    if (!product) return;
    await onSubmit(product.id, data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ajustar Stock"
      size="md"
    >
      {product && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          <p className="text-sm">
            Stock actual:{' '}
            <span
              className={`font-semibold ${
                product.currentStock <= product.minStock
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              {product.currentStock} {product.unit}
            </span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Select
          label="Tipo de Movimiento *"
          {...register('type')}
          error={errors.type?.message}
          options={MOVEMENT_TYPES}
        />

        <Input
          label="Cantidad *"
          type="number"
          {...register('quantity')}
          error={errors.quantity?.message}
          placeholder="1"
        />

        <Input
          label="Referencia"
          {...register('reference')}
          error={errors.reference?.message}
          placeholder="Nro. factura, orden de compra..."
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Motivo del ajuste..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Confirmar Ajuste
          </Button>
        </div>
      </form>
    </Modal>
  );
};
