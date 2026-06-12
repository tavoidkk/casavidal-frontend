import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Star, Eye } from 'lucide-react';
import { clientsApi } from '../api/Clients.api'
import type { Client } from '../types';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ClientForm } from '../components/clients/ClientForm';
import { ClientDetailModal } from '../components/clients/ClientDetailModal';
import { staggerContainer, staggerItem } from '../utils/motion';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [clientForDetail, setClientForDetail] = useState<Client | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cargar clientes
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.getAll({
        search,
        category: categoryFilter,
        stage: stageFilter,
        source: sourceFilter,
        page: currentPage,
        limit: 10,
      });
      setClients(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search, categoryFilter, stageFilter, sourceFilter, currentPage]);

  // Crear/Editar cliente
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedClient) {
        await clientsApi.update(selectedClient.id, data);
      } else {
        await clientsApi.create(data);
      }
      setIsModalOpen(false);
      setSelectedClient(null);
      loadClients();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar cliente
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    
    try {
      await clientsApi.delete(id);
      loadClients();
    } catch (error) {
      alert('Error al eliminar cliente');
    }
  };

  // Obtener color del badge según categoría
  const getCategoryBadge = (category: string) => {
    const variants: any = {
      VIP: 'success',
      MAYORISTA: 'info',
      REGULAR: 'default',
      NUEVO: 'warning',
      INACTIVO: 'danger',
    };
    return <Badge variant={variants[category] || 'default'}>{category}</Badge>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona tu base de clientes</p>
        </div>
        <Button
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              />
            </div>
            </div>

            {/* Filtro por categoría */}
            <div className="w-full md:w-36">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              >
                <option value="">Categoría</option>
                <option value="VIP">VIP</option>
                <option value="MAYORISTA">Mayorista</option>
                <option value="REGULAR">Regular</option>
                <option value="NUEVO">Nuevo</option>
              </select>
            </div>

            {/* Filtro por etapa */}
            <div className="w-full md:w-32">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              >
                <option value="">Etapa</option>
                <option value="NUEVO">Nuevo</option>
                <option value="CONTACTADO">Contactado</option>
                <option value="COTIZACION">Cotización</option>
                <option value="GANADO">Ganado</option>
                <option value="PERDIDO">Perdido</option>
              </select>
            </div>

            {/* Filtro por origen */}
            <div className="w-full md:w-32">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              >
                <option value="">Origen</option>
                <option value="REFERIDO">Referido</option>
                <option value="REDES">Redes</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="VISITA">Visita</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>
        </Card>

      {/* Tabla de Clientes */}
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Cargando clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron clientes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Contacto
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">
                      Etapa
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">
                      Origen
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Compras
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Scoring
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                  {clients.map((client) => (
                    <motion.tr
                      key={client.id}
                      variants={staggerItem}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[220px]">
                          <p className="font-medium text-gray-900 truncate">
                            {client.clientType === 'NATURAL'
                              ? `${client.firstName} ${client.lastName}`
                              : client.companyName}
                          </p>
                          {client.document && (
                              <p className="text-xs text-gray-500 truncate">
                                {client.document}
                              </p>
                            )}
                          {client.rif && (
                            <p className="text-xs text-gray-500 truncate">{client.rif}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-sm truncate max-w-[160px]">
                          <p className="text-gray-900 truncate">{client.phone}</p>
                          {client.email && (
                            <p className="text-gray-500 truncate text-xs">{client.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {getCategoryBadge(client.category)}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <Badge variant={client.stage === 'GANADO' ? 'success' : client.stage === 'PERDIDO' ? 'danger' : 'warning'}>
                          {client.stage}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{client.source || '—'}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">
                            ${client.totalPurchases.toLocaleString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {client.purchaseCount} compras
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {client.scoring && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="font-medium">{client.scoring.score}</span>
                            <span className="text-gray-500 text-xs">/100</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setClientForDetail(client);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="md"
      >
        <ClientForm
          client={selectedClient}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedClient(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal de Detalle del Cliente con Timeline */}
      {clientForDetail && (
        <ClientDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setClientForDetail(null);
          }}
          client={clientForDetail}
        />
      )}
    </div>
  );
}
