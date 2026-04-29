import { useState } from 'react';
import { Settings, FolderTree, Upload, Download, Sliders, FileSpreadsheet } from 'lucide-react';
import { Card } from '../components/ui/Card';
import CategoriesSettings from '../components/settings/CategoriesSettings';
import GeneralSettings from '../components/settings/GeneralSettings';
import ImportSettings from '../components/settings/ImportSettings';
import ExportSettings from '../components/settings/ExportSettings';
import ExcelImportExport from '../components/settings/ExcelImportExport';

type SettingsTab = 'general' | 'categories' | 'excel' | 'import' | 'export';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    {
      id: 'general' as const,
      label: 'General',
      icon: Sliders,
      description: 'Configuración del sistema'
    },
    {
      id: 'categories' as const,
      label: 'Categorías',
      icon: FolderTree,
      description: 'Gestionar categorías de productos'
    },
    {
      id: 'excel' as const,
      label: 'Excel',
      icon: FileSpreadsheet,
      description: 'Importar/Exportar en Excel'
    },
    {
      id: 'import' as const,
      label: 'Importar JSON',
      icon: Upload,
      description: 'Importar datos desde JSON'
    },
    {
      id: 'export' as const,
      label: 'Exportar JSON',
      icon: Download,
      description: 'Exportar datos a JSON'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">Configuración</h1>
          <p className="text-gray-600 mt-1">Configurar y administrar el sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-700 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs text-gray-500">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Content */}
      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'categories' && <CategoriesSettings />}
        {activeTab === 'excel' && <ExcelImportExport />}
        {activeTab === 'import' && <ImportSettings />}
        {activeTab === 'export' && <ExportSettings />}
      </div>
    </div>
  );
}
