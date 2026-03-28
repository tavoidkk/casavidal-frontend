import { Phone, Mail, Calendar, Users, ShoppingCart, Package, FileText, Clock } from 'lucide-react';
import type { Activity, ActivityType } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
}

const getIconAndColor = (type: ActivityType) => {
  switch (type) {
    case 'LLAMADA':
      return { Icon: Phone, color: 'bg-blue-500' };
    case 'EMAIL':
      return { Icon: Mail, color: 'bg-green-500' };
    case 'REUNION':
      return { Icon: Users, color: 'bg-purple-500' };
    case 'SEGUIMIENTO':
      return { Icon: Calendar, color: 'bg-amber-500' };
    case 'TAREA':
      return { Icon: ShoppingCart, color: 'bg-emerald-500' };
    case 'NOTA':
      return { Icon: Package, color: 'bg-indigo-500' };
    default:
      return { Icon: FileText, color: 'bg-gray-500' };
  }
};

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No hay actividades registradas</p>
        <p className="text-sm text-gray-400 mt-1">
          Las actividades aparecerán aquí cuando se registren interacciones con el cliente
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical del timeline */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Lista de actividades */}
      <div className="space-y-6">
        {activities.map((activity) => {
          const { Icon, color } = getIconAndColor(activity.type);
          const userName = `${activity.user.firstName} ${activity.user.lastName}`;

          return (
            <div key={activity.id} className="relative flex items-start gap-4">
              {/* Icono */}
              <div className={`relative z-10 ${color} p-2 rounded-full flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>

              {/* Contenido */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-xs text-gray-500">
                      {userName} · {activity.user.role}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>

                {activity.description && (
                  <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                )}

                {activity.scheduledFor && (
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Programado para:{' '}
                      {new Date(activity.scheduledFor).toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
