import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileJson, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { settingsApi } from '../../api/settings.api';

export default function ImportSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setMessage({
          type: 'error',
          text: 'Por favor selecciona un archivo JSON válido',
        });
        return;
      }
      setSelectedFile(file);
      setMessage(null);
      setImportResults(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMessage(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage({
        type: 'error',
        text: 'Por favor selecciona un archivo para importar',
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    setImportResults(null);

    try {
      // Leer el archivo JSON
      const fileContent = await selectedFile.text();
      const jsonData = JSON.parse(fileContent);

      // Validar estructura básica
      if (!jsonData.version || !jsonData.data) {
        throw new Error('Formato de archivo inválido');
      }

      // Enviar al backend
      const result = await settingsApi.importData(jsonData);

      setImportResults(result.results);
      setMessage({
        type: 'success',
        text: result.message || 'Datos importados exitosamente',
      });

      // Limpiar archivo seleccionado
      handleRemoveFile();
    } catch (error: any) {
      console.error('Error al importar:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Error al importar los datos',
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
            <Upload className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Importar Datos al Sistema
            </h3>
            <p className="text-gray-600 mb-6">
              Importa datos desde un archivo de respaldo previamente exportado. Esta acción
              actualizará o creará registros según el contenido del archivo.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Importante
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Esta acción puede sobrescribir datos existentes</li>
                <li>• Se recomienda hacer un respaldo antes de importar</li>
                <li>• Solo usa archivos exportados desde Casa Vidal</li>
                <li>• Los usuarios importados no incluyen contraseñas</li>
              </ul>
            </div>

            {/* File selector */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors"
              >
                <FileJson className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600">
                  Haz clic para seleccionar un archivo JSON
                </span>
              </label>
            </div>

            {/* Selected file */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <FileJson className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Message */}
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

            {/* Import results */}
            {importResults && (
              <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-secondary-900 mb-2">Resultados de la importación</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-700">Configuración:</span>
                    <span className="ml-2 font-medium text-secondary-900">{importResults.settings}</span>
                  </div>
                  <div>
                    <span className="text-secondary-700">Clientes:</span>
                    <span className="ml-2 font-medium text-secondary-900">{importResults.clients}</span>
                  </div>
                  <div>
                    <span className="text-secondary-700">Categorías:</span>
                    <span className="ml-2 font-medium text-secondary-900">{importResults.categories}</span>
                  </div>
                  <div>
                    <span className="text-secondary-700">Productos:</span>
                    <span className="ml-2 font-medium text-secondary-900">{importResults.products}</span>
                  </div>
                  <div>
                    <span className="text-secondary-700">Proveedores:</span>
                    <span className="ml-2 font-medium text-secondary-900">{importResults.suppliers}</span>
                  </div>
                </div>
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-amber-900 mb-2">Errores encontrados:</p>
                    <ul className="text-xs text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                      {importResults.errors.map((error: string, index: number) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleImport}
              isLoading={loading}
              disabled={!selectedFile}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              Importar Datos
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
