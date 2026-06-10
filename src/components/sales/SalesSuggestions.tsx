import { useEffect, useState, useRef } from 'react';
import { Lightbulb, Plus, Sparkles } from 'lucide-react';
import { salesAssistantApi, type Suggestion } from '../../api/salesAssistant.api';

interface SalesSuggestionsProps {
  cartItems: { productId: string; productName: string; category: string }[];
  clientId?: string;
  onAddToCart: (productId: string, productName: string, unitPrice: number) => void;
}

export default function SalesSuggestions({ cartItems, clientId, onAddToCart }: SalesSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const prevCartRef = useRef('');

  useEffect(() => {
    const cartKey = cartItems.map(i => i.productId).sort().join(',');
    if (!cartItems.length || cartKey === prevCartRef.current) return;
    prevCartRef.current = cartKey;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const items = cartItems.map(i => ({ productId: i.productId, name: i.productName, category: i.category }));
        const result = await salesAssistantApi.getSuggestions(items, clientId);
        setSuggestions(result.suggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [cartItems, clientId]);

  if (!cartItems.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800">Sugerencias Inteligentes</h3>
        {loading && (
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin ml-auto" />
        )}
      </div>
      {!loading && suggestions.length === 0 && (
        <p className="text-xs text-amber-600">Agrega productos al carrito para obtener sugerencias.</p>
      )}
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-amber-100 p-3 flex items-start gap-2"
          >
            <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{s.productName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.reason}</p>
              <p className="text-sm font-semibold text-primary-600 mt-1">${Number(s.salePrice).toFixed(2)}</p>
            </div>
            <button
              onClick={() => onAddToCart(s.productId, s.productName, Number(s.salePrice))}
              disabled={!s.inStock}
              className="p-1.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Agregar al carrito"
            >
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
