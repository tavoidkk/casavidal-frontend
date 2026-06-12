// Usuario
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'VENDEDOR' | 'VISUALIZADOR' | 'WORKER';
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
  stage: 'NUEVO' | 'CONTACTADO' | 'COTIZACION' | 'GANADO' | 'PERDIDO';
  source?: 'REFERIDO' | 'REDES' | 'WHATSAPP' | 'VISITA' | 'OTRO';
  lastContactAt?: string;
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
  productSuppliers?: Array<{
    id: string;
    supplierId: string;
    supplierPrice: number;
    isPreferred: boolean;
    supplier: {
      id: string;
      name: string;
      rif?: string;
    };
  }>;
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
  supplierId: string;
  supplier: {
    id: string;
    name: string;
    phone?: string;
  };
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
  };
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  shippingCost: number;
  status: OrderStatus;
  estimatedDate?: string;
  receivedDate?: string;
  notifiedAt?: string;
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    shippingCost?: number;
    total: number;
  };
  paymentMethod?: PaymentMethod;
  supplierPaymentMethod?: string;
  sale?: {
    id: string;
    saleNumber: string;
    total: number;
    paymentMethod?: PaymentMethod;
    createdAt: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Órdenes de Compra
export type PurchaseOrderStatus =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'CONFIRMADA'
  | 'RECIBIDA_PARCIAL'
  | 'RECIBIDA_COMPLETA'
  | 'CANCELADA';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: {
    id: string;
    name: string;
    phone?: string;
    rif?: string;
  };
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  shippingCost: number;
  paymentTerms?: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  items: PurchaseOrderItem[];
  specialOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  quantityReceived: number;
  createdAt: string;
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

// Notification
export type NotificationType = 'STOCK_BAJO' | 'VENTA_COMPLETADA' | 'PEDIDO_LISTO' | 'NUEVO_CLIENTE' | 'SISTEMA';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Suggestion
export interface Suggestion {
  id: string;
  clientId: string;
  clientName: string;
  clientCategory: string;
  type: ActivityType;
  title: string;
  description: string;
  reason: string;
  priority: number;
  ruleKey: string;
}

// Activity
export type ActivityType = 'LLAMADA' | 'EMAIL' | 'REUNION' | 'NOTA' | 'TAREA' | 'SEGUIMIENTO';

export interface Activity {
  id: string;
  clientId: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  scheduledFor?: string;
  status?: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA' | 'PERDIDA';
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
  client?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    clientType: 'NATURAL' | 'JURIDICO';
  };
}

export interface ActivityCreate {
  clientId: string;
  type: ActivityType;
  title: string;
  description?: string;
  scheduledFor?: string;
}

export interface ActivityUpdate {
  title?: string;
  description?: string;
  type?: ActivityType;
  scheduledFor?: string;
  status?: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA' | 'PERDIDA';
}

// Settings
export type Currency = 'CLP' | 'USD' | 'EUR' | 'ARS' | 'MXN' | 'COP' | 'PEN' | 'BRL';

export interface Settings {
  id: string;
  // Información de la empresa
  companyName: string;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyLogo?: string | null;
  
  // Configuración financiera
  currency: Currency;
  taxRate: number;
  
  // Configuración de inventario
  lowStockThreshold: number;
  
  // Configuración de ventas
  defaultPaymentTerm: number;
  
  // Configuración de sistema
  enableNotifications: boolean;
  enableAutoBackup: boolean;
  
  // Localización
  locale: string;
  timezone: string;
  
  createdAt: string;
  updatedAt: string;
}

// Workers
export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'WORKER';
  isActive: boolean;
}

// Calendar
export type CalendarEventCategory = 'TAREA' | 'AGENDA';
export type CalendarEventStatus = 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
export type CalendarEventSource = 'LOCAL' | 'GOOGLE';

export interface EventType {
  id: string;
  name: string;
  color: string;
  defaultDurationMinutes: number;
  isActive: boolean;
}

export interface BookingSettings {
  id: string;
  workDays: string[];
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  timezone: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: CalendarEventCategory;
  status: CalendarEventStatus;
  source: CalendarEventSource;
  startDate: string;
  endDate: string;
  allDay: boolean;
  clientId?: string;
  assignedToId: string;
  eventTypeId?: string;
  location?: string;
  googleEventId?: string;
  client?: {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    clientType: 'NATURAL' | 'JURIDICO';
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  eventType?: EventType | null;
}

export interface CalendarEventCreate {
  title: string;
  category: CalendarEventCategory;
  status?: CalendarEventStatus;
  startDate: string;
  allDay?: boolean;
  clientId?: string;
  eventTypeId?: string;
}

export interface CalendarEventUpdate {
  title?: string;
  category?: CalendarEventCategory;
  status?: CalendarEventStatus;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  clientId?: string | null;
  eventTypeId?: string | null;
}

export interface UpdateSettingsInput {
  // Información de la empresa
  companyName?: string;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyLogo?: string | null;
  
  // Configuración financiera
  currency?: Currency;
  taxRate?: number;
  
  // Configuración de inventario
  lowStockThreshold?: number;
  
  // Configuración de ventas
  defaultPaymentTerm?: number;
  
  // Configuración de sistema
  enableNotifications?: boolean;
  enableAutoBackup?: boolean;
  
  // Localización
  locale?: string;
  timezone?: string;
}

