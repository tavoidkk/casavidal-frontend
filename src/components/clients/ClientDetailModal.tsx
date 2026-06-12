import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, MapPin, Star, ShoppingBag, AlertTriangle, Calendar, TrendingDown, Award, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityForm } from './ActivityForm';
import { activitiesApi } from '../../api/activities.api';
import { clientsApi } from '../../api/Clients.api';
import type { Client, Activity, ActivityCreate, PointsTransaction } from '../../types';

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
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);

  useEffect(() => {
    if (isOpen && client.id) {
      loadActivities();
      loadPointsHistory();
    }
  }, [isOpen, client.id]);

  const loadPointsHistory = async () => {
    setLoadingPoints(true);
    try {
      const data = await clientsApi.getPointsHistory(client.id);
      setPointsHistory(data);
    } catch (error) {
      console.error('Error loading points history:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

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

  const handleCreateActivity = async (data: Omit<ActivityCreate, 'clientId'>) => {
    try {
      await activitiesApi.createActivity({ ...data, clientId: client.id });
      await loadActivities();
      setIsActivityFormOpen(false);
      setErrorMessage('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear la actividad';
      setErrorMessage(errorMessage);
      throw error;
    }
  };

  const clientDisplayName = client.clientType === 'NATURAL'
    ? `${client.firstName} ${client.lastName}`
    : client.companyName;

  const daysSinceLastPurchase = client.lastPurchaseAt
    ? Math.floor((Date.now() - new Date(client.lastPurchaseAt).getTime()) / 86400000)
    : null;

  const churnRisk = client.scoring?.churnProbability || 0;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de ${clientDisplayName}`} size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Categoría</label>
              <Badge variant={client.category === 'VIP' || client.category === 'MAYORISTA' ? 'info' : client.category === 'REGULAR' ? 'default' : client.category === 'NUEVO' ? 'success' : 'warning'}>
                {client.category}
              </Badge>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Contacto</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{client.phone}</span></div>
                {client.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{client.email}</span></div>}
                {client.address && <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span className="text-gray-600">{client.address}</span></div>}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compras totales</span>
                <div className="flex items-center gap-1"><ShoppingBag className="w-4 h-4 text-gray-400" /><span className="font-semibold">{client.purchaseCount}</span></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monto total</span>
                <span className="font-semibold text-green-600">${client.totalPurchases.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Puntos fidelidad</span>
                <span className="font-semibold text-amber-600">{client.loyaltyPoints} pts</span>
              </div>
              {client.scoring && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Scoring IA</span>
                  <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /><span className="font-semibold">{client.scoring.score}/100</span></div>
                </div>
              )}
            </div>

            {/* Scoring detallado */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Análisis de Cliente</h4>
              {daysSinceLastPurchase !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Días desde última compra</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={`font-semibold ${daysSinceLastPurchase > 60 ? 'text-red-600' : daysSinceLastPurchase > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                      {daysSinceLastPurchase} días
                    </span>
                  </div>
                </div>
              )}
              {churnRisk > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-400" /> Riesgo de pérdida
                    </span>
                    <span className={`text-sm font-semibold ${churnRisk > 50 ? 'text-red-600' : churnRisk > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                      {churnRisk}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${churnRisk > 50 ? 'bg-red-500' : churnRisk > 30 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${churnRisk}%` }} />
                  </div>
                  {churnRisk > 50 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Alto riesgo — realizar seguimiento pronto
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Etapa actual</span>
                <Badge variant={client.stage === 'GANADO' ? 'success' : client.stage === 'PERDIDO' ? 'danger' : 'warning'}>{client.stage}</Badge>
              </div>
            </div>

            {/* Timeline de Puntos de Lealtad */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" /> Puntos de Lealtad
              </h4>
              {loadingPoints ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : pointsHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Sin historial de puntos</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {pointsHistory.map((pt) => (
                    <div key={pt.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        {pt.type === 'EARNED' ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs text-gray-700 truncate">{pt.description || (pt.type === 'EARNED' ? 'Compra' : 'Canje')}</p>
                          <p className="text-[10px] text-gray-400">{new Date(pt.createdAt).toLocaleDateString('es-VE')}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`text-xs font-semibold ${pt.type === 'EARNED' ? 'text-green-600' : 'text-red-600'}`}>
                          {pt.type === 'EARNED' ? '+' : '-'}{pt.points}
                        </p>
                        <p className="text-[10px] text-gray-400">{pt.runningBalance} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {errorMessage && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Timeline de Actividades</h3>
              <Button size="sm" onClick={() => setIsActivityFormOpen(true)}>
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

      <ActivityForm
        isOpen={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        onSubmit={handleCreateActivity}
        title="Nueva Actividad"
      />
    </>
  );
}
