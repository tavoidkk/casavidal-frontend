// Usuario
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'VENDEDOR' | 'VISUALIZADOR';
  avatar?: string;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Cliente
export interface Client {
  id: string;
  clientType: 'NATURAL' | 'JURIDICO';
  firstName?: string;
  lastName?: string;
  document?: string;
  companyName?: string;
  rif?: string;
  email?: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  category: 'NUEVO' | 'REGULAR' | 'VIP' | 'MAYORISTA' | 'INACTIVO';
  loyaltyPoints: number;
  totalPurchases: number;
  purchaseCount: number;
  isActive: boolean;
  scoring?: {
    score: number;
    churnProbability: number;
  };
  createdAt: string;
  lastPurchaseAt?: string;
}

// Producto
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  image?: string;
  isActive: boolean;
  hasVariants: boolean;
  variantInfo?: string;
  createdAt: string;
}

// Respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}