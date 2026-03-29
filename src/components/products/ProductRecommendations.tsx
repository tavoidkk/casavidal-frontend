import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { recommendationsApi, RecommendationItem } from '../../api/recommendations.api';

interface ProductRecommendationsProps {
  productId: string;
  limit?: number;
}

export default function ProductRecommendations({ productId, limit = 6 }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [productId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await recommendationsApi.getProductRecommendations(productId, limit);
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'frequently_bought_together':
        return 'Comprados juntos frecuentemente';
      case 'similar':
        return 'Producto similar';
      case 'category_based':
        return 'Productos complementarios';
      case 'trending':
        return 'Tendencia';
      default:
        return 'Recomendado';
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'frequently_bought_together':
        return <Sparkles className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-900">También te puede interesar</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition-all"
          >
            {/* Reason badge */}
            <div className="flex items-center gap-1 text-xs text-primary-600 mb-2">
              {getReasonIcon(item.reason)}
              <span>{getReasonLabel(item.reason)}</span>
            </div>

            {/* Product info */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {item.name}
            </h3>
            <p className="text-sm text-gray-500 mb-2">{item.sku}</p>

            {/* Category */}
            {item.category && (
              <p className="text-xs text-gray-500 mb-2">
                📁 {item.category.name}
              </p>
            )}

            {/* Price and stock */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-primary-600">
                ${Number(item.salePrice).toFixed(2)}
              </span>
              <span className={`text-xs ${item.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.currentStock > 0 ? `${item.currentStock} disponibles` : 'Sin stock'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.location.href = `/products/${item.id}`}
              >
                Ver detalles
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={item.currentStock === 0}
              >
                Agregar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
