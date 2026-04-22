import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { clientsApi } from '../../api/Clients.api';
import { useQuotationStore } from '../../store/quotations.store';
import type { Client } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';

interface ClientSelectorProps {
  onClientSelected?: () => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({ onClientSelected }) => {
  const { selectedClient, setSelectedClient } = useQuotationStore();
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    document: '', // Cédula o RIF
    phone: '',
    email: '',
    address: '',
  });

  // Cargar clientes al montar o cambiar búsqueda
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const response = await clientsApi.getAll({
          search: search || undefined,
          limit: 20,
        });
        setClients(response.data);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadClients, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectClient = (client: Client) => {
    const name = client.clientType === 'JURIDICO' 
      ? client.companyName || 'Sin nombre' 
      : `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre';
    
    setSelectedClient({
      id: client.id,
      name,
      phone: client.phone,
      email: client.email,
      document: client.document || client.rif || '',
      clientType: client.clientType,
    });
    onClientSelected?.();
  };

  const handleCreateClient = async () => {
    if (!newClient.firstName || !newClient.phone) {
      alert('Por favor completa nombre y teléfono');
      return;
    }

    try {
      const created = await clientsApi.create({
        clientType: 'NATURAL',
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        document: newClient.document || undefined,
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address || 'N/A',
      });

      const name = `${newClient.firstName} ${newClient.lastName}`.trim();
      setSelectedClient({
        id: created.id,
        name,
        phone: created.phone,
        email: created.email,
        document: newClient.document,
        clientType: 'NATURAL',
      });

      setIsCreateOpen(false);
      setNewClient({
        firstName: '',
        lastName: '',
        document: '',
        phone: '',
        email: '',
        address: '',
      });
      onClientSelected?.();
    } catch (error) {
      alert('Error al crear cliente');
      console.error(error);
    }
  };

  const getClientDisplayName = (client: Client): string => {
    if (client.clientType === 'JURIDICO') {
      return client.companyName || 'Sin nombre';
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre';
  };

  const getClientDocument = (client: Client): string => {
    return client.document || client.rif || '';
  };

  const filteredClients = useMemo(
    () => clients.filter(c => 
      getClientDisplayName(c).toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      getClientDocument(c).toLowerCase().includes(search.toLowerCase())
    ),
    [clients, search]
  );

  return (
    <Card className="border-2 border-dashed border-primary-200 bg-primary-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Cliente</h3>
          {selectedClient && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <Check className="w-4 h-4" />
              Seleccionado
            </div>
          )}
        </div>

        {selectedClient ? (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">{selectedClient.name}</p>
              {selectedClient.document && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Identificación:</span> {selectedClient.document}
                </p>
              )}
              <p className="text-sm text-gray-600">📱 {selectedClient.phone}</p>
              {selectedClient.email && (
                <p className="text-sm text-gray-600">✉️ {selectedClient.email}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="mt-3 w-full px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Cambiar cliente
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-6 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">
                  {search ? 'No se encontraron clientes' : 'Comienza a escribir para buscar'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors group"
                  >
                    <p className="font-medium text-gray-900 group-hover:text-primary-600">
                      {getClientDisplayName(client)}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      {getClientDocument(client) && (
                        <span>{getClientDocument(client)}</span>
                      )}
                      <span>{client.phone}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear cliente rápido
            </Button>
          </>
        )}
      </div>

      {/* Modal Crear Cliente */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setNewClient({ firstName: '', lastName: '', document: '', phone: '', email: '', address: '' });
        }}
        title="Crear Cliente Rápido"
        size="sm"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nombre *"
            value={newClient.firstName}
            onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Apellido"
            value={newClient.lastName}
            onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Cédula / RIF (Identificación)"
            value={newClient.document}
            onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="tel"
            placeholder="Teléfono *"
            value={newClient.phone}
            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Dirección"
            value={newClient.address}
            onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setNewClient({ firstName: '', lastName: '', document: '', phone: '', email: '', address: '' });
              }}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateClient}>
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
