import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { categoriesApi, type Category, type CreateCategoryInput } from '../../api/categories.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

export default function CategoriesSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  // Estados para modal de crear/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados del formulario
  const [form, setForm] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    icon: '',
  });

  // Toast/mensaje
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = showInactive 
        ? await categoriesApi.getAllWithInactive()
        : await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('error', 'Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [showInactive]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', icon: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('error', 'El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Actualizar
        await categoriesApi.update(editingCategory.id, {
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          icon: form.icon?.trim() || undefined,
        });
        showToast('success', 'Categoría actualizada correctamente');
      } else {
        // Crear
        await categoriesApi.create({
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          icon: form.icon?.trim() || undefined,
        });
        showToast('success', 'Categoría creada correctamente');
      }
      
      setIsModalOpen(false);
      loadCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al guardar la categoría';
      showToast('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesApi.delete(category.id);
      showToast('success', 'Categoría eliminada correctamente');
      loadCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al eliminar la categoría';
      showToast('error', errorMessage);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await categoriesApi.update(category.id, { isActive: !category.isActive });
      showToast('success', 
        category.isActive 
          ? 'Categoría desactivada correctamente' 
          : 'Categoría activada correctamente'
      );
      loadCategories();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al cambiar el estado';
      showToast('error', errorMessage);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestión de Categorías
            </h2>
            <p className="text-gray-600 mt-1">
              Administra las categorías de productos del sistema
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Solo Activas
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Ver Todas
                </>
              )}
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de categorías */}
      <Card>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay categorías disponibles</p>
            <Button className="mt-4" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Categoría
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Descripción
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Icono
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Productos
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {category.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {category.icon ? (
                        <span className="text-xl">{category.icon}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium">
                        {category._count?.products || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={category.isActive ? 'success' : 'danger'}
                      >
                        {category.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={category.isActive ? 'secondary' : 'primary'}
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        {!category.isActive && (category._count?.products || 0) === 0 && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Herramientas"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción de la categoría..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Icono (Emoji)
            </label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.icon}
              onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="🔧"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes usar cualquier emoji como icono
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              isLoading={submitting}
              onClick={handleSubmit}
            >
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}