import { useState, useEffect } from 'react';
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
  document: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  address: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
  city: z.string().optional(),
  state: z.string().optional(),
  category: z.enum(['NUEVO', 'REGULAR', 'VIP', 'MAYORISTA', 'INACTIVO']).optional(),
  notes: z.string().optional(),
})
.refine((data) => {
  if (data.clientType === 'NATURAL') {
    return data.firstName && data.lastName && data.document;
  }
  return true;
}, {
  message: 'Nombre, apellido y cédula son requeridos para persona natural',
  path: ['firstName'],
})
.refine((data) => {
  if (data.clientType === 'JURIDICO') {
    return data.companyName && data.document;
  }
  return true;
}, {
  message: 'Razón social y RIF son requeridos para persona jurídica',
  path: ['companyName'],
})
.refine((data) => {
  if (!data.document) return true;
  
  if (data.clientType === 'NATURAL') {
    return /^[VE]-\d{7,8}$/.test(data.document);
  } else {
    return /^[JG]-\d{8,9}-\d$/.test(data.document);
  }
}, {
  message: 'Formato de documento inválido',
  path: ['document'],
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
  const [docPrefix, setDocPrefix] = useState<string>('V');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docCheck, setDocCheck] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange', // ← IMPORTANTE: Validar al cambiar
    defaultValues: {
      clientType: 'NATURAL',
      category: 'NUEVO',
      firstName: '',
      lastName: '',
      companyName: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      notes: '',
    },
  });

  const clientType = watch('clientType');

  // Construir documento (función auxiliar)
  const buildDocument = (type: string, prefix: string, number: string, check: string = ''): string => {
    if (!number) return '';
    
    if (type === 'NATURAL') {
      return `${prefix}-${number}`;
    } else {
      return check ? `${prefix}-${number}-${check}` : `${prefix}-${number}`;
    }
  };

  // Inicializar cuando se carga un cliente
  useEffect(() => {
    if (client) {
      const doc = client.document || client.rif || '';
      
      let parsedPrefix = 'V';
      let parsedNumber = '';
      let parsedCheck = '';
      
      // Parsear documento
      if (doc) {
        const parts = doc.split('-');
        if (parts.length >= 2) {
          parsedPrefix = parts[0];
          parsedNumber = parts[1];
          if (parts.length === 3) {
            parsedCheck = parts[2];
          }
        }
      }

      // Actualizar estados
      setDocPrefix(parsedPrefix);
      setDocNumber(parsedNumber);
      setDocCheck(parsedCheck);

      // Resetear formulario
      reset({
        clientType: client.clientType,
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        companyName: client.companyName || '',
        document: doc, // ← Documento completo
        email: client.email || '',
        phone: client.phone,
        address: client.address,
        city: client.city || '',
        state: client.state || '',
        category: client.category,
        notes:  '',
      });
    }
  }, [client, reset]);

  // Actualizar prefijo según tipo (solo nuevos clientes)
  useEffect(() => {
    if (!client) {
      if (clientType === 'NATURAL') {
        setDocPrefix('V');
        setDocCheck('');
      } else {
        setDocPrefix('J');
      }
    }
  }, [clientType, client]);

  // Actualizar documento en el formulario
  const updateDocument = (prefix: string, number: string, check: string = '') => {
    const fullDoc = buildDocument(clientType, prefix, number, check);
    setValue('document', fullDoc, { 
      shouldValidate: !!number, // Solo validar si hay número
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrefix = e.target.value;
    setDocPrefix(newPrefix);
    updateDocument(newPrefix, docNumber, docCheck);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const maxLength = clientType === 'NATURAL' ? 8 : 9;
    const truncated = value.slice(0, maxLength);
    
    setDocNumber(truncated);
    updateDocument(docPrefix, truncated, docCheck);
  };

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 1);
    setDocCheck(value);
    updateDocument(docPrefix, docNumber, value);
  };

console.log('🔍 Form State:', {
  client: client?.firstName,
  docPrefix,
  docNumber,
  docCheck,
  documentValue: watch('document'),
  errors: errors.document?.message,
});


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tipo de Cliente */}
      <Select
        label="Tipo de Cliente *"
        {...register('clientType')}
        error={errors.clientType?.message}
        options={[
          { value: 'NATURAL', label: 'Persona Natural' },
          { value: 'JURIDICO', label: 'Persona Jurídica' },
        ]}
        disabled={!!client}
      />

      {/* Persona Natural */}
      {clientType === 'NATURAL' && (
        <>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cédula de Identidad *
            </label>
            <div className="flex gap-2">
              <select
                value={docPrefix}
                onChange={handlePrefixChange}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="V">V</option>
                <option value="E">E</option>
              </select>
              <span className="flex items-center text-gray-500 font-medium">-</span>
              <input
                type="text"
                value={docNumber}
                onChange={handleNumberChange}
                placeholder="12345678"
                maxLength={8}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {errors.document && (
              <p className="text-red-500 text-sm mt-1">{errors.document.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              V = Venezolano, E = Extranjero
            </p>
          </div>
        </>
      )}

      {/* Persona Jurídica */}
      {clientType === 'JURIDICO' && (
        <>
          <Input
            label="Razón Social *"
            {...register('companyName')}
            error={errors.companyName?.message}
            placeholder="Construcciones XYZ C.A."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RIF *
            </label>
            <div className="flex gap-2">
              <select
                value={docPrefix}
                onChange={handlePrefixChange}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="J">J</option>
                <option value="G">G</option>
              </select>
              <span className="flex items-center text-gray-500 font-medium">-</span>
              <input
                type="text"
                value={docNumber}
                onChange={handleNumberChange}
                placeholder="123456789"
                maxLength={9}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="flex items-center text-gray-500 font-medium">-</span>
              <input
                type="text"
                value={docCheck}
                onChange={handleCheckChange}
                placeholder="0"
                maxLength={1}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {errors.document && (
              <p className="text-red-500 text-sm mt-1">{errors.document.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              J = Empresa, G = Gobierno
            </p>
          </div>
        </>
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

      <input type="hidden" {...register('document')} />

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
