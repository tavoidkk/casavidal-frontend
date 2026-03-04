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

// Ventas
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'PUNTO_VENTA' | 'PAGO_MOVIL' | 'ZELLE';

export interface SaleItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    image?: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  clientId: string;
  client: {
    id: string;
    clientType: 'NATURAL' | 'JURIDICO';
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone: string;
  };
  sellerId: string;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: SaleItem[];
  createdAt: string;
}

// Pedidos Especiales
export type OrderStatus =
  | 'PENDIENTE'
  | 'ORDEN_GENERADA'
  | 'EN_TRANSITO'
  | 'RECIBIDO'
  | 'LISTO_CLIENTE'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface SpecialOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  client: {
    id: string;
    clientType: 'NATURAL' | 'JURIDICO';
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone: string;
  };
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
  };
  quantity: number;
  status: OrderStatus;
  estimatedDate?: string;
  receivedDate?: string;
  notifiedAt?: string;
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    status: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard
export interface DashboardStats {
  salesToday: { total: number; count: number };
  salesMonth: { total: number; count: number };
  totalClients: number;
  lowStockCount: number;
  pendingOrders: number;
}

export interface SalesTrendItem {
  date: string;
  total: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

export interface TopClient {
  id: string;
  displayName: string;
  clientType: 'NATURAL' | 'JURIDICO';
  category: string;
  totalPurchases: number;
  purchaseCount: number;
  loyaltyPoints: number;
}