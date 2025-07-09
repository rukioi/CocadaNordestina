import { User, AuditLog } from './types';

// Estender User para incluir password
interface UserWithPassword extends User {
  password: string;
}

const STORAGE_KEYS = {
  USERS: 'cocada_users',
  CURRENT_USER: 'cocada_current_user',
  AUDIT_LOGS: 'cocada_audit_logs'
};

// Usuário admin inicial
const INITIAL_ADMIN: UserWithPassword = {
  id: '1',
  name: 'Adriana Souza',
  email: 'adriana@cocadanordestina.com',
  password: 'murilo05',
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
    const users: UserWithPassword[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userWithPassword = users.find(u => u.email === email && u.password === password && u.active);
    
    if (userWithPassword) {
      const { password: _, ...user } = userWithPassword;
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      this.updateUser({ ...userWithPassword, lastLogin: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      
      this.addAuditLog(user.id, user.name, 'LOGIN', 'Usuário fez login no sistema');
      return updatedUser;
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

    const permissions: Record<User['role'], string[]> = {
      'Administrador': ['*'],
      'Gerente': ['sales', 'products', 'customers', 'delivery', 'reports'],
      'Vendedor': ['sales', 'customers'],
      'Estoquista': ['products', 'stock']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  }

  static getAllUsers(): User[] {
    const usersWithPassword: UserWithPassword[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return usersWithPassword.map(({ password, ...user }) => user);
  }

  static createUser(userData: Omit<UserWithPassword, 'id' | 'createdAt'>): User {
    const users: UserWithPassword[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const newUserWithPassword: UserWithPassword = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUserWithPassword);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addAuditLog(currentUser.id, currentUser.name, 'CREATE_USER', `Criou usuário: ${newUserWithPassword.name}`);
    }
    
    const { password, ...newUser } = newUserWithPassword;
    return newUser;
  }

  static updateUser(userData: UserWithPassword | User): void {
    const users: UserWithPassword[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.id === userData.id);
    
    if (index !== -1) {
      if ('password' in userData) {
        users[index] = userData as UserWithPassword;
      } else {
        users[index] = { ...users[index], ...userData };
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Atualizar usuário atual se for o mesmo
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userData.id) {
        const { password, ...userWithoutPassword } = users[index];
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
      }
    }
  }

  static deleteUser(userId: string): void {
    const users: UserWithPassword[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
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