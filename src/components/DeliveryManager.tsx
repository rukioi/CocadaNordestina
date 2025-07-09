import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  MapPin, 
  Clock, 
  DollarSign,
  Route,
  CheckCircle,
  AlertCircle,
  Navigation,
  Package,
  User,
  Calendar,
  Save,
  X,
  Eye
} from 'lucide-react';
import { SalesSystem } from '@/lib/salesSystem';
import { AuthService } from '@/lib/auth';
import { Sale, Customer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Interface para rota de entrega
interface DeliveryRoute {
  id: string;
  name: string;
  date: string;
  sales: Sale[];
  status: 'Planejada' | 'Em Andamento' | 'Concluída';
  totalValue: number;
  estimatedTime: number;
}

// Bairros de Aracaju organizados por região para otimização de rotas
const ARACAJU_NEIGHBORHOODS = {
  'Centro': ['Centro', 'São José', 'Getémio Vargas', 'Siqueira Campos'],
  'Zona Sul': ['Atalaia', 'Coroa do Meio', 'Farolândia', 'Grageru', 'Jardins', 'Luzia', 'Ponta Verde', 'São Conrado', 'Treze de Julho'],
  'Zona Norte': ['18 do Forte', 'América', 'Cirurgia', 'Cidade Nova', 'Industrial', 'Lamarão', 'Novo Paraíso', 'Palestina', 'Santos Dumont'],
  'Zona Oeste': ['Aeroporto', 'Capucho', 'Jabotiana', 'Jardim Centenário', 'Olaria', 'Porto Dantas', 'Santa Maria', 'Soledade']
};

const DeliveryManager: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
  const [isViewRouteModalOpen, setIsViewRouteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  
  const [routeForm, setRouteForm] = useState({
    name: '',
    date: '',
    selectedSales: [] as string[]
  });

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = () => {
    setSales(SalesSystem.getSales());
    setRoutes(SalesSystem.getDeliveryRoutes());
    setCustomers(SalesSystem.getCustomers());
    setPendingSales(SalesSystem.getSales().filter(sale => sale.status === 'Confirmada'));
  };

  const getCustomerByName = (customerName: string) => {
    return customers.find(c => c.name === customerName);
  };

  const getNeighborhoodRegion = (neighborhood: string) => {
    for (const [region, neighborhoods] of Object.entries(ARACAJU_NEIGHBORHOODS)) {
      if (neighborhoods.some(n => n.toLowerCase().includes(neighborhood.toLowerCase()) || 
                              neighborhood.toLowerCase().includes(n.toLowerCase()))) {
        return region;
      }
    }
    return 'Outros';
  };

  const optimizeRoute = (selectedSaleIds: string[]) => {
    const selectedSales = sales.filter(sale => selectedSaleIds.includes(sale.id));
    
    // Agrupar por região/bairro
    const salesByRegion: { [key: string]: Sale[] } = {};
    
    selectedSales.forEach(sale => {
      const customer = getCustomerByName(sale.customerName);
      const region = customer ? getNeighborhoodRegion(customer.address.neighborhood) : 'Outros';
      
      if (!salesByRegion[region]) {
        salesByRegion[region] = [];
      }
      salesByRegion[region].push(sale);
    });

    // Ordenar regiões por proximidade (Centro -> Zona Sul -> Zona Norte -> Zona Oeste)
    const regionOrder = ['Centro', 'Zona Sul', 'Zona Norte', 'Zona Oeste', 'Outros'];
    const optimizedSales: Sale[] = [];

    regionOrder.forEach(region => {
      if (salesByRegion[region]) {
        // Dentro de cada região, ordenar por bairro
        salesByRegion[region].sort((a, b) => {
          const customerA = getCustomerByName(a.customerName);
          const customerB = getCustomerByName(b.customerName);
          const neighborhoodA = customerA?.address.neighborhood || '';
          const neighborhoodB = customerB?.address.neighborhood || '';
          return neighborhoodA.localeCompare(neighborhoodB);
        });
        
        optimizedSales.push(...salesByRegion[region]);
      }
    });

    return optimizedSales;
  };

  const calculateRouteMetrics = (salesIds: string[]) => {
    const routeSales = sales.filter(sale => salesIds.includes(sale.id));
    const totalValue = routeSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = routeSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    // Estimar tempo baseado no número de paradas e região
    const regions = new Set();
    routeSales.forEach(sale => {
      const customer = getCustomerByName(sale.customerName);
      if (customer) {
        regions.add(getNeighborhoodRegion(customer.address.neighborhood));
      }
    });
    
    // 15 min por parada + 10 min por região diferente + 30 min base
    const estimatedTime = (routeSales.length * 15) + (regions.size * 10) + 30;
    
    return {
      totalValue,
      totalItems,
      estimatedTime,
      stops: routeSales.length,
      regions: Array.from(regions)
    };
  };

  const handleCreateRoute = () => {
    if (!routeForm.name || !routeForm.date || routeForm.selectedSales.length === 0) {
      alert('Preencha todos os campos e selecione pelo menos uma venda');
      return;
    }

    const optimizedSales = optimizeRoute(routeForm.selectedSales);
    const metrics = calculateRouteMetrics(routeForm.selectedSales);
    
    SalesSystem.createDeliveryRoute({
      name: routeForm.name,
      date: routeForm.date,
      sales: optimizedSales,
      status: 'Planejada',
      totalValue: metrics.totalValue,
      estimatedTime: metrics.estimatedTime
    });

    loadDeliveryData();
    setIsCreateRouteModalOpen(false);
    setRouteForm({
      name: '',
      date: '',
      selectedSales: []
    });
  };

  const handleCompleteRoute = (route: DeliveryRoute) => {
    if (confirm(`Confirmar conclusão da rota "${route.name}"? Todas as vendas serão marcadas como entregues.`)) {
      // Marcar todas as vendas da rota como entregues
      route.sales.forEach(sale => {
        SalesSystem.confirmDelivery(sale.id);
      });
      loadDeliveryData();
    }
  };

  const toggleSaleSelection = (saleId: string) => {
    const isSelected = routeForm.selectedSales.includes(saleId);
    if (isSelected) {
      setRouteForm({
        ...routeForm,
        selectedSales: routeForm.selectedSales.filter(id => id !== saleId)
      });
    } else {
      setRouteForm({
        ...routeForm,
        selectedSales: [...routeForm.selectedSales, saleId]
      });
    }
  };

  const getRouteStatusColor = (status: DeliveryRoute['status']) => {
    switch (status) {
      case 'Planejada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Em Andamento': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Concluída': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const canManageDelivery = AuthService.hasPermission('delivery');

  if (!canManageDelivery) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const selectedMetrics = calculateRouteMetrics(routeForm.selectedSales);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Sistema de Entregas Desabilitado</h1>
          <p className="text-muted-foreground">
            O sistema de entregas foi removido conforme solicitado
          </p>
        </div>
      </div>

      {/* Mensagem informativa */}
      <Card>
        <CardContent className="p-8 text-center">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sistema de Entregas Removido</h3>
          <p className="text-muted-foreground">
            O sistema de entregas foi desabilitado. As vendas são marcadas como entregues diretamente na tela de vendas.
          </p>
        </CardContent>
      </Card>

      {/* Modais ocultos para evitar erros */}
      <Dialog open={isCreateRouteModalOpen} onOpenChange={setIsCreateRouteModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sistema Desabilitado</DialogTitle>
            <DialogDescription>
              O sistema de entregas foi removido
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="route-name">Nome da Rota</Label>
                <Input
                  id="route-name"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({...routeForm, name: e.target.value})}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="route-date">Data da Entrega</Label>
                <Input
                  id="route-date"
                  type="date"
                  value={routeForm.date}
                  onChange={(e) => setRouteForm({...routeForm, date: e.target.value})}
                  disabled
                />
              </div>
            </div>

            {routeForm.selectedSales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo da Rota</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedMetrics.stops}</div>
                      <div className="text-sm text-muted-foreground">Paradas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedMetrics.totalItems}</div>
                      <div className="text-sm text-muted-foreground">Potes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{formatCurrency(selectedMetrics.totalValue)}</div>
                      <div className="text-sm text-muted-foreground">Valor Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{formatTime(selectedMetrics.estimatedTime)}</div>
                      <div className="text-sm text-muted-foreground">Tempo Est.</div>
                    </div>
                  </div>
                  
                  {selectedMetrics.regions.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Regiões:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedMetrics.regions.map(region => (
                          <Badge key={region} variant="secondary">{region}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div>
              <Label className="text-base font-semibold">Vendas Disponíveis para Entrega</Label>
              <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
                {pendingSales.map((sale) => {
                  const customer = getCustomerByName(sale.customerName);
                  const region = customer ? getNeighborhoodRegion(customer.address.neighborhood) : 'Outros';
                  const isSelected = routeForm.selectedSales.includes(sale.id);
                  
                  return (
                    <Card key={sale.id} className={`cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`} onClick={() => toggleSaleSelection(sale.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSaleSelection(sale.id)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{sale.customerName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Venda #{sale.id.slice(-6)} • {formatCurrency(sale.total)}
                                </p>
                                {customer && (
                                  <p className="text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {customer.address.neighborhood} ({region})
                                  </p>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {sale.items.reduce((sum, item) => sum + item.quantity, 0)} potes
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {pendingSales.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma venda para entrega</h3>
                    <p className="text-muted-foreground">
                      Todas as vendas confirmadas já foram entregues
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateRoute} 
                  className="flex-1"
                  disabled={routeForm.selectedSales.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Criar Rota
                </Button>
                <Button variant="outline" onClick={() => setIsCreateRouteModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização da Rota */}
      <Dialog open={isViewRouteModalOpen} onOpenChange={setIsViewRouteModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Rota: {selectedRoute?.name}</DialogTitle>
            <DialogDescription>
              Informações completas da rota de entrega
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Data</div>
                  <div className="font-semibold">{formatDate(selectedRoute.date)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge className={getRouteStatusColor(selectedRoute.status)}>
                    {selectedRoute.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tempo Estimado</div>
                  <div className="font-semibold">{formatTime(selectedRoute.estimatedTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                  <div className="font-semibold text-primary">{formatCurrency(selectedRoute.totalValue)}</div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Paradas da Rota ({selectedRoute.sales.length})</h3>
                <div className="space-y-3">
                  {selectedRoute.sales.map((sale, index) => {
                    const customer = getCustomerByName(sale.customerName);
                    const region = customer ? getNeighborhoodRegion(customer.address.neighborhood) : 'Outros';
                    
                    return (
                      <Card key={sale.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{sale.customerName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Venda #{sale.id.slice(-6)}
                                </p>
                                {customer && (
                                  <p className="text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {customer.address.street}, {customer.address.number} - {customer.address.neighborhood}
                                  </p>
                                )}
                                <Badge variant="secondary" className="mt-1">
                                  {region}
                                </Badge>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-semibold text-primary">
                                  {formatCurrency(sale.total)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {sale.items.reduce((sum, item) => sum + item.quantity, 0)} potes
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedRoute.status === 'Em Andamento' && (
                  <Button 
                    onClick={() => {
                      handleCompleteRoute(selectedRoute);
                      setIsViewRouteModalOpen(false);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Rota
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsViewRouteModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryManager;