import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/', permission: '*' },
    { icon: Package, label: 'Produtos', path: '/products', permission: 'products' },
    { icon: Users, label: 'Clientes', path: '/customers', permission: 'customers' },
    { icon: ShoppingCart, label: 'Vendas', path: '/sales', permission: 'sales' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports', permission: 'reports' },
    { icon: Settings, label: 'Configurações', path: '/settings', permission: '*' },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.permission === '*' || AuthService.hasPermission(item.permission)
  );

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coconut-50 to-secondary/20 flex">
      {/* Sidebar - FIXO */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <img 
              src="https://images.pexels.com/photos/87818/background-coconut-brown-fruit-87818.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" 
              alt="Cocada Nordestina" 
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div>
              <h1 className="font-bold text-primary text-lg">Cocada</h1>
              <p className="text-xs text-muted-foreground">Nordestina</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.role}</p>
              <Badge variant="secondary" className="text-xs mt-1">
                {currentUser.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Button
                key={item.path}
                variant={active ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-11 ${
                  active 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-border/40 px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="p-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <img 
            src="https://images.pexels.com/photos/87818/background-coconut-brown-fruit-87818.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1" 
            alt="Cocada Nordestina" 
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="font-semibold text-primary">Cocada Nordestina</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2 relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-warning text-warning-foreground">
              3
            </Badge>
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content - CORRIGIDO PARA FICAR AO LADO DA SIDEBAR */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0 min-h-screen">
        <main className="h-full max-w-7xl mx-auto p-4 lg:p-6 container-mobile">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;