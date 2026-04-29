import { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { clientsApi } from '../../api/Clients.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { SaleCustomer } from '../../store/sales.store';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  document?: string;
  companyName?: string;
  clientType?: 'NATURAL' | 'JURIDICO';
}

interface SaleCustomerSelectorProps {
  onSelectCustomer: (customer: SaleCustomer | null) => void;
  selectedCustomer: SaleCustomer | null;
}

export function SaleCustomerSelector({ onSelectCustomer, selectedCustomer }: SaleCustomerSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', document: '', clientType: 'NATURAL' });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientsApi.getAll({ limit: 1000 });
        setClients(response.data);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return clients
      .filter((c) =>
        c.firstName?.toLowerCase().includes(query) ||
        c.lastName?.toLowerCase().includes(query) ||
        c.document?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [search, clients]);

  const handleSelectClient = (client: Client) => {
    onSelectCustomer({
      id: client.id,
      name: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
      phone: client.phone || '',
      email: client.email,
      document: client.document,
      clientType: client.clientType || 'NATURAL',
    });
    setSearch('');
  };

  const handleCreateQuick = () => {
    if (formData.name && formData.phone) {
      onSelectCustomer({
        id: `temp-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        document: formData.document,
        clientType: formData.clientType as 'NATURAL' | 'JURIDICO',
      });
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', document: '', clientType: 'NATURAL' });
    }
  };

  return (
    <>
      <Card className="p-4 bg-white border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Cliente</label>

        {selectedCustomer ? (
          <div className="flex items-start justify-between p-3 bg-primary-50 border border-primary-100 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-600">
                {selectedCustomer.document && `${selectedCustomer.document} • `}
                {selectedCustomer.phone}
              </p>
              {selectedCustomer.email && <p className="text-sm text-gray-600">{selectedCustomer.email}</p>}
            </div>
            <button
              onClick={() => onSelectCustomer(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
              />
            </div>

            {search && filteredClients.length > 0 && (
              <div className="absolute bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-96 max-h-64 overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="p-3 border-b hover:bg-gray-50 cursor-pointer last:border-b-0"
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.document && `${client.document} • `}
                      {client.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)} className="w-full">
              + Crear Cliente Rápido
            </Button>
          </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Cliente Rápido">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="Nombre del cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="Teléfono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RIF/Documento</label>
            <input
              type="text"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
              placeholder="RIF o Cédula"
            />
          </div>
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreateQuick} className="flex-1" disabled={!formData.name || !formData.phone}>
              Crear Cliente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
