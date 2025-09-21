interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: string;
  telefono?: string;
  descripcion?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  permisos: string[];
}

interface CreateUserData {
  username: string;
  email: string;
  nombre_completo: string;
  password: string;
  rol: string;
  telefono?: string;
  descripcion?: string;
}

interface UpdateUserData {
  username?: string;
  email?: string;
  nombre_completo?: string;
  rol?: string;
  telefono?: string;
  descripcion?: string;
  is_active?: boolean;
  password?: string;
}

class UserService {
  private baseUrl = 'http://5.189.146.163:8000/api/v1/auth';

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/usuarios`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }

    return response.json();
  }

  async getUserById(id: number): Promise<User> {
    const response = await fetch(`${this.baseUrl}/usuarios/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener usuario');
    }

    return response.json();
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/crear-usuario`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear usuario');
    }

    return response.json();
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/usuarios/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar usuario');
    }

    return response.json();
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/usuarios/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al eliminar usuario');
    }
  }
}

export const userService = new UserService();
export type { User, CreateUserData, UpdateUserData };
