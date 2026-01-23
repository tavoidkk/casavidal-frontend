import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Client } from '../../types';

const clientSchema = z.object({
  clientType: z.enum(['NATURAL', 'JURIDICO']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  rif: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  address: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
  city: z.string().optional(),
  state: z.string().optional(),
  category: z.enum(['NUEVO', 'REGULAR', 'VIP', 'MAYORISTA', 'INACTIVO']).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.clientType === 'NATURAL') {
    return data.firstName && data.lastName;
  }
  if (data.clientType === 'JURIDICO') {
    return data.companyName;
  }
  return true;
}, {
  message: 'Datos requeridos según tipo de cliente',
  path: ['clientType'],
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          clientType: client.clientType,
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          companyName: client.companyName || '',
          rif: client.rif || '',
          email: client.email || '',
          phone: client.phone,
          address: client.address,
          city: client.city || '',
          state: client.state || '',
          category: client.category,
          notes: '',
        }
      : {
          clientType: 'NATURAL',
        },
  });

  const clientType = watch('clientType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tipo de Cliente */}
      <Select
        label="Tipo de Cliente"
        {...register('clientType')}
        error={errors.clientType?.message}
        options={[
          { value: 'NATURAL', label: 'Persona Natural' },
          { value: 'JURIDICO', label: 'Persona Jurídica' },
        ]}
      />

      {/* Campos para Persona Natural */}
      {clientType === 'NATURAL' && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder="Juan"
          />
          <Input
            label="Apellido *"
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder="Pérez"
          />
        </div>
      )}

      {/* Campos para Persona Jurídica */}
      {clientType === 'JURIDICO' && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Razón Social *"
            {...register('companyName')}
            error={errors.companyName?.message}
            placeholder="Construcciones XYZ C.A."
          />
          <Input
            label="RIF"
            {...register('rif')}
            error={errors.rif?.message}
            placeholder="J-123456789"
          />
        </div>
      )}

      {/* Contacto */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="ejemplo@email.com"
        />
        <Input
          label="Teléfono *"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="04241234567"
        />
      </div>

      {/* Dirección */}
      <Input
        label="Dirección *"
        {...register('address')}
        error={errors.address?.message}
        placeholder="Av. 5 de Julio, Casa 123"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ciudad"
          {...register('city')}
          error={errors.city?.message}
          placeholder="Maracaibo"
        />
        <Input
          label="Estado"
          {...register('state')}
          error={errors.state?.message}
          placeholder="Zulia"
        />
      </div>

      {/* Categoría */}
      <Select
        label="Categoría"
        {...register('category')}
        error={errors.category?.message}
        options={[
          { value: 'NUEVO', label: 'Nuevo' },
          { value: 'REGULAR', label: 'Regular' },
          { value: 'VIP', label: 'VIP' },
          { value: 'MAYORISTA', label: 'Mayorista' },
        ]}
      />

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Información adicional..."
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {client ? 'Actualizar' : 'Crear'} Cliente
        </Button>
      </div>
    </form>
  );
};