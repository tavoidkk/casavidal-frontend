import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, Trash2, Play, Plus } from 'lucide-react';
import type { DraftSale } from '../../store/sales.store';

interface DraftSalesListProps {
  drafts: DraftSale[];
  onLoadDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onNewSale: () => void;
}

export function DraftSalesList({ drafts, onLoadDraft, onDeleteDraft, onNewSale }: DraftSalesListProps) {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-6 border-2 border-amber-200 bg-amber-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Ventas en Espera ({drafts.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">Haz clic en una venta para continuarla</p>
        </div>
        <Button size="sm" onClick={onNewSale}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Venta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {drafts.map((draft) => (
          <div key={draft.id} className="flex items-start justify-between p-3 bg-white border border-amber-300 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{draft.customer?.name || 'Sin cliente'}</p>
              <p className="text-xs text-gray-600 mt-1">
                {draft.items.length} ítem{draft.items.length !== 1 ? 's' : ''} • Total: ${Number(draft.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(draft.updatedAt).toLocaleDateString('es-VE')}
              </p>
            </div>
            <div className="flex gap-2 ml-3">
              <button
                onClick={() => onLoadDraft(draft.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Continuar"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteDraft(draft.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
