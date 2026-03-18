import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, MapPin, Star, ShoppingBag } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityForm } from './ActivityForm';
import { activitiesApi } from '../../api/activities.api';
import type { Client, Activity, ActivityCreate } from '../../types';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export function ClientDetailModal({ isOpen, onClose, client }: ClientDetailModalProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar actividades del cliente
  useEffect(() => {
    if (isOpen && client.id) {
      loadActivities();
    }
  }, [isOpen, client.id]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await activitiesApi.getActivitiesByClient(client.id);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Crear actividad
  const handleCreateActivity = async (data: Omit<ActivityCreate, 'clientId'>) => {
    try {
      await activitiesApi.createActivity({
        ...data,
        clientId: client.id,
      });
      await loadActivities();
      setIsActivityFormOpen(false);
      setErrorMessage('');
    } catch (error: any) {
      console.error('Error creating activity:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear la actividad';
      setErrorMessage(errorMessage);
      throw error;
    }
  };

  const clientDisplayName =
    client.clientType === 'NATURAL'
      ? `${client.firstName} ${client.lastName}`
      : client.companyName;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de ${clientDisplayName}`} size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Información del cliente */}
          <div className="lg:col-span-1 space-y-4">
            {/* Categoría */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Categoría
              </label>
              <Badge
                variant={
                  client.category === 'VIP'
                    ? 'info'
                    : client.category === 'MAYORISTA'
                    ? 'info'
                    : client.category === 'REGULAR'
                    ? 'default'
                    : client.category === 'NUEVO'
                    ? 'success'
                    : 'warning'
                }
              >
                {client.category}
              </Badge>
            </div>

            {/* Contacto */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Contacto
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compras totales</span>
                <div className="flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{client.purchaseCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monto total</span>
                <span className="font-semibold text-green-600">
                  ${client.totalPurchases.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Puntos fidelidad</span>
                <span className="font-semibold text-amber-600">{client.loyaltyPoints} pts</span>
              </div>
              {client.scoring && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Scoring IA</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{client.scoring.score}/100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Timeline de actividades */}
          <div className="lg:col-span-2">
            {errorMessage && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Timeline de Actividades</h3>
              <Button
                size="sm"
                onClick={() => setIsActivityFormOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Actividad</span>
              </Button>
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-2">
              <ActivityTimeline activities={activities} loading={loadingActivities} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de crear actividad */}
      <ActivityForm
        isOpen={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        onSubmit={handleCreateActivity}
        title="Nueva Actividad"
      />
    </>
  );
}
