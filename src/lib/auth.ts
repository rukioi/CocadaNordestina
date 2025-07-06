import { User, AuditLog } from './types';

const STORAGE_KEYS = {
  USERS: 'cocada_users',
  CURRENT_USER: 'cocada_current_user',
  AUDIT_LOGS: 'cocada_audit_logs'
};

// Usuário admin inicial
const INITIAL_ADMIN: User = {
  id: '1',
  name: 'Adriana Souza',
  email: 'adriana@cocadanordestina.com',
  password: 'murilo05', // Em produção, seria hasheado
  role: 'Administrador',
  active: true,
  createdAt: new Date().toISOString()
};

export class AuthService {
  static initializeUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!users) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([INITIAL_ADMIN]));
    }
  }

  static async login(email: string, password: string): Promise<User | null> {
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password && u.active);
    
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.updateUser(user);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      
      this.addAuditLog(user.id, user.name, 'LOGIN', 'Usuário fez login no sistema');
      return user;
    }
    
    return null;
  }

  static logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addAuditLog(currentUser.id, currentUser.name, 'LOGOUT', 'Usuário fez logout do sistema');
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  static getCurrentUser(): User | null {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  }

  static hasPermission(action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const permissions = {
      'Administrador': ['*'],
      'Gerente': ['sales', 'products', 'customers', 'delivery', 'reports'],
      'Vendedor': ['sales', 'customers'],
      'Estoquista': ['products', 'stock']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  }

  static getAllUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  static createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getAllUsers();
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addAuditLog(currentUser.id, currentUser.name, 'CREATE_USER', `Criou usuário: ${newUser.name}`);
    }
    
    return newUser;
  }

  static updateUser(userData: User): void {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userData.id);
    
    if (index !== -1) {
      users[index] = userData;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Atualizar usuário atual se for o mesmo
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userData.id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
      }
    }
  }

  static deleteUser(userId: string): void {
    const users = this.getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
    
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const deletedUser = users.find(u => u.id === userId);
      this.addAuditLog(currentUser.id, currentUser.name, 'DELETE_USER', `Deletou usuário: ${deletedUser?.name}`);
    }
  }

  static addAuditLog(userId: string, userName: string, action: string, details: string): void {
    const logs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const newLog: AuditLog = {
      id: Date.now().toString(),
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    
    logs.unshift(newLog);
    // Manter apenas os últimos 1000 logs
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  static getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }
}

// Inicializar usuários na primeira execução
AuthService.initializeUsers();