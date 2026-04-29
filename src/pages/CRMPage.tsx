import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Filter, Search, CalendarClock, AlertTriangle, PlusCircle, XCircle, Eye, Clock } from 'lucide-react';
import { activitiesApi } from '../api/activities.api';
import { clientsApi } from '../api/Clients.api';
import type { Activity, ActivityType, Client } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { staggerContainer, staggerItem } from '../utils/motion';

const typeOptions: { value: '' | ActivityType; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'LLAMADA', label: 'Llamada' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'REUNION', label: 'Reunión' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
  { value: 'TAREA', label: 'Tarea' },
  { value: 'NOTA', label: 'Nota' },
];

export default function CRMPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | ActivityType>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Estados para modal de detalle
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Estados para modal de reagendar
  const [activityToReschedule, setActivityToReschedule] = useState<Activity | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  
  const [form, setForm] = useState({
    clientId: '',
    type: 'SEGUIMIENTO' as ActivityType,
    title: '',
    description: '',
    scheduledFor: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await activitiesApi.getAllActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error loading CRM activities:', error);
      showToast('error', 'No se pudieron cargar las actividades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientsApi.getAll({ page: 1, limit: 200 });
        setClients(response.data);
      } catch (error) {
        console.error('Error loading clients for CRM:', error);
      }
    };
    loadClients();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAhead = new Date(today);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const kpis = useMemo(() => {
    const all = activities;
    const todayCount = all.filter((a) => {
      const dt = new Date(a.scheduledFor || a.createdAt);
      return dt >= today && dt < weekAhead && a.status !== 'COMPLETADA';
    }).length;
    const pending = all.filter((a) => (a.status || 'PENDIENTE') === 'PENDIENTE').length;
    const completed = all.filter((a) => a.status === 'COMPLETADA').length;
    const overdue = all.filter((a) => {
      const dt = new Date(a.scheduledFor || a.createdAt);
      return dt < today && (a.status || 'PENDIENTE') === 'PENDIENTE';
    }).length;
    return { todayCount, pending, completed, overdue };
  }, [activities, today, weekAhead]);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const clientName = a.client?.clientType === 'JURIDICO'
        ? a.client?.companyName || ''
        : `${a.client?.firstName || ''} ${a.client?.lastName || ''}`.trim();
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || a.type === typeFilter;
      const matchesStatus = !statusFilter || (a.status || 'PENDIENTE') === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [activities, search, typeFilter, statusFilter]);

  const agenda = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const tomorrow = new Date(base);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(base);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const pending = activities.filter((a) => (a.status || 'PENDIENTE') === 'PENDIENTE');
    const overdue = pending.filter((a) => new Date(a.scheduledFor || a.createdAt) < base);
    const todayItems = pending.filter((a) => {
      const dt = new Date(a.scheduledFor || a.createdAt);
      return dt >= base && dt < tomorrow;
    });
    const nextItems = pending.filter((a) => {
      const dt = new Date(a.scheduledFor || a.createdAt);
      return dt >= tomorrow && dt < nextWeek;
    });
    return { overdue, todayItems, nextItems };
  }, [activities]);

  const markComplete = async (activity: Activity) => {
    try {
      await activitiesApi.updateActivity(activity.id, { status: 'COMPLETADA' });
      await loadActivities();
      showToast('success', 'Actividad completada.');
    } catch {
      showToast('error', 'No se pudo completar la actividad.');
    }
  };

  const rescheduleTomorrow = async (activity: Activity) => {
    setActivityToReschedule(activity);
    // Configurar fecha por defecto para mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM por defecto
    setRescheduleDate(tomorrow.toISOString().slice(0, 16));
    setIsRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!activityToReschedule || !rescheduleDate) {
      showToast('error', 'Debe seleccionar una fecha y hora.');
      return;
    }

    try {
      setRescheduling(true);
      await activitiesApi.updateActivity(activityToReschedule.id, {
        scheduledFor: new Date(rescheduleDate).toISOString(),
        status: 'PENDIENTE',
      });
      await loadActivities();
      setIsRescheduleOpen(false);
      setActivityToReschedule(null);
      setRescheduleDate('');
      showToast('success', 'Actividad reagendada correctamente.');
    } catch {
      showToast('error', 'No se pudo reagendar la actividad.');
    } finally {
      setRescheduling(false);
    }
  };

  const openActivityDetail = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  const getActivityTypeInfo = (type: ActivityType) => {
    const config = {
      LLAMADA: { icon: '📞', color: 'text-secondary-600', label: 'Llamada' },
      EMAIL: { icon: '📧', color: 'text-green-600', label: 'Email' },
      REUNION: { icon: '👥', color: 'text-purple-600', label: 'Reunión' },
      SEGUIMIENTO: { icon: '📅', color: 'text-amber-600', label: 'Seguimiento' },
      TAREA: { icon: '✅', color: 'text-emerald-600', label: 'Tarea' },
      NOTA: { icon: '📝', color: 'text-indigo-600', label: 'Nota' },
    };
    return config[type] || config.NOTA;
  };

  const cancelActivity = async (activity: Activity) => {
    try {
      await activitiesApi.updateActivity(activity.id, { status: 'CANCELADA' });
      await loadActivities();
      showToast('success', 'Actividad cancelada.');
    } catch {
      showToast('error', 'No se pudo cancelar la actividad.');
    }
  };

  const createActivity = async () => {
    if (!form.clientId || !form.title.trim()) {
      showToast('error', 'Cliente y título son obligatorios.');
      return;
    }
    try {
      setCreating(true);
      await activitiesApi.createActivity({
        clientId: form.clientId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledFor: form.scheduledFor || undefined,
      });
      setForm({
        clientId: '',
        type: 'SEGUIMIENTO',
        title: '',
        description: '',
        scheduledFor: '',
      });
      setIsCreateOpen(false);
      await loadActivities();
      showToast('success', 'Actividad creada.');
    } catch {
      showToast('error', 'Error al crear actividad.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">CRM</h1>
          <p className="text-gray-600 mt-1">Agenda comercial y seguimiento de clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/clients')}>
            Ver Clientes
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nueva Actividad
          </Button>
        </div>
      </div>

      {agenda.overdue.length > 0 && (
        <Card className="mb-4 border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">
              Tienes {agenda.overdue.length} actividad{agenda.overdue.length !== 1 ? 'es' : ''} vencida{agenda.overdue.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold">Vencidas</h3>
          </div>
          <div className="space-y-2 text-sm">
            {agenda.overdue.slice(0, 4).map((a) => (
              <p key={a.id} className="text-gray-700 truncate">{a.title}</p>
            ))}
            {agenda.overdue.length === 0 && <p className="text-gray-400">Sin vencidas</p>}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold">Hoy</h3>
          </div>
          <div className="space-y-2 text-sm">
            {agenda.todayItems.slice(0, 4).map((a) => (
              <p key={a.id} className="text-gray-700 truncate">{a.title}</p>
            ))}
            {agenda.todayItems.length === 0 && <p className="text-gray-400">Sin actividades para hoy</p>}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-secondary-600" />
            <h3 className="font-semibold">Próximos 7 días</h3>
          </div>
          <div className="space-y-2 text-sm">
            {agenda.nextItems.slice(0, 4).map((a) => (
              <p key={a.id} className="text-gray-700 truncate">{a.title}</p>
            ))}
            {agenda.nextItems.length === 0 && <p className="text-gray-400">Sin próximas actividades</p>}
          </div>
        </Card>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div variants={staggerItem}>
          <Card interactive><p className="text-sm text-gray-500">Hoy / Próx. 7 días</p><p className="text-2xl font-semibold">{kpis.todayCount}</p></Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card interactive><p className="text-sm text-gray-500">Pendientes</p><p className="text-2xl font-semibold">{kpis.pending}</p></Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card interactive><p className="text-sm text-gray-500">Completadas</p><p className="text-2xl font-semibold">{kpis.completed}</p></Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card interactive><p className="text-sm text-gray-500">Vencidas</p><p className="text-2xl font-semibold text-red-600">{kpis.overdue}</p></Card>
        </motion.div>
      </motion.div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="Buscar actividad o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as '' | ActivityType)}>
            {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA')}>
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <div className="flex items-center text-gray-500 text-sm">
            <Filter className="w-4 h-4 mr-2" /> {filtered.length} actividades
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <p className="text-gray-500">Cargando actividades...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No hay actividades con esos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 px-2">Cliente</th>
                  <th className="py-3 px-2">Tipo</th>
                  <th className="py-3 px-2">Asunto</th>
                  <th className="py-3 px-2">Fecha</th>
                  <th className="py-3 px-2">Estado</th>
                  <th className="py-3 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                {filtered.map((a) => {
                  const clientName = a.client?.clientType === 'JURIDICO'
                    ? a.client?.companyName || 'Sin cliente'
                    : `${a.client?.firstName || ''} ${a.client?.lastName || ''}`.trim() || 'Sin cliente';
                  const status = a.status || 'PENDIENTE';
                  return (
                    <motion.tr key={a.id} variants={staggerItem} className="border-b border-gray-100">
                      <td className="py-3 px-2">{clientName}</td>
                      <td className="py-3 px-2"><Badge variant="default">{a.type}</Badge></td>
                      <td className="py-3 px-2">{a.title}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {new Date(a.scheduledFor || a.createdAt).toLocaleString('es-VE')}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={status === 'COMPLETADA' ? 'success' : status === 'CANCELADA' ? 'danger' : 'warning'}>
                          {status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openActivityDetail(a)}>
                            <Eye className="w-4 h-4 mr-1" /> Ver
                          </Button>
                          
                          {status === 'PENDIENTE' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => markComplete(a)}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Completar
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => rescheduleTomorrow(a)}>
                                <Clock className="w-4 h-4 mr-1" /> Reagendar
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => cancelActivity(a)}>
                                <XCircle className="w-4 h-4 mr-1" /> Cancelar
                              </Button>
                            </>
                          )}
                          
                          {(status === 'COMPLETADA' || status === 'CANCELADA') && (
                            <Badge 
                              variant={status === 'COMPLETADA' ? 'success' : 'danger'}
                              className="text-xs"
                            >
                              {status === 'COMPLETADA' ? 'Finalizada' : 'Cancelada'}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nueva Actividad CRM" size="md">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Cliente *</label>
            <select
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              value={form.clientId}
              onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientType === 'JURIDICO'
                    ? c.companyName
                    : `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo *</label>
            <select
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ActivityType }))}
            >
              {typeOptions.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Asunto *</label>
            <input
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Fecha programada</label>
            <input
              type="datetime-local"
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              value={form.scheduledFor}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledFor: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button isLoading={creating} onClick={createActivity}>Crear Actividad</Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Reagendar */}
      <Modal 
        isOpen={isRescheduleOpen} 
        onClose={() => setIsRescheduleOpen(false)} 
        title="Reagendar Actividad" 
        size="sm"
      >
        <div className="space-y-4">
          {activityToReschedule && (
            <div className="bg-gray-50 p-3 rounded-xl">
              <h4 className="font-medium text-gray-900">{activityToReschedule.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {activityToReschedule.client?.clientType === 'JURIDICO'
                  ? activityToReschedule.client?.companyName
                  : `${activityToReschedule.client?.firstName || ''} ${activityToReschedule.client?.lastName || ''}`.trim()}
              </p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-700">Nueva fecha y hora *</label>
            <input
              type="datetime-local"
              className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => setIsRescheduleOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              isLoading={rescheduling} 
              onClick={handleReschedule}
            >
              Reagendar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalle */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        title="Detalle de Actividad" 
        size="md"
      >
        {selectedActivity && (
          <div className="space-y-4">
            {/* Header con tipo de actividad */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {getActivityTypeInfo(selectedActivity.type).icon}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedActivity.title}
                </h3>
                <Badge variant="default" className="mt-1">
                  {getActivityTypeInfo(selectedActivity.type).label}
                </Badge>
              </div>
            </div>

            {/* Estado actual */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              <Badge 
                variant={
                  selectedActivity.status === 'COMPLETADA' ? 'success' : 
                  selectedActivity.status === 'CANCELADA' ? 'danger' : 'warning'
                }
              >
                {selectedActivity.status || 'PENDIENTE'}
              </Badge>
            </div>

            {/* Información del cliente */}
            <div className="bg-gray-50 p-3 rounded-xl">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cliente</h4>
              <p className="font-medium">
                {selectedActivity.client?.clientType === 'JURIDICO'
                  ? selectedActivity.client?.companyName
                  : `${selectedActivity.client?.firstName || ''} ${selectedActivity.client?.lastName || ''}`.trim()}
              </p>
            </div>

            {/* Descripción */}
            {selectedActivity.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Descripción</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-xl">
                  {selectedActivity.description}
                </p>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Fecha programada:</span>
                <p className="text-gray-600">
                  {selectedActivity.scheduledFor 
                    ? new Date(selectedActivity.scheduledFor).toLocaleString('es-VE')
                    : 'No programada'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fecha de creación:</span>
                <p className="text-gray-600">
                  {new Date(selectedActivity.createdAt).toLocaleString('es-VE')}
                </p>
              </div>
              {selectedActivity.user && (
                <div>
                  <span className="font-medium text-gray-700">Asignado a:</span>
                  <p className="text-gray-600">
                    {selectedActivity.user.firstName} {selectedActivity.user.lastName}
                  </p>
                </div>
              )}
            </div>

            {/* Acciones */}
            {selectedActivity.status === 'PENDIENTE' && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    markComplete(selectedActivity);
                    setIsDetailOpen(false);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar como Completada
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => {
                    setIsDetailOpen(false);
                    rescheduleTomorrow(selectedActivity);
                  }}
                >
                  <Clock className="w-4 h-4 mr-1" /> Reagendar
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  onClick={() => {
                    cancelActivity(selectedActivity);
                    setIsDetailOpen(false);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
