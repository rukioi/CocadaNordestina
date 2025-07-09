import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Key, 
  Bell, 
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  History
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { User, AuditLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: User['role'];
  active: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SystemSettings {
  notifications: boolean;
  autoBackup: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
}

const SettingsManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Vendedor',
    active: true
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    notifications: true,
    autoBackup: true,
    lowStockAlert: true,
    lowStockThreshold: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(AuthService.getAllUsers());
    setAuditLogs(AuthService.getAuditLogs());
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Vendedor',
      active: true
    });
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const validateUserForm = () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      alert('Preencha todos os campos obrigatórios');
      return false;
    }

    if (userForm.password !== userForm.confirmPassword) {
      alert('As senhas não coincidem');
      return false;
    }

    if (userForm.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    // Verificar se email já existe
    const existingUser = users.find(u => u.email === userForm.email && (!selectedUser || u.id !== selectedUser.id));
    if (existingUser) {
      alert('Este email já está em uso');
      return false;
    }

    return true;
  };

  const handleCreateUser = () => {
    if (!validateUserForm()) return;

    const newUser = AuthService.createUser({
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
      active: userForm.active
    });

    loadData();
    setIsCreateUserModalOpen(false);
    resetUserForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    // Validação básica
    if (!userForm.name || !userForm.email) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Verificar se email já existe
    const existingUser = users.find(u => u.email === userForm.email && u.id !== selectedUser.id);
    if (existingUser) {
      alert('Este email já está em uso');
      return;
    }

    const updatedUser: User = {
      ...selectedUser,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      active: userForm.active
    };

    // Se uma nova senha foi fornecida
    if (userForm.password) {
      if (userForm.password !== userForm.confirmPassword) {
        alert('As senhas não coincidem');
        return;
      }
      if (userForm.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      (updatedUser as User & { password: string }).password = userForm.password;
    }

    AuthService.updateUser(updatedUser);
    loadData();
    setIsEditUserModalOpen(false);
    setSelectedUser(null);
    resetUserForm();
  };

  const handleDeleteUser = (user: User) => {
    const currentUser = AuthService.getCurrentUser();
    
    if (user.id === currentUser?.id) {
      alert('Você não pode deletar sua própria conta');
      return;
    }

    if (confirm(`Tem certeza que deseja deletar o usuário "${user.name}"?`)) {
      AuthService.deleteUser(user.id);
      loadData();
    }
  };

  const handleChangePassword = () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Preencha todos os campos');
      return;
    }

    if ((currentUser as User & { password: string }).password !== passwordForm.currentPassword) {
      alert('Senha atual incorreta');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('As novas senhas não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    const updatedUser = { ...currentUser, password: passwordForm.newPassword } as User & { password: string };
    AuthService.updateUser(updatedUser);
    
    setIsChangePasswordModalOpen(false);
    resetPasswordForm();
    alert('Senha alterada com sucesso!');
  };

  const openEditUserModal = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      active: user.active
    });
    setIsEditUserModalOpen(true);
  };

  const exportData = () => {
    const exportUsers = users.map(u => {
      const { password, ...userWithoutPassword } = u as User & { password: string };
      return { ...userWithoutPassword, password: '***' };
    });
    
    const data = {
      users: exportUsers,
      auditLogs: auditLogs,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-cocada-nordestina-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'Administrador': return 'bg-red-100 text-red-800 border-red-200';
      case 'Gerente': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Vendedor': return 'bg-green-100 text-green-800 border-green-200';
      case 'Estoquista': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === 'Administrador';

  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, segurança e configurações do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Gestão de Usuários */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestão de Usuários</h2>
            {isAdmin && (
              <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Adicione um novo usuário ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={userForm.name}
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                        placeholder="Nome do usuário"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          placeholder="Mínimo 6 caracteres"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={userForm.confirmPassword}
                          onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                          placeholder="Repita a senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Função</Label>
                      <Select value={userForm.role} onValueChange={(value: User['role']) => setUserForm({...userForm, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrador">Administrador</SelectItem>
                          <SelectItem value="Gerente">Gerente</SelectItem>
                          <SelectItem value="Vendedor">Vendedor</SelectItem>
                          <SelectItem value="Estoquista">Estoquista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={userForm.active}
                        onCheckedChange={(checked) => setUserForm({...userForm, active: checked})}
                      />
                      <Label htmlFor="active">Usuário ativo</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleCreateUser} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Criar Usuário
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className={`${!user.active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription className="mt-1">{user.email}</CardDescription>
                    </div>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Criado em</div>
                    <div>{formatDate(user.createdAt)}</div>
                  </div>
                  
                  {user.lastLogin && (
                    <div className="text-sm">
                      <div className="text-muted-foreground">Último acesso</div>
                      <div>{formatDate(user.lastLogin)}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">{user.active ? 'Ativo' : 'Inativo'}</span>
                  </div>

                  <Separator />

                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditUserModal(user)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      {user.id !== currentUser.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="security" className="space-y-4">
          <h2 className="text-xl font-semibold">Configurações de Segurança</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura alterando sua senha regularmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isChangePasswordModalOpen} onOpenChange={setIsChangePasswordModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                      Digite sua senha atual e a nova senha
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Senha Atual *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        placeholder="Sua senha atual"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Nova Senha *</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmNewPassword">Confirmar Nova Senha *</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        placeholder="Repita a nova senha"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleChangePassword} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Alterar Senha
                      </Button>
                      <Button variant="outline" onClick={() => setIsChangePasswordModalOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Suas informações pessoais no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Nome</Label>
                <div className="font-medium">{currentUser.name}</div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="font-medium">{currentUser.email}</div>
              </div>
              <div>
                <Label>Função</Label>
                <Badge className={getRoleColor(currentUser.role)}>
                  {currentUser.role}
                </Badge>
              </div>
              <div>
                <Label>Conta criada em</Label>
                <div className="font-medium">{formatDate(currentUser.createdAt)}</div>
              </div>
              {currentUser.lastLogin && (
                <div>
                  <Label>Último acesso</Label>
                  <div className="font-medium">{formatDate(currentUser.lastLogin)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-4">
          <h2 className="text-xl font-semibold">Configurações do Sistema</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações gerais</Label>
                  <p className="text-sm text-muted-foreground">Receber notificações do sistema</p>
                </div>
                <Switch
                  checked={systemSettings.notifications}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, notifications: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alerta de estoque baixo</Label>
                  <p className="text-sm text-muted-foreground">Notificar quando produtos estiverem com estoque baixo</p>
                </div>
                <Switch
                  checked={systemSettings.lowStockAlert}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, lowStockAlert: checked})}
                />
              </div>

              {systemSettings.lowStockAlert && (
                <div>
                  <Label htmlFor="threshold">Limite de estoque baixo</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    value={systemSettings.lowStockThreshold}
                    onChange={(e) => setSystemSettings({...systemSettings, lowStockThreshold: parseInt(e.target.value) || 10})}
                    className="w-24"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Alertar quando estoque for menor ou igual a este valor
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup e Dados</CardTitle>
              <CardDescription>
                Gerencie backups e dados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Backup automático</Label>
                  <p className="text-sm text-muted-foreground">Fazer backup automático dos dados</p>
                </div>
                <Switch
                  checked={systemSettings.autoBackup}
                  onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoBackup: checked})}
                />
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
                
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Dados
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  O backup inclui todos os dados do sistema exceto senhas de usuários.
                  Mantenha seus backups em local seguro.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auditoria */}
        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-xl font-semibold">Log de Auditoria</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                Histórico de ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.slice(0, 50).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.userName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {auditLogs.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
                    <p className="text-muted-foreground">
                      As atividades do sistema aparecerão aqui
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Usuário */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
              <Input
                id="edit-password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                placeholder="Nova senha (opcional)"
              />
            </div>

            {userForm.password && (
              <div>
                <Label htmlFor="edit-confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="edit-confirmPassword"
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                  placeholder="Confirme a nova senha"
                />
              </div>
            )}

            <div>
              <Label>Função</Label>
              <Select value={userForm.role} onValueChange={(value: User['role']) => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Estoquista">Estoquista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={userForm.active}
                onCheckedChange={(checked) => setUserForm({...userForm, active: checked})}
              />
              <Label htmlFor="edit-active">Usuário ativo</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditUser} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsManager;