import { Product, Customer, Sale, DashboardMetrics, DeliveryRoute } from './types';
import { AuthService } from './auth';

const STORAGE_KEYS = {
  PRODUCTS: 'cocada_products',
  CUSTOMERS: 'cocada_customers',
  SALES: 'cocada_sales',
  DELIVERY_ROUTES: 'cocada_delivery_routes'
};

// Produtos iniciais
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cocada Tradicional',
    price: 13.00,
    stock: 112,
    category: 'Tradicional',
    description: 'Cocada tradicional nordestina',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Cacau',
    price: 13.00,
    stock: 0,
    category: 'Sabores',
    description: 'Cocada sabor cacau',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Maracujá',
    price: 13.00,
    stock: 0,
    category: 'Sabores',
    description: 'Cocada sabor maracujá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Doce de leite',
    price: 13.00,
    stock: 0,
    category: 'Sabores',
    description: 'Cocada sabor doce de leite',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Cocada Cremosa',
    price: 13.00,
    stock: 0,
    category: 'Cremosa',
    description: 'Cocada cremosa nordestina',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class SalesSystem {
  // Inicialização
  static initialize() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DELIVERY_ROUTES)) {
      localStorage.setItem(STORAGE_KEYS.DELIVERY_ROUTES, JSON.stringify([]));
    }
  }

  // PRODUTOS
  static getProducts(): Product[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  }

  static createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      AuthService.addAuditLog(currentUser.id, currentUser.name, 'CREATE_PRODUCT', `Criou produto: ${newProduct.name}`);
    }
    
    return newProduct;
  }

  static updateProduct(productData: Product): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productData.id);
    
    if (index !== -1) {
      products[index] = { ...productData, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        AuthService.addAuditLog(currentUser.id, currentUser.name, 'UPDATE_PRODUCT', `Atualizou produto: ${productData.name}`);
      }
    }
  }

  static updateStock(productId: string, newStock: number): void {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
      const oldStock = product.stock;
      product.stock = newStock;
      product.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        AuthService.addAuditLog(currentUser.id, currentUser.name, 'UPDATE_STOCK', 
          `${product.name}: ${oldStock} → ${newStock} potes`);
      }
    }
  }

  static deleteProduct(productId: string): void {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    const filteredProducts = products.filter(p => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filteredProducts));
    
    const currentUser = AuthService.getCurrentUser();
    if (currentUser && product) {
      AuthService.addAuditLog(currentUser.id, currentUser.name, 'DELETE_PRODUCT', `Deletou produto: ${product.name}`);
    }
  }

  // CLIENTES
  static getCustomers(): Customer[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  }

  static createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'category' | 'totalSpent'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      category: 'Novo',
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };
    
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      AuthService.addAuditLog(currentUser.id, currentUser.name, 'CREATE_CUSTOMER', `Criou cliente: ${newCustomer.name}`);
    }
    
    return newCustomer;
  }

  static updateCustomer(customerData: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customerData.id);
    
    if (index !== -1) {
      customers[index] = customerData;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        AuthService.addAuditLog(currentUser.id, currentUser.name, 'UPDATE_CUSTOMER', `Atualizou cliente: ${customerData.name}`);
      }
    }
  }

  static updateCustomerCategory(customerId: string): void {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    
    if (customer) {
      const oldCategory = customer.category;
      
      if (customer.totalSpent >= 5000) {
        customer.category = 'VIP';
      } else if (customer.totalSpent >= 3000) {
        customer.category = 'Premium';
      } else if (customer.totalSpent >= 1000) {
        customer.category = 'Regular';
      } else {
        customer.category = 'Novo';
      }
      
      if (oldCategory !== customer.category) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          AuthService.addAuditLog(currentUser.id, currentUser.name, 'UPDATE_CUSTOMER_CATEGORY', 
            `${customer.name}: ${oldCategory} → ${customer.category}`);
        }
      }
    }
  }

  static deleteCustomer(customerId: string): void {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    const filteredCustomers = customers.filter(c => c.id !== customerId);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filteredCustomers));
    
    const currentUser = AuthService.getCurrentUser();
    if (currentUser && customer) {
      AuthService.addAuditLog(currentUser.id, currentUser.name, 'DELETE_CUSTOMER', `Deletou cliente: ${customer.name}`);
    }
  }

  // VENDAS
  static getSales(): Sale[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
  }

  static createSale(saleData: Omit<Sale, 'id' | 'createdAt'>): Sale {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const sales = this.getSales();
    sales.push(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    
    // Atualizar total gasto do cliente
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === saleData.customerId);
    if (customer) {
      customer.totalSpent += saleData.total;
      customer.lastPurchase = new Date().toISOString();
      this.updateCustomer(customer);
      this.updateCustomerCategory(customer.id);
    }
    
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      AuthService.addAuditLog(currentUser.id, currentUser.name, 'CREATE_SALE', 
        `Nova venda: ${saleData.customerName} - R$ ${saleData.total.toFixed(2)}`);
    }
    
    return newSale;
  }

  static updateSale(saleData: Sale): void {
    const sales = this.getSales();
    const index = sales.findIndex(s => s.id === saleData.id);
    
    if (index !== -1) {
      sales[index] = saleData;
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        AuthService.addAuditLog(currentUser.id, currentUser.name, 'UPDATE_SALE', 
          `Atualizou venda: ${saleData.customerName} - R$ ${saleData.total.toFixed(2)}`);
      }
    }
  }

  static confirmDelivery(saleId: string): void {
    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    
    if (sale && sale.status !== 'Entregue') {
      sale.status = 'Entregue';
      sale.deliveryDate = new Date().toISOString();
      
      // Reduzir estoque dos produtos
      const products = this.getProducts();
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          product.updatedAt = new Date().toISOString();
        }
      });
      
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        AuthService.addAuditLog(currentUser.id, currentUser.name, 'CONFIRM_DELIVERY', 
          `Entrega confirmada: ${sale.customerName} - R$ ${sale.total.toFixed(2)}`);
      }
    }
  }

  // ROTAS DE ENTREGA (Sistema removido, mas mantendo para compatibilidade)
  static getDeliveryRoutes(): DeliveryRoute[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DELIVERY_ROUTES) || '[]');
  }

  static createDeliveryRoute(routeData: Omit<DeliveryRoute, 'id'>): DeliveryRoute {
    const routes = this.getDeliveryRoutes();
    const newRoute: DeliveryRoute = {
      ...routeData,
      id: Date.now().toString()
    };
    
    routes.push(newRoute);
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ROUTES, JSON.stringify(routes));
    
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      AuthService.addAuditLog(currentUser.id, currentUser.name, 'CREATE_DELIVERY_ROUTE', 
        `Criou rota: ${newRoute.name}`);
    }
    
    return newRoute;
  }

  static updateDeliveryRoute(routeData: DeliveryRoute): void {
    const routes = this.getDeliveryRoutes();
    const index = routes.findIndex(r => r.id === routeData.id);
    
    if (index !== -1) {
      routes[index] = routeData;
      localStorage.setItem(STORAGE_KEYS.DELIVERY_ROUTES, JSON.stringify(routes));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        AuthService.addAuditLog(currentUser.id, currentUser.name, 'UPDATE_DELIVERY_ROUTE', 
          `Atualizou rota: ${routeData.name}`);
      }
    }
  }

  // DASHBOARD METRICS
  static getDashboardMetrics(): DashboardMetrics {
    const sales = this.getSales();
    const products = this.getProducts();
    const customers = this.getCustomers();
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Vendas do mês atual
    const monthlySales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.getMonth() === currentMonth && 
             saleDate.getFullYear() === currentYear &&
             sale.status === 'Entregue';
    });
    
    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Vendas dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailySales: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTotal = sales
        .filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate.toISOString().split('T')[0] === dateStr && sale.status === 'Entregue';
        })
        .reduce((sum, sale) => sum + sale.total, 0);
      
      dailySales.push({ date: dateStr, value: dayTotal });
    }
    
    // Top produtos vendidos
    const productSales: { [key: string]: { name: string; quantity: number } } = {};
    
    sales
      .filter(sale => sale.status === 'Entregue')
      .forEach(sale => {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.productName, quantity: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
        });
      });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // Distribuição de clientes por categoria
    const customerDistribution = [
      { category: 'Novo', count: customers.filter(c => c.category === 'Novo').length },
      { category: 'Regular', count: customers.filter(c => c.category === 'Regular').length },
      { category: 'Premium', count: customers.filter(c => c.category === 'Premium').length },
      { category: 'VIP', count: customers.filter(c => c.category === 'VIP').length }
    ];
    
    // Entregas pendentes (removido pois não temos mais entregas)
    const pendingDeliveries = 0;
    
    return {
      monthlyRevenue,
      totalProducts: products.reduce((sum, product) => sum + product.stock, 0),
      totalCustomers: customers.length,
      pendingDeliveries,
      dailySales,
      topProducts,
      customerDistribution
    };
  }

  // RELATÓRIOS
  static generateWhatsAppReport(): string {
    const sales = this.getSales();
    const products = this.getProducts();
    
    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR');
    
    const todaySales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString() && sale.status === 'Entregue';
    });
    
    const totalSold = todaySales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    
    let report = `📊 Relatório de Vendas - Cocadas (${todayStr})\n`;
    report += `🍯 Total de Potes Restantes: ${totalStock}\n`;
    report += `🍯 Total de Potes Vendidos: ${totalSold}\n`;
    report += `💰 Total Arrecadado: R$${totalRevenue.toFixed(2).replace('.', ',')}\n`;
    report += `=======================\n`;
    report += `🧾 Detalhamento das Vendas:\n`;
    
    todaySales.forEach(sale => {
      const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      const emoji = sale.customerName.toLowerCase().includes('dona') || 
                   sale.customerName.toLowerCase().includes('maria') ? '👩‍🦰' : '🧑';
      
      report += `${emoji} ${sale.customerName}\n`;
      report += `${totalItems} potes\n`;
      report += `💵 Valor: R$ ${sale.total.toFixed(2).replace('.', ',')}\n\n`;
    });
    
    return report;
  }
}

// Inicializar sistema na primeira execução
SalesSystem.initialize();