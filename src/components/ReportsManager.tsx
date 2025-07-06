import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Share, 
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  BarChart3,
  PieChart,
  Copy,
  CheckCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { SalesSystem } from '@/lib/salesSystem';
import { AuthService } from '@/lib/auth';
import { Sale, Product, Customer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const ReportsManager: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [reportPeriod, setReportPeriod] = useState('today');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
    setDefaultDates();
  }, []);

  const loadData = () => {
    setSales(SalesSystem.getSales());
    setProducts(SalesSystem.getProducts());
    setCustomers(SalesSystem.getCustomers());
  };

  const setDefaultDates = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    setDateRange({
      start: weekAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  const generateWhatsAppReport = () => {
    const report = SalesSystem.generateWhatsAppReport();
    
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateExcelData = () => {
    // Simular geração de Excel (em produção seria um arquivo real)
    const data = {
      vendas: sales.map(sale => ({
        id: sale.id,
        cliente: sale.customerName,
        data: new Date(sale.createdAt).toLocaleDateString('pt-BR'),
        status: sale.status,
        total: sale.total,
        itens: sale.items.length,
        potes: sale.items.reduce((sum, item) => sum + item.quantity, 0)
      })),
      produtos: products.map(product => ({
        id: product.id,
        nome: product.name,
        categoria: product.category,
        preco: product.price,
        estoque: product.stock,
        criado: new Date(product.createdAt).toLocaleDateString('pt-BR')
      })),
      clientes: customers.map(customer => ({
        id: customer.id,
        nome: customer.name,
        tipo: customer.type,
        categoria: customer.category,
        totalGasto: customer.totalSpent,
        ultimaCompra: customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('pt-BR') : 'Nunca'
      }))
    };

    // Simular download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-cocada-nordestina-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredSales = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (reportPeriod) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'custom':
        startDate = new Date(dateRange.start);
        endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate && sale.status === 'Entregue';
    });
  };

  const calculateMetrics = () => {
    const filteredSales = getFilteredSales();
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSales = filteredSales.length;
    const totalItems = filteredSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top produtos
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Vendas por dia
    const salesByDay: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      const day = new Date(sale.createdAt).toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + sale.total;
    });

    const dailySales = Object.entries(salesByDay)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top clientes
    const customerSales: { [key: string]: { name: string; total: number; orders: number } } = {};
    filteredSales.forEach(sale => {
      if (!customerSales[sale.customerId]) {
        customerSales[sale.customerId] = { name: sale.customerName, total: 0, orders: 0 };
      }
      customerSales[sale.customerId].total += sale.total;
      customerSales[sale.customerId].orders += 1;
    });

    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalRevenue,
      totalSales,
      totalItems,
      averageTicket,
      topProducts,
      dailySales,
      topCustomers
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getPeriodLabel = () => {
    switch (reportPeriod) {
      case 'today': return 'Hoje';
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Último mês';
      case 'custom': return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
      default: return 'Hoje';
    }
  };

  const canViewReports = AuthService.hasPermission('reports');

  if (!canViewReports) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const pieColors = ['#8B4513', '#D2B48C', '#F4A460', '#DEB887', '#CD853F'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e relatórios de vendas da Cocada Nordestina
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={generateWhatsAppReport} variant="outline" className="bg-green-50 hover:bg-green-100">
            {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copiado!' : 'WhatsApp'}
          </Button>
          
          <Button onClick={generateExcelData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Dialog open={isWeeklyModalOpen} onOpenChange={setIsWeeklyModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatório Semanal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Relatório Semanal Detalhado</DialogTitle>
                <DialogDescription>
                  Análise completa das vendas e performance
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="products">Produtos</TabsTrigger>
                  <TabsTrigger value="customers">Clientes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalRevenue)}</div>
                        <div className="text-sm text-muted-foreground">Receita Total</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{metrics.totalSales}</div>
                        <div className="text-sm text-muted-foreground">Vendas</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{metrics.totalItems}</div>
                        <div className="text-sm text-muted-foreground">Potes Vendidos</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.averageTicket)}</div>
                        <div className="text-sm text-muted-foreground">Ticket Médio</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendas por Dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.dailySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDate} />
                            <YAxis tickFormatter={(value) => `R$ ${value}`} />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(Number(value)), 'Vendas']}
                              labelFormatter={(label) => formatDate(label)}
                            />
                            <Line type="monotone" dataKey="value" stroke="#8B4513" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="products" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Produtos por Quantidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.topProducts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} potes`, 'Vendidos']} />
                            <Bar dataKey="quantity" fill="#D2B48C" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita por Produto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={metrics.topProducts}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, revenue }) => `${name}: ${formatCurrency(revenue)}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="revenue"
                            >
                              {metrics.topProducts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="customers" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Clientes por Valor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {metrics.topCustomers.map((customer, index) => (
                          <div key={customer.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-muted-foreground">{customer.orders} pedidos</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-primary">{formatCurrency(customer.total)}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(customer.total / customer.orders)} por pedido
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Período do Relatório</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reportPeriod === 'custom' && (
              <>
                <div>
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </>
            )}
            
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumo - {getPeriodLabel()}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Receita Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.totalSales}</div>
                  <div className="text-sm text-muted-foreground">Vendas Realizadas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-200 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{metrics.totalItems}</div>
                  <div className="text-sm text-muted-foreground">Potes Vendidos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-200 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.averageTicket)}</div>
                  <div className="text-sm text-muted-foreground">Ticket Médio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução das Vendas</CardTitle>
            <CardDescription>Vendas diárias no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Vendas']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Line type="monotone" dataKey="value" stroke="#8B4513" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Ranking por quantidade vendida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [`${value} potes`, 'Vendidos']} />
                  <Bar dataKey="quantity" fill="#D2B48C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Melhores Clientes do Período</CardTitle>
          <CardDescription>Clientes que mais compraram no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topCustomers.length > 0 ? (
              metrics.topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.orders} {customer.orders === 1 ? 'pedido' : 'pedidos'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary text-lg">{formatCurrency(customer.total)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(customer.total / customer.orders)} por pedido
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma venda no período</h3>
                <p className="text-muted-foreground">
                  Não há vendas registradas para o período selecionado
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManager;