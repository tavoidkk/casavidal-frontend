import { useState } from 'react';
import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { settingsApi } from '../../api/settings.api';

export default function ExportSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const blob = await settingsApi.exportData();
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `casavidal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Datos exportados exitosamente. El archivo se ha descargado.',
      });
    } catch (error: any) {
      console.error('Error al exportar:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al exportar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Download className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exportar Datos del Sistema
            </h3>
            <p className="text-gray-600 mb-6">
              Exporta todos los datos del sistema en formato JSON. Esto incluye configuración,
              clientes, productos, ventas, campañas y más. Puedes usar este archivo como respaldo
              o para migrar datos a otro sistema.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">
                ¿Qué se incluye en la exportación?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Configuración del sistema</li>
                <li>• Usuarios (sin contraseñas)</li>
                <li>• Clientes y scoring</li>
                <li>• Categorías de productos</li>
                <li>• Productos y proveedores</li>
                <li>• Ventas y campañas</li>
              </ul>
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <Button
              onClick={handleExport}
              loading={loading}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Exportar Datos
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
