export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Administrador' | 'Gerente' | 'Vendedor' | 'Estoquista';
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  type: 'PF' | 'PJ';
  document: string; // CPF ou CNPJ
  email?: string;
  phone: string;
  whatsapp?: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  category: 'Novo' | 'Regular' | 'Premium' | 'VIP';
  totalSpent: number;
  createdAt: string;
  lastPurchase?: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  status: 'Pendente' | 'Confirmada' | 'Entregue' | 'Cancelada';
  createdAt: string;
  deliveryDate?: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  isCustomPrice?: boolean;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  date: string;
  sales: Sale[];
  status: 'Planejada' | 'Em Andamento' | 'Concluída';
  totalValue: number;
  estimatedTime: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  monthlyRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingDeliveries: number;
  dailySales: { date: string; value: number }[];
  topProducts: { name: string; quantity: number }[];
  customerDistribution: { category: string; count: number }[];
}