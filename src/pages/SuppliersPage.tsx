import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Truck, Pencil, Trash2, X } from 'lucide-react';
import { suppliersApi, type Supplier, type CreateSupplierInput } from '../api/suppliers.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth.store';

const EMPTY_FORM: CreateSupplierInput = {
  name: '',
  rif: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function SuppliersPage() {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'VENDEDOR';
  const isAdmin = user?.role === 'ADMIN';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<CreateSupplierInput>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.getAll({ search: search || undefined, page: currentPage, limit: 20 });
      setSuppliers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      rif: supplier.rif || '',
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload: CreateSupplierInput = {
        name: form.name.trim(),
        rif: form.rif?.trim() || undefined,
        contactName: form.contactName?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        address: form.address?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

      if (editing) {
        await suppliersApi.update(editing.id, payload);
      } else {
        await suppliersApi.create(payload);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Error al guardar proveedor';
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`¿Eliminar a "${supplier.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await suppliersApi.remove(supplier.id);
      loadSuppliers();
    } catch {
      alert('Error al eliminar proveedor');
    }
  };

  const setField = (field: keyof CreateSupplierInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">{totalItems} proveedor{totalItems !== 1 ? 'es' : ''} registrado{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Búsqueda */}
      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, RIF o contacto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            <p className="mt-4 text-gray-600">Cargando proveedores...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No se encontraron proveedores</p>
            {canEdit && (
              <Button className="mt-4" onClick={openCreate}>
                Agregar primer proveedor
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">RIF</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contacto</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono">{s.rif || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{s.contactName || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{s.phone || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{s.email || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(s)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                  <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
        <div className="space-y-4">
          {errors.submit && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <X className="w-4 h-4 shrink-0" />
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nombre *"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                error={errors.name}
                placeholder="Distribuidora Ejemplo C.A."
              />
            </div>
            <Input
              label="RIF"
              value={form.rif || ''}
              onChange={(e) => setField('rif', e.target.value)}
              placeholder="J-12345678-9"
            />
            <Input
              label="Teléfono"
              value={form.phone || ''}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="0412-1234567"
            />
            <Input
              label="Persona de contacto"
              value={form.contactName || ''}
              onChange={(e) => setField('contactName', e.target.value)}
              placeholder="Juan Pérez"
            />
            <Input
              label="Email"
              type="email"
              value={form.email || ''}
              onChange={(e) => setField('email', e.target.value)}
              error={errors.email}
              placeholder="contacto@empresa.com"
            />
            <div className="col-span-2">
              <Input
                label="Dirección"
                value={form.address || ''}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Av. Principal, Local 5, Maracaibo"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setField('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Condiciones de pago, tiempo de entrega, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editing ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
