import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Search,
  Filter,
  TrendingUp,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { SalesSystem } from '@/lib/salesSystem';
import { AuthService } from '@/lib/auth';
import { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockOperation, setStockOperation] = useState<'add' | 'set'>('add');
  const [stockValue, setStockValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const loadProducts = () => {
    const allProducts = SalesSystem.getProducts();
    setProducts(allProducts);
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category))];
    return categories;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      stock: '',
      category: '',
      description: '',
      image: ''
    });
    setSelectedImage(null);
  };

  // 📸 SISTEMA DE UPLOAD DE IMAGEM - MUITO FÁCIL DE USAR!
  // Como usar: 
  // 1. Clique no botão "Escolher Arquivo"
  // 2. Selecione uma imagem PNG ou JPEG do seu dispositivo
  // 3. A imagem aparecerá automaticamente como preview
  // 4. Ao salvar o produto, a imagem será salva junto
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem válida
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (PNG, JPEG, JPG)');
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }

      // Converter para base64 para salvar no localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setFormData({...formData, image: result});
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover imagem
  const removeImage = () => {
    setSelectedImage(null);
    setFormData({...formData, image: ''});
  };

  const handleCreate = () => {
    if (!formData.name || !formData.price || !formData.category) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const newProduct = SalesSystem.createProduct({
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      description: formData.description,
      image: formData.image // Imagem será salva aqui
    });

    loadProducts();
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedProduct || !formData.name || !formData.price || !formData.category) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const updatedProduct: Product = {
      ...selectedProduct,
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      description: formData.description,
      image: formData.image // Imagem atualizada
    };

    SalesSystem.updateProduct(updatedProduct);
    loadProducts();
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Tem certeza que deseja deletar o produto "${product.name}"?`)) {
      SalesSystem.deleteProduct(product.id);
      loadProducts();
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || '',
      image: product.image || ''
    });
    setSelectedImage(product.image || null);
    setIsEditModalOpen(true);
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockValue('');
    setIsStockModalOpen(true);
  };

  const handleStockUpdate = () => {
    if (!selectedProduct || !stockValue) {
      alert('Digite um valor válido');
      return;
    }

    const value = parseInt(stockValue);
    if (isNaN(value) || value < 0) {
      alert('Digite um número válido');
      return;
    }

    const newStock = stockOperation === 'add' 
      ? selectedProduct.stock + value 
      : value;

    SalesSystem.updateStock(selectedProduct.id, newStock);
    loadProducts();
    setIsStockModalOpen(false);
    setSelectedProduct(null);
    setStockValue('');
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sem Estoque', color: 'bg-red-500', textColor: 'text-red-700' };
    if (stock <= 10) return { label: 'Estoque Baixo', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (stock <= 50) return { label: 'Estoque Médio', color: 'bg-blue-500', textColor: 'text-blue-700' };
    return { label: 'Estoque Alto', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const canManageProducts = AuthService.hasPermission('products');

  if (!canManageProducts) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de cocadas e controle de estoque
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Produto</DialogTitle>
              <DialogDescription>
                Adicione um novo produto ao catálogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Cocada Tradicional"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="13.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Estoque Inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tradicional">Tradicional</SelectItem>
                    <SelectItem value="Sabores">Sabores</SelectItem>
                    <SelectItem value="Cremosa">Cremosa</SelectItem>
                    <SelectItem value="Especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 📸 SEÇÃO DE UPLOAD DE IMAGEM - SUPER FÁCIL! */}
              <div>
                <Label htmlFor="image">📸 Foto do Produto</Label>
                <div className="space-y-3">
                  {/* Botão para selecionar imagem */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Escolher Foto
                    </Button>
                    {selectedImage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="text-red-600 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                  
                  {/* Input oculto para upload */}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {/* Preview da imagem */}
                  {selectedImage ? (
                    <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-primary/20">
                      <img 
                        src={selectedImage} 
                        alt="Preview do produto" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          ✓ Foto Adicionada
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma foto selecionada</p>
                        <p className="text-xs text-muted-foreground">PNG, JPEG ou JPG</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Dica: Adicione uma foto para deixar seu produto mais atrativo!
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do produto..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreate} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Criar Produto
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
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {getCategories().map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          
          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                {/* Imagem do produto */}
                {product.image ? (
                  <div className="w-full h-32 bg-muted rounded-lg overflow-hidden mb-3 relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary/80 text-white text-xs">
                        📸 Com Foto
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Sem foto</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {product.category}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className={stockStatus.textColor}>
                    {stockStatus.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Estoque</div>
                    <div className="text-lg font-semibold">{product.stock} potes</div>
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStockModal(product)}
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Estoque
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro produto'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Produto *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Preço (R$) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-stock">Estoque</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tradicional">Tradicional</SelectItem>
                  <SelectItem value="Sabores">Sabores</SelectItem>
                  <SelectItem value="Cremosa">Cremosa</SelectItem>
                  <SelectItem value="Especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 📸 SEÇÃO DE UPLOAD DE IMAGEM NO MODAL DE EDIÇÃO */}
            <div>
              <Label htmlFor="edit-image">📸 Foto do Produto</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-image-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {selectedImage ? 'Trocar Foto' : 'Escolher Foto'}
                  </Button>
                  {selectedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="text-red-600 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
                
                <input
                  id="edit-image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {selectedImage ? (
                  <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-primary/20">
                    <img 
                      src={selectedImage} 
                      alt="Preview do produto" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white">
                        ✓ Foto Atualizada
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma foto selecionada</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEdit} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Estoque */}
      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Estoque atual: {selectedProduct?.stock} potes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Operação</Label>
              <Select value={stockOperation} onValueChange={(value: 'add' | 'set') => setStockOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Adicionar ao estoque
                    </div>
                  </SelectItem>
                  <SelectItem value="set">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Definir estoque total
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stock-value">
                {stockOperation === 'add' ? 'Quantidade a adicionar' : 'Novo estoque total'}
              </Label>
              <Input
                id="stock-value"
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                placeholder="0"
              />
            </div>

            {stockOperation === 'add' && stockValue && (
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-sm">
                  <strong>Novo estoque:</strong> {(selectedProduct?.stock || 0) + parseInt(stockValue || '0')} potes
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleStockUpdate} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Atualizar Estoque
              </Button>
              <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManager;