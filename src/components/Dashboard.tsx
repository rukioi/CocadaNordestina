import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart,
  Plus,
  Download,
  AlertTriangle
} from 'lucide-react';
import { SalesSystem } from '@/lib/salesSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  action: () => void;
  color: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const metrics = SalesSystem.getDashboardMetrics();

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

  const handleNewSale = () => {
    navigate('/sales');
  };

  const handleExportExcel = () => {
    const data = {
      vendas: SalesSystem.getSales(),
      produtos: SalesSystem.getProducts(),
      clientes: SalesSystem.getCustomers(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cocada-nordestina-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickActions: QuickAction[] = [
    {
      icon: Plus,
      label: 'Nova Venda',
      description: 'Registrar nova venda',
      action: handleNewSale,
      color: 'bg-primary'
    },
    {
      icon: Download,
      label: 'Export Excel',
      description: 'Baixar dados completos',
      action: handleExportExcel,
      color: 'bg-blue-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das vendas e operações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potes em Estoque</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {metrics.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              5 produtos diferentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={`action-${index}`}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
                  onClick={action.action}
                >
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas dos Últimos 30 Dias */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
            <CardDescription>
              Evolução diária das vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${value}`}
                    fontSize={12}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Vendas']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B4513" 
                    strokeWidth={2}
                    dot={{ fill: '#8B4513', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B4513', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>
              Ranking dos produtos por quantidade vendida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    fontSize={12}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} potes`, 'Vendidos']}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="#D2B48C"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Sistema</CardTitle>
          <CardDescription>
            Informações importantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Produtos em Estoque Baixo
              </p>
              <p className="text-sm text-red-600">4 produtos precisam de reposição</p>
            </div>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Atenção
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="font-medium text-blue-800">Vendas Hoje</p>
              <p className="text-sm text-blue-600">3 vendas realizadas</p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Ativo
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="font-medium text-yellow-800">Clientes Novos</p>
              <p className="text-sm text-yellow-600">2 clientes cadastrados hoje</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Novo
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;