import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  User,
  Package,
  Calendar,
  DollarSign,
  Check,
  X,
  Save,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { SalesSystem } from '@/lib/salesSystem';
import { AuthService } from '@/lib/auth';
import { Sale, Product, Customer, SaleItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FormData {
  customerId: string;
  customerName: string;
  items: SaleItem[];
  notes: string;
  status: Sale['status'];
}

interface NewItem {
  productId: string;
  quantity: number;
  customPrice: string;
}

const SalesManager: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    customerName: '',
    items: [] as SaleItem[],
    notes: '',
    status: 'Pendente'
  });

  const [newItem, setNewItem] = useState<NewItem>({
    productId: '',
    quantity: 1,
    customPrice: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  const loadData = () => {
    setSales(SalesSystem.getSales());
    setProducts(SalesSystem.getProducts());
    setCustomers(SalesSystem.getCustomers());
  };

  const filterSales = () => {
    let filtered = sales;

    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    // Ordenar por data mais recente
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredSales(filtered);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      items: [],
      notes: '',
      status: 'Pendente'
    });
    setNewItem({
      productId: '',
      quantity: 1,
      customPrice: ''
    });
  };

  const addItemToSale = () => {
    if (!newItem.productId || newItem.quantity <= 0) {
      alert('Selecione um produto e quantidade válida');
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;

    // Usar preço customizado se fornecido, senão usar preço padrão
    const price = newItem.customPrice ? parseFloat(newItem.customPrice) : product.price;

    // Verificar se produto já está na lista
    const existingItemIndex = formData.items.findIndex(item => item.productId === newItem.productId);
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade do item existente
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += newItem.quantity;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * price;
      
      setFormData({
        ...formData,
        items: updatedItems
      });
    } else {
      // Adicionar novo item
      const saleItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        quantity: newItem.quantity,
        price: price,
        total: newItem.quantity * price,
        isCustomPrice: newItem.customPrice !== '' && price !== product.price
      };

      setFormData({
        ...formData,
        items: [...formData.items, saleItem]
      });
    }

    setNewItem({
      productId: '',
      quantity: 1,
      customPrice: ''
    });
  };

  const removeItemFromSale = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.productId !== productId)
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromSale(productId);
      return;
    }

    const updatedItems = formData.items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          total: quantity * item.price
        };
      }
      return item;
    });

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    const updatedItems = formData.items.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        return {
          ...item,
          price: newPrice,
          total: item.quantity * newPrice,
          isCustomPrice: product ? newPrice !== product.price : false
        };
      }
      return item;
    });

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreate = () => {
    if (!formData.customerId || formData.items.length === 0) {
      alert('Selecione um cliente e adicione pelo menos um produto');
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    SalesSystem.createSale({
      customerId: formData.customerId,
      customerName: customer.name,
      items: formData.items,
      total: calculateTotal(),
      status: formData.status,
      notes: formData.notes
    });

    loadData();
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleStatusChange = (sale: Sale, newStatus: Sale['status']) => {
    const updatedSale = { ...sale, status: newStatus };
    
    if (newStatus === 'Entregue') {
      SalesSystem.confirmDelivery(sale.id);
    } else {
      SalesSystem.updateSale(updatedSale);
    }
    
    loadData();
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Entregue': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Sale['status']) => {
    switch (status) {
      case 'Pendente': return <Clock className="h-4 w-4" />;
      case 'Confirmada': return <CheckCircle className="h-4 w-4" />;
      case 'Entregue': return <Check className="h-4 w-4" />;
      case 'Cancelada': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canManageSales = AuthService.hasPermission('sales');

  if (!canManageSales) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie pedidos e acompanhe o status das vendas
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Venda</DialogTitle>
              <DialogDescription>
                Registre uma nova venda de cocadas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Seleção de Cliente */}
              <div>
                <Label>Cliente *</Label>
                <Select value={formData.customerId} onValueChange={(value) => {
                  const customer = customers.find(c => c.id === value);
                  setFormData({
                    ...formData,
                    customerId: value,
                    customerName: customer?.name || ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {customer.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Adicionar Produtos */}
              <div className="space-y-4">
                <Label>Produtos</Label>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <Select value={newItem.productId} onValueChange={(value) => setNewItem({...newItem, productId: value})}>
                    <SelectTrigger className="col-span-1 sm:col-span-2">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter(p => p.stock > 0).map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {formatCurrency(product.price)} - {product.stock} em estoque
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    placeholder="Qtd"
                  />

                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.customPrice}
                    onChange={(e) => setNewItem({...newItem, customPrice: e.target.value})}
                    placeholder="R$ 13,00"
                  />
                  
                  <Button onClick={addItemToSale} variant="outline" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Deixe o preço em branco para usar o valor padrão (R$ 13,00)
                </p>

                {/* Lista de Itens */}
                {formData.items.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-24">Qtd</TableHead>
                          <TableHead className="w-24">Preço</TableHead>
                          <TableHead className="w-24">Total</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item) => (
                          <TableRow key={item.productId} className={item.isCustomPrice ? 'bg-orange-50' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.productName}
                                {item.isCustomPrice && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Preço Especial
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                className="w-16"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemFromSale(item.productId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-semibold">
                            Total da Venda:
                          </TableCell>
                          <TableCell className="font-bold text-lg text-primary">
                            {formatCurrency(calculateTotal())}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Status e Observações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: Sale['status']) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Confirmada">Confirmada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações sobre a venda..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreate} className="flex-1" disabled={formData.items.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Venda
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar vendas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Venda #{sale.id.slice(-6)}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {sale.customerName} • {formatDate(sale.createdAt)}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(sale.status)}>
                  {getStatusIcon(sale.status)}
                  <span className="ml-1">{sale.status}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'} • {' '}
                    {sale.items.reduce((sum, item) => sum + item.quantity, 0)} potes
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(sale.total)}
                  </div>
                  {sale.items.some(item => item.isCustomPrice) && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Preços Especiais
                    </Badge>
                  )}
                </div>
                
                {sale.deliveryDate && (
                  <div className="text-sm text-right">
                    <div className="text-muted-foreground">Entregue em</div>
                    <div className="font-medium">
                      {formatDate(sale.deliveryDate)}
                    </div>
                  </div>
                )}
              </div>

              {sale.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{sale.notes}</p>
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSale(sale);
                    setIsViewModalOpen(true);
                  }}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
                
                {sale.status === 'Pendente' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(sale, 'Confirmada')}
                    className="text-blue-600 hover:text-blue-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                )}
                
                {sale.status === 'Confirmada' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(sale, 'Entregue')}
                    className="text-green-600 hover:text-green-600"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Entregar
                  </Button>
                )}
                
                {(sale.status === 'Pendente' || sale.status === 'Confirmada') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(sale, 'Cancelada')}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira venda'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda #{selectedSale?.id.slice(-6)}</DialogTitle>
            <DialogDescription>
              Informações completas da venda
            </DialogDescription>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{selectedSale.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    Venda realizada em {formatDate(selectedSale.createdAt)}
                  </p>
                  {selectedSale.deliveryDate && (
                    <p className="text-sm text-muted-foreground">
                      Entregue em {formatDate(selectedSale.deliveryDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Itens da Venda */}
              <div>
                <h3 className="font-semibold mb-2">Itens</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-20">Qtd</TableHead>
                        <TableHead className="w-24">Preço</TableHead>
                        <TableHead className="w-24">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item) => (
                        <TableRow key={item.productId} className={item.isCustomPrice ? 'bg-orange-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.productName}
                              {item.isCustomPrice && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  Especial
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-semibold">
                          Total da Venda:
                        </TableCell>
                        <TableCell className="font-bold text-lg text-primary">
                          {formatCurrency(selectedSale.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Status e Observações */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <Badge className={getStatusColor(selectedSale.status)}>
                    {getStatusIcon(selectedSale.status)}
                    <span className="ml-1">{selectedSale.status}</span>
                  </Badge>
                </div>

                {selectedSale.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Observações</h3>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{selectedSale.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="flex-1">
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

export default SalesManager;