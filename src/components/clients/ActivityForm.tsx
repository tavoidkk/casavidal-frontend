import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { ActivityType } from '../../types';

const activitySchema = z.object({
  type: z.enum(['LLAMADA', 'EMAIL', 'REUNION', 'NOTA', 'TAREA', 'SEGUIMIENTO']),
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  description: z.string().optional(),
  scheduledFor: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  initialData?: Partial<ActivityFormData>;
  title?: string;
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'LLAMADA', label: '📞 Llamada' },
  { value: 'EMAIL', label: '📧 Email' },
  { value: 'REUNION', label: '👥 Reunión' },
  { value: 'SEGUIMIENTO', label: '🔄 Seguimiento' },
  { value: 'TAREA', label: '✅ Tarea' },
  { value: 'NOTA', label: '📝 Nota' },
];

export function ActivityForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Nueva Actividad',
}: ActivityFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: initialData || {
      type: 'LLAMADA',
      title: '',
      description: '',
      scheduledFor: '',
    },
  });

  const handleFormSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Tipo de actividad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de actividad *
          </label>
          <Select {...register('type')} error={errors.type?.message} options={activityTypes} />
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <Input
            {...register('title')}
            placeholder="Ej: Llamada de seguimiento"
            error={errors.title?.message}
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Detalles de la actividad..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Fecha programada (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha programada (opcional)
          </label>
          <Input
            type="datetime-local"
            {...register('scheduledFor')}
            error={errors.scheduledFor?.message}
          />
          <p className="mt-1 text-xs text-gray-500">
            Para actividades futuras, deja en blanco si ya fue realizada
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Actividad'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
