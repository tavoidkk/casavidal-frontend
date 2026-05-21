import { useEffect, useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { PlusCircle, RefreshCcw, Settings, CloudDownload, Clock, User, MapPin, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { calendarEventsApi } from '../api/calendarEvents.api';
import { eventTypesApi } from '../api/eventTypes.api';
import { bookingSettingsApi } from '../api/bookingSettings.api';
import { clientsApi } from '../api/Clients.api';
import { googleCalendarApi } from '../api/googleCalendar.api';
import type {
  BookingSettings,
  CalendarEvent,
  CalendarEventCategory,
  CalendarEventCreate,
  Client,
  EventType,
} from '../types';

type EventFormState = {
  category: CalendarEventCategory;
  title: string;
  startDate: string;
  allDay: boolean;
  clientId: string;
  eventTypeId: string;
};

const emptyForm: EventFormState = {
  category: 'TAREA',
  title: '',
  startDate: '',
  allDay: false,
  clientId: '',
  eventTypeId: '',
};

const toDateTimeInputValue = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const dayLabels = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miercoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sabado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<View>('week');

  const [filters, setFilters] = useState({
    eventTypeId: '',
    clientId: '',
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEventTypeOpen, setIsEventTypeOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isGoogleOpen, setIsGoogleOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#2563eb');
  const [newTypeDuration, setNewTypeDuration] = useState(30);
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean }>({ connected: false });
  const [googleForm, setGoogleForm] = useState({
    calendarId: 'primary',
    timeMin: '',
    timeMax: '',
  });
  const [googleBusy, setGoogleBusy] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
    setIsDetailOpen(true);
  };

  const handleCompleteEvent = async () => {
    if (!selectedEvent) return;
    setDetailLoading(true);
    try {
      await calendarEventsApi.update(selectedEvent.id, { status: 'COMPLETADA' });
      setIsDetailOpen(false);
      setSelectedEvent(null);
      await fetchEvents();
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setDetailLoading(true);
    try {
      await calendarEventsApi.remove(selectedEvent.id);
      setIsDetailOpen(false);
      setSelectedEvent(null);
      await fetchEvents();
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchBaseData = async () => {
    const [types, clientsResponse, settings] = await Promise.all([
      eventTypesApi.getAll(),
      clientsApi.getAll({ page: 1, limit: 200 }).then((res) => res.data),
      bookingSettingsApi.get(),
    ]);
    setEventTypes(types);
    setClients(clientsResponse);
    setBookingSettings(settings);
    const status = await googleCalendarApi.status();
    setGoogleStatus(status);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await calendarEventsApi.getAll({
        eventTypeId: filters.eventTypeId || undefined,
        clientId: filters.clientId || undefined,
      });
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      googleCalendarApi.status().then(setGoogleStatus).catch(() => null);
    }
  }, []);


  const handleCreateEvent = async () => {
    if (!form.title || !form.startDate) {
      return;
    }
    if (!form.clientId) {
      return;
    }
    setSaving(true);
    try {
      const payload: CalendarEventCreate = {
        title: form.title,
        category: form.category,
        startDate: form.startDate,
        allDay: form.allDay,
        clientId: form.clientId,
        eventTypeId: form.eventTypeId || undefined,
      };
      await calendarEventsApi.create(payload);
      setIsCreateOpen(false);
      setForm(emptyForm);
      await fetchEvents();
    } finally {
      setSaving(false);
    }
  };

  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      allDay: event.allDay,
      resource: event,
    }));
  }, [events]);

  const bookingStep = useMemo(() => {
    return bookingSettings?.intervalMinutes ?? 30;
  }, [bookingSettings]);


  const handleCreateEventType = async () => {
    if (!newTypeName.trim()) {
      return;
    }
    const created = await eventTypesApi.create({
      name: newTypeName.trim(),
      color: newTypeColor,
      defaultDurationMinutes: newTypeDuration,
    });
    setEventTypes((prev) => [...prev, created]);
    setNewTypeName('');
    setNewTypeColor('#2563eb');
    setNewTypeDuration(30);
  };


  const handleUpdateBookingSettings = async () => {
    if (!bookingSettings) {
      return;
    }
    const updated = await bookingSettingsApi.update(bookingSettings);
    setBookingSettings(updated);
    setIsSettingsOpen(false);
  };

  const handleSelectSlot = (info: { start: Date; end: Date }) => {
    const defaultMinutes = bookingSettings?.intervalMinutes ?? 30;
    const end = new Date(info.start.getTime() + defaultMinutes * 60 * 1000);
    setForm((prev) => ({
      ...prev,
      startDate: toDateTimeInputValue(info.start),
      endDate: toDateTimeInputValue(end),
    }));
    setIsCreateOpen(true);
  };

  const localizer = useMemo(() => {
    return dateFnsLocalizer({
      format,
      parse,
      startOfWeek,
      getDay,
      locales: {},
    });
  }, []);

  const handleImportGoogleEvents = async () => {
    setGoogleBusy(true);
    try {
      const params: { calendarId?: string; timeMin?: string; timeMax?: string } = {};
      if (googleForm.calendarId) params.calendarId = googleForm.calendarId;
      if (googleForm.timeMin) params.timeMin = new Date(googleForm.timeMin).toISOString();
      if (googleForm.timeMax) params.timeMax = new Date(googleForm.timeMax).toISOString();
      await googleCalendarApi.importEvents(params);
      await fetchEvents();
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEventResize = (resizeType: string, data: { event: { id: string; start: Date; end: Date } }) => {
    const { event } = data;
    if (!event.id) return;
    calendarEventsApi.update(event.id, {
      startDate: event.start.toISOString(),
      endDate: event.end.toISOString(),
    }).then(() => fetchEvents()).catch(() => null);
  };

  const handleStartOAuth = async () => {
    setGoogleBusy(true);
    try {
      const { url } = await googleCalendarApi.connect();
      window.open(url, '_blank', 'width=520,height=700');
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">Calendario</h1>
          <p className="text-gray-600 mt-1">Vista visual de tareas y agendas pendientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fetchEvents()}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
          <div className="relative">
            <Button variant="secondary" onClick={() => setIsOptionsOpen((prev) => !prev)}>
              <Settings className="w-4 h-4 mr-2" /> Opciones
            </Button>
            {isOptionsOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg z-20">
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsOptionsOpen(false);
                  }}
                >
                  Booking settings
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsEventTypeOpen(true);
                    setIsOptionsOpen(false);
                  }}
                >
                  Manage event types
                </button>
                <button
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsGoogleOpen(true);
                    setIsOptionsOpen(false);
                  }}
                >
                  Google Calendar
                </button>
              </div>
            )}
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> Nuevo evento
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            options={[{ value: '', label: 'Todos los tipos' }, ...eventTypes.map((t) => ({ value: t.id, label: t.name }))]}
            value={filters.eventTypeId}
            onChange={(e) => setFilters((prev) => ({ ...prev, eventTypeId: e.target.value }))}
          />
          <Select
            options={[{ value: '', label: 'Todos los clientes' }, ...clients.map((c) => ({ value: c.id, label: c.clientType === 'JURIDICO' ? c.companyName || 'Sin nombre' : `${c.firstName || ''} ${c.lastName || ''}`.trim() }))]}
            value={filters.clientId}
            onChange={(e) => setFilters((prev) => ({ ...prev, clientId: e.target.value }))}
          />
        </div>
      </Card>

      <Card className="calendar-shell">
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          views={['day', 'week', 'month']}
          view={calendarView}
          onView={(view) => setCalendarView(view)}
          selectable
          resizable
          onSelectSlot={(slot) => handleSelectSlot({ start: slot.start as Date, end: slot.end as Date })}
          onSelectEvent={handleSelectEvent}
          onEventResize={handleEventResize}
          step={bookingStep}
          timeslots={2}
          min={bookingSettings ? new Date(`2000-01-01T${bookingSettings.startTime}:00`) : undefined}
          max={bookingSettings ? new Date(`2000-01-01T${bookingSettings.endTime}:00`) : undefined}
          style={{ height: 720 }}
        />
        {loading && <p className="text-sm text-gray-500 mt-3">Cargando eventos...</p>}
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Evento" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition ${form.category === 'TAREA' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
                onClick={() => setForm((prev) => ({ ...prev, category: 'TAREA' }))}
              >
                Tarea
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition ${form.category === 'AGENDA' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
                onClick={() => setForm((prev) => ({ ...prev, category: 'AGENDA' }))}
              >
                Agendar
              </button>
            </div>
          </div>
          <Select
            label="Cliente *"
            options={[{ value: '', label: 'Selecciona cliente' }, ...clients.map((c) => ({ value: c.id, label: c.clientType === 'JURIDICO' ? c.companyName || 'Sin nombre' : `${c.firstName || ''} ${c.lastName || ''}`.trim() }))]}
            value={form.clientId}
            onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
          />
          <Select
            label="Tipo de evento"
            options={[{ value: '', label: 'Sin tipo' }, ...eventTypes.map((t) => ({ value: t.id, label: t.name }))]}
            value={form.eventTypeId}
            onChange={(e) => setForm((prev) => ({ ...prev, eventTypeId: e.target.value }))}
          />
          <Input
            label="Titulo *"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <Input
            label="Fecha inicio *"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button isLoading={saving} onClick={handleCreateEvent}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Booking Settings" size="md">
        {bookingSettings && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dias laborales</label>
              <div className="grid grid-cols-2 gap-2">
                {dayLabels.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={bookingSettings.workDays.includes(day.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...bookingSettings.workDays, day.value]
                          : bookingSettings.workDays.filter((d) => d !== day.value);
                        setBookingSettings((prev) => prev ? { ...prev, workDays: next } : prev);
                      }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Hora inicio"
                type="time"
                value={bookingSettings.startTime}
                onChange={(e) => setBookingSettings((prev) => prev ? { ...prev, startTime: e.target.value } : prev)}
              />
              <Input
                label="Hora fin"
                type="time"
                value={bookingSettings.endTime}
                onChange={(e) => setBookingSettings((prev) => prev ? { ...prev, endTime: e.target.value } : prev)}
              />
            </div>
            <Input
              label="Intervalo (minutos)"
              type="number"
              min={5}
              value={bookingSettings.intervalMinutes}
              onChange={(e) => setBookingSettings((prev) => prev ? { ...prev, intervalMinutes: Number(e.target.value) } : prev)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                value={bookingSettings.timezone}
                onChange={(e) => setBookingSettings((prev) => prev ? { ...prev, timezone: e.target.value } : prev)}
              >
                <option value="America/Caracas">Caracas (GMT-4)</option>
                <option value="America/Santiago">Santiago (GMT-3)</option>
                <option value="America/Mexico_City">Ciudad de Mexico (GMT-6)</option>
                <option value="America/Bogota">Bogota (GMT-5)</option>
                <option value="America/Lima">Lima (GMT-5)</option>
                <option value="America/La_Paz">La Paz (GMT-4)</option>
                <option value="America/Guayaquil">Guayaquil (GMT-5)</option>
                <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                <option value="America/Miami">Miami (GMT-4)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateBookingSettings}>Guardar</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEventTypeOpen} onClose={() => setIsEventTypeOpen(false)} title="Manage Event Types" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Nombre" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
            <Input label="Color" type="color" value={newTypeColor} onChange={(e) => setNewTypeColor(e.target.value)} />
            <Input
              label="Duracion"
              type="number"
              min={5}
              value={newTypeDuration}
              onChange={(e) => setNewTypeDuration(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateEventType}>Agregar tipo</Button>
          </div>
          <div className="space-y-2">
            {eventTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: type.color }} />
                  <span className="text-sm font-medium text-gray-700">{type.name}</span>
                </div>
                <span className="text-xs text-gray-500">{type.defaultDurationMinutes} min</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>


      <Modal isOpen={isGoogleOpen} onClose={() => setIsGoogleOpen(false)} title="Google Calendar" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700">Estado: {googleStatus.connected ? 'Conectado' : 'No conectado'}</p>
            <p className="text-xs text-gray-500">Importacion unidireccional desde Google Calendar.</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Conexion OAuth</p>
              <p className="text-xs text-gray-500">Conecta tu cuenta Google para importar eventos.</p>
            </div>
            <Button variant="secondary" onClick={handleStartOAuth} isLoading={googleBusy}>
              Conectar Google
            </Button>
          </div>
          <Input
            label="Calendar ID"
            value={googleForm.calendarId}
            onChange={(e) => setGoogleForm((prev) => ({ ...prev, calendarId: e.target.value }))}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Desde"
              type="datetime-local"
              value={googleForm.timeMin}
              onChange={(e) => setGoogleForm((prev) => ({ ...prev, timeMin: e.target.value }))}
            />
            <Input
              label="Hasta"
              type="datetime-local"
              value={googleForm.timeMax}
              onChange={(e) => setGoogleForm((prev) => ({ ...prev, timeMax: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleImportGoogleEvents} isLoading={googleBusy}>
              Importar eventos
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedEvent(null); }} title={selectedEvent?.title || 'Detalle del evento'} size="md">
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedEvent.category === 'TAREA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {selectedEvent.category === 'TAREA' ? 'Tarea' : 'Agenda'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedEvent.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                selectedEvent.status === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedEvent.status === 'PENDIENTE' ? 'Pendiente' :
                 selectedEvent.status === 'COMPLETADA' ? 'Completada' : 'Cancelada'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedEvent.source === 'LOCAL' ? 'bg-gray-100 text-gray-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {selectedEvent.source}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(selectedEvent.startDate), 'dd MMM yyyy HH:mm')} — {format(new Date(selectedEvent.endDate), 'HH:mm')}
                </span>
              </div>

              {selectedEvent.client && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>
                    {selectedEvent.client.clientType === 'JURIDICO'
                      ? selectedEvent.client.companyName
                      : `${selectedEvent.client.firstName || ''} ${selectedEvent.client.lastName || ''}`.trim()}
                  </span>
                </div>
              )}

              {selectedEvent.assignedTo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{selectedEvent.assignedTo.firstName} {selectedEvent.assignedTo.lastName}</span>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4" />
                  Descripción
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                {selectedEvent.status === 'PENDIENTE' && (
                  <Button isLoading={detailLoading} onClick={handleCompleteEvent}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar completada
                  </Button>
                )}
                <Button variant="danger" isLoading={detailLoading} onClick={handleDeleteEvent}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </div>
              <Button variant="secondary" onClick={() => { setIsDetailOpen(false); setSelectedEvent(null); }}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
