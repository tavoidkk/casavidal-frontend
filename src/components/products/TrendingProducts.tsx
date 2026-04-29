import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recommendationsApi, type RecommendationItem } from '../../api/recommendations.api';

interface TrendingProductsProps {
  limit?: number;
  days?: number;
}

export default function TrendingProducts({ limit = 10, days = 30 }: TrendingProductsProps) {
  const [trending, setTrending] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, [limit, days]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      const data = await recommendationsApi.getTrendingProducts(limit, days);
      setTrending(data);
    } catch (error) {
      console.error('Error loading trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900 font-display">Productos Populares</h2>
        </div>
        <span className="text-sm text-gray-500">Últimos {days} días</span>
      </div>

      <div className="space-y-3">
        {trending.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all"
          >
            {/* Ranking badge */}
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">{item.sku}</span>
                {item.category && (
                  <span className="text-xs text-gray-400">• {item.category.name}</span>
                )}
              </div>
            </div>

            {/* Price and actions */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-semibold text-primary-600">
                  ${Number(item.salePrice).toFixed(2)}
                </div>
                <div className={`text-xs ${item.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.currentStock > 0 ? `${item.currentStock} en stock` : 'Agotado'}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="secondary"
                disabled={item.currentStock === 0}
                onClick={() => window.location.href = `/products/${item.id}`}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
