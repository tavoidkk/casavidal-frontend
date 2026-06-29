import { useState, useEffect, useRef } from 'react';
import { Building2, DollarSign, Package, Bell, Globe, RotateCcw, Save, Upload, X, Image, Calculator, RefreshCw, PenLine, Trash2 } from 'lucide-react';
import { settingsApi } from '../../api/settings.api';
import { useCurrencyStore } from '../../store/currency.store';
import type { Settings, Currency, UpdateSettingsInput } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SignaturePad, type SignaturePadHandle } from './SignaturePad';
import { clearSignatureCache } from '../../utils/pdfSignature';

export default function GeneralSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const loadRate = useCurrencyStore((s) => s.loadRate);

  const [form, setForm] = useState<UpdateSettingsInput>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [refreshingRate, setRefreshingRate] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'idle' | 'editing'>('idle');
  const [savingSignature, setSavingSignature] = useState(false);
  const [removingSignature, setRemovingSignature] = useState(false);
  const signaturePadRef = useRef<SignaturePadHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
      setForm({
        companyName: data.companyName,
        companyEmail: data.companyEmail || '',
        companyPhone: data.companyPhone || '',
        companyAddress: data.companyAddress || '',
        currency: data.currency,
        taxRate: data.taxRate,
        lowStockThreshold: data.lowStockThreshold,
        defaultPaymentTerm: data.defaultPaymentTerm,
        enableNotifications: data.enableNotifications,
        enableAutoBackup: data.enableAutoBackup,
        locale: data.locale,
        timezone: data.timezone,
        usdToBsRate: data.usdToBsRate ?? null,
      });
      if (data.companyLogo) {
        setLogoPreview(data.companyLogo);
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    const changed =
      form.companyName !== settings.companyName ||
      (form.companyEmail || '') !== (settings.companyEmail || '') ||
      (form.companyPhone || '') !== (settings.companyPhone || '') ||
      (form.companyAddress || '') !== (settings.companyAddress || '') ||
      form.currency !== settings.currency ||
      form.taxRate !== settings.taxRate ||
      form.lowStockThreshold !== settings.lowStockThreshold ||
      form.defaultPaymentTerm !== settings.defaultPaymentTerm ||
      form.enableNotifications !== settings.enableNotifications ||
      form.enableAutoBackup !== settings.enableAutoBackup ||
      form.locale !== settings.locale ||
      form.timezone !== settings.timezone ||
      form.usdToBsRate !== (settings.usdToBsRate ?? null) ||
      newLogo !== null ||
      removeLogo;

    setHasChanges(changed);
  }, [form, settings, newLogo, removeLogo]);

  const handleInputChange = (field: keyof UpdateSettingsInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 10 * 1024 * 1024) {
      showToast('error', 'La imagen no puede superar los 2 MB');
      return;
    }

    setNewLogo(file);
    setRemoveLogo(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setNewLogo(null);
    setRemoveLogo(true);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.companyName?.trim()) {
      showToast('error', 'El nombre de la empresa es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      let logoUrl: string | null | undefined = removeLogo ? null : settings?.companyLogo;

      if (newLogo) {
        logoUrl = await settingsApi.uploadLogo(newLogo);
      }

      const updated = await settingsApi.updateSettings({
        ...form,
        companyLogo: logoUrl,
      });
      setSettings(updated);
      setNewLogo(null);
      setRemoveLogo(false);
      setHasChanges(false);
      loadRate();
      showToast('success', 'Configuración guardada exitosamente');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      showToast('error', error.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de restaurar la configuración a los valores por defecto? Esta acción no se puede deshacer.')) {
      return;
    }

    setSubmitting(true);
    try {
      const reset = await settingsApi.resetToDefaults();
      setSettings(reset);
      setForm({
        companyName: reset.companyName,
        companyEmail: reset.companyEmail || '',
        companyPhone: reset.companyPhone || '',
        companyAddress: reset.companyAddress || '',
        currency: reset.currency,
        taxRate: reset.taxRate,
        lowStockThreshold: reset.lowStockThreshold,
        defaultPaymentTerm: reset.defaultPaymentTerm,
        enableNotifications: reset.enableNotifications,
        enableAutoBackup: reset.enableAutoBackup,
        locale: reset.locale,
        timezone: reset.timezone,
        usdToBsRate: reset.usdToBsRate ?? null,
      });
      setLogoPreview(reset.companyLogo || null);
      setNewLogo(null);
      setRemoveLogo(false);
      setHasChanges(false);
      showToast('success', 'Configuración restaurada a valores por defecto');
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      showToast('error', error.response?.data?.error || 'Error al restaurar la configuración');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshRate = async () => {
    setRefreshingRate(true);
    try {
      const result = await settingsApi.refreshRate();
      setForm(prev => ({ ...prev, usdToBsRate: result.usdToBsRate }));
      setSettings(prev =>
        prev ? { ...prev, usdToBsRate: result.usdToBsRate, usdToBsUpdatedAt: result.usdToBsUpdatedAt } : prev
      );
      setHasChanges(false);
      await loadRate();
      const formatted = result.usdToBsRate.toLocaleString('es-VE', { minimumFractionDigits: 4 });
      showToast('success', `Tasa actualizada desde BDV: 1 USD = Bs. ${formatted}`);
    } catch (error: any) {
      console.error('Error refreshing rate from BDV:', error);
      const message =
        error.response?.data?.error ||
        'No se pudo obtener la tasa del Banco de Venezuela. Puedes ingresarla manualmente.';
      showToast('error', message);
    } finally {
      setRefreshingRate(false);
    }
  };

  const handleSaveSignature = async () => {
    const pad = signaturePadRef.current;
    if (!pad || pad.isEmpty()) {
      showToast('error', 'Dibuja la firma antes de guardar');
      return;
    }
    setSavingSignature(true);
    try {
      const trimmedCanvas = pad.getTrimmedCanvas();
      const dataUrl = trimmedCanvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const url = await settingsApi.uploadSignature(blob);
      clearSignatureCache();
      setSettings(prev => (prev ? { ...prev, signatureUrl: url } : prev));
      setSignatureMode('idle');
      showToast('success', 'Firma digital guardada exitosamente');
    } catch (error: any) {
      console.error('Error saving signature:', error);
      showToast('error', error.response?.data?.error || 'Error al guardar la firma');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!confirm('¿Eliminar la firma digital guardada?')) return;
    setRemovingSignature(true);
    try {
      const updated = await settingsApi.removeSignature();
      setSettings(prev =>
        prev
          ? { ...prev, signatureUrl: updated.signatureUrl ?? null }
          : prev
      );
      clearSignatureCache();
      setSignatureMode('idle');
      showToast('success', 'Firma digital eliminada');
    } catch (error: any) {
      console.error('Error removing signature:', error);
      showToast('error', error.response?.data?.error || 'Error al eliminar la firma');
    } finally {
      setRemovingSignature(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'USD', label: 'Dólar Americano', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.message}
        </div>
      )}

      {/* Información de la Empresa */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                      onError={() => setLogoPreview(null)}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Image className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                </button>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG o WEBP (máx. 2MB)</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa *</label>
            <input
              type="text"
              value={form.companyName || ''}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Casa Vidal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
            <input
              type="email"
              value={form.companyEmail || ''}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="contacto@casavidal.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.companyPhone || ''}
              onChange={(e) => handleInputChange('companyPhone', e.target.value.replace(/[^0-9+\-() ]/g, ''))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.companyAddress || ''}
              onChange={(e) => handleInputChange('companyAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Av. Principal #123"
            />
          </div>
        </div>
      </Card>

      {/* Firma Digital */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <PenLine className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Firma Digital</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Se incluirá automáticamente al final de las cotizaciones y órdenes de compra que se envían.
        </p>

        {settings?.signatureUrl && signatureMode === 'idle' ? (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg bg-white p-4 flex flex-col items-center">
              <img
                src={`${settings.signatureUrl}?v=${Date.now()}`}
                alt="Firma digital"
                className="max-h-32 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="w-48 border-t border-gray-300 mt-2" />
              <p className="text-xs text-gray-500 mt-1">Firma Autorizada</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setSignatureMode('editing');
                  setTimeout(() => signaturePadRef.current?.clear(), 0);
                }}
                disabled={savingSignature || removingSignature}
              >
                <PenLine className="w-4 h-4 mr-2" />
                Reemplazar
              </Button>
              <Button
                variant="secondary"
                onClick={handleRemoveSignature}
                disabled={savingSignature || removingSignature}
                isLoading={removingSignature}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <SignaturePad ref={signaturePadRef} />
            <p className="text-xs text-gray-500">
              Dibuja tu firma con el mouse o el dedo en el recuadro.
            </p>
            <div className="flex gap-2 justify-end">
              {settings?.signatureUrl && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    signaturePadRef.current?.clear();
                    setSignatureMode('idle');
                  }}
                  disabled={savingSignature}
                >
                  Cancelar
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => signaturePadRef.current?.clear()}
                disabled={savingSignature}
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
              <Button onClick={handleSaveSignature} disabled={savingSignature} isLoading={savingSignature}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Firma
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Configuración Financiera */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración Financiera</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => handleInputChange('currency', e.target.value as Currency)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {currencies.map(curr => (
                <option key={curr.value} value={curr.value}>
                  {curr.symbol} {curr.label} ({curr.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasa de Impuesto (%)</label>
            <input
              type="number"
              value={form.taxRate}
              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.01"
              placeholder="19.00"
            />
            <p className="text-xs text-gray-500 mt-1">IVA o impuesto aplicable</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plazo de Pago (días)</label>
            <input
              type="number"
              value={form.defaultPaymentTerm}
              onChange={(e) => handleInputChange('defaultPaymentTerm', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              step="1"
              placeholder="30"
            />
            <p className="text-xs text-gray-500 mt-1">Plazo por defecto para pagos</p>
          </div>
        </div>
      </Card>

      {/* Tasa de Cambio USD -> Bs */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tasa de Cambio USD → Bs</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Esta tasa se usa para mostrar precios en bolívares junto a los precios en USD.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasa del Día (Bs/USD)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={form.usdToBsRate ?? ''}
                onChange={(e) => handleInputChange('usdToBsRate', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: 40.50"
              />
              <button
                type="button"
                onClick={() => handleInputChange('usdToBsRate', null)}
                className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg hover:bg-red-50"
                title="Limpiar tasa"
                disabled={refreshingRate}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleRefreshRate}
              disabled={refreshingRate || submitting}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingRate ? 'animate-spin' : ''}`} />
              {refreshingRate ? 'Obteniendo tasa...' : 'Actualizar tasa'}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
            <p className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
              {settings?.usdToBsUpdatedAt
                ? new Date(settings.usdToBsUpdatedAt).toLocaleDateString('es-VE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vista Previa</label>
            <p className="px-3 py-2 text-sm font-semibold text-primary-700 border border-primary-200 rounded-lg bg-primary-50">
              {form.usdToBsRate
                ? `1 USD = Bs. ${form.usdToBsRate.toLocaleString('es-VE', { minimumFractionDigits: 4 })}`
                : 'Tasa no configurada'}
            </p>
          </div>
        </div>
      </Card>

      {/* Configuración de Inventario */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración de Inventario</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Umbral de Stock Bajo</label>
            <input
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
              step="1"
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1">Cantidad mínima antes de mostrar alerta de stock bajo</p>
          </div>
        </div>
      </Card>

      {/* Configuración de Sistema */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notificaciones y Sistema</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enableNotifications}
              onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-gray-900">Habilitar Notificaciones</div>
              <div className="text-sm text-gray-500">Recibir notificaciones sobre ventas, stock bajo, pedidos, etc.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enableAutoBackup}
              onChange={(e) => handleInputChange('enableAutoBackup', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <div className="font-medium text-gray-900">Respaldos Automáticos</div>
              <div className="text-sm text-gray-500">Crear respaldos automáticos de la base de datos periódicamente</div>
            </div>
          </label>
        </div>
      </Card>

      {/* Localización */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Localización</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idioma/Región</label>
            <select
              value={form.locale}
              onChange={(e) => handleInputChange('locale', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="es-CL">Español (Chile)</option>
              <option value="es-MX">Español (México)</option>
              <option value="es-AR">Español (Argentina)</option>
              <option value="es-CO">Español (Colombia)</option>
              <option value="es-PE">Español (Perú)</option>
              <option value="en-US">English (United States)</option>
              <option value="pt-BR">Português (Brasil)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
            <select
              value={form.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="America/Santiago">América/Santiago (Chile)</option>
              <option value="America/Mexico_City">América/Ciudad de México</option>
              <option value="America/Argentina/Buenos_Aires">América/Buenos Aires</option>
              <option value="America/Bogota">América/Bogotá</option>
              <option value="America/Lima">América/Lima</option>
              <option value="America/New_York">América/Nueva York</option>
              <option value="America/Sao_Paulo">América/São Paulo</option>
              <option value="Europe/Madrid">Europa/Madrid</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Botones de acción */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="secondary" onClick={handleReset} disabled={submitting}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar por Defecto
        </Button>

        <Button onClick={handleSave} disabled={!hasChanges || submitting} isLoading={submitting}>
          {submitting ? 'Guardando...' : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {hasChanges && (
        <div className="text-sm text-amber-600 text-center">⚠️ Tienes cambios sin guardar</div>
      )}
    </div>
  );
}