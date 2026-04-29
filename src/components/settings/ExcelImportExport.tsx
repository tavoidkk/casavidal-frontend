import { useState, useRef } from 'react';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { excelApi } from '../../api/excel.api';

type ImportType = 'products' | 'clients' | 'suppliers';

export default function ExcelImportExport() {
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<ImportType>('products');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(file.type)) {
        setMessage({
          type: 'error',
          text: 'Por favor selecciona un archivo Excel válido (.xlsx o .xls)',
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

  const handleExport = async (type: ImportType) => {
    setLoading(true);
    setMessage(null);

    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'products':
          blob = await excelApi.exportProducts();
          filename = `productos-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'clients':
          blob = await excelApi.exportClients();
          filename = `clientes-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'suppliers':
          blob = await excelApi.exportSuppliers();
          filename = `proveedores-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Archivo exportado exitosamente: ${filename}`,
      });
    } catch (error: any) {
      console.error('Error al exportar:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al exportar el archivo',
      });
    } finally {
      setLoading(false);
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
      let result: any;

      switch (importType) {
        case 'products':
          result = await excelApi.importProducts(selectedFile);
          break;
        case 'clients':
          result = await excelApi.importClients(selectedFile);
          break;
        case 'suppliers':
          result = await excelApi.importSuppliers(selectedFile);
          break;
      }

      setImportResults(result);
      setMessage({
        type: 'success',
        text: `Importación completada: ${result.success} de ${result.total} registros importados`,
      });

      handleRemoveFile();
    } catch (error: any) {
      console.error('Error al importar:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al importar el archivo',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = (type: ImportType) => {
    switch (type) {
      case 'products':
        return 'Productos';
      case 'clients':
        return 'Clientes';
      case 'suppliers':
        return 'Proveedores';
    }
  };

  return (
    <div className="space-y-6">
      {/* Exportar */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Exportar a Excel
              </h3>
              <p className="text-gray-600 mb-4">
                Descarga los datos en formato Excel (.xlsx) para editar o analizar externamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleExport('products')}
                  isLoading={loading}
                  variant="ghost"
                  className="w-full"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Productos
                </Button>
                <Button
                  onClick={() => handleExport('clients')}
                  isLoading={loading}
                  variant="ghost"
                  className="w-full"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Clientes
                </Button>
                <Button
                  onClick={() => handleExport('suppliers')}
                  isLoading={loading}
                  variant="ghost"
                  className="w-full"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Proveedores
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Importar */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-secondary-100 rounded-xl">
              <Upload className="w-6 h-6 text-secondary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Importar desde Excel
              </h3>
              <p className="text-gray-600 mb-4">
                Carga datos masivamente desde un archivo Excel. Primero exporta para obtener el formato correcto.
              </p>

              {/* Selector de tipo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de importación
                </label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as ImportType)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                >
                  <option value="products">Productos</option>
                  <option value="clients">Clientes</option>
                  <option value="suppliers">Proveedores</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Importante
                </h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Exporta primero para obtener el formato correcto</li>
                  <li>• Los registros existentes se actualizarán</li>
                  <li>• Se recomienda hacer un respaldo antes de importar</li>
                  <li>• Solo se permiten archivos Excel (.xlsx, .xls)</li>
                </ul>
              </div>

              {/* File selector */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-import-file"
                />
                <label
                  htmlFor="excel-import-file"
                  className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-600">
                    Haz clic para seleccionar un archivo Excel
                  </span>
                </label>
              </div>

              {/* Selected file */}
              {selectedFile && (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
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
                <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 mb-4">
                  <h4 className="font-medium text-secondary-900 mb-2">
                    Resultados de la importación de {getTypeName(importType)}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-secondary-700">Total procesados:</span>
                      <span className="ml-2 font-medium text-secondary-900">{importResults.total}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Exitosos:</span>
                      <span className="ml-2 font-medium text-green-900">{importResults.success}</span>
                    </div>
                    <div>
                      <span className="text-red-700">Con errores:</span>
                      <span className="ml-2 font-medium text-red-900">{importResults.errors?.length || 0}</span>
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
                Importar {getTypeName(importType)}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
