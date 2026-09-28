// ============================================================================
// File: api.ts
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Frontend API Client Service
// Description: Centralized service communicating with the C# Web API on IIS /
//              Kestrel. Handles authorization tokens, error parsing, environment
//              configurations, and all domain endpoints (Users, Prosumers,
//              Microgrid Hubs, Booking Slots, Energy Reservations).
// ============================================================================

import {
  ApiResponse,
  AuthUser,
  UpdateUserDTO,
  User,
} from '../types';

// Load API base URL from Vite environment variable or fallback to default ASP.NET Core port
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = (rawBaseUrl !== undefined && rawBaseUrl !== null ? rawBaseUrl : 'http://localhost:5015').replace(/\/$/, '');

// Helper to retrieve JWT token from browser storage
const getToken = (): string | null => {
  return localStorage.getItem('gridlink_token');
};

// Generic type-safe HTTP request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      // Parse ASP.NET Core Validation Problem details or custom ApiResponse
      let errorMsg = data?.message || data?.title;
      let errorList: string[] = [];

      if (data?.errors) {
        if (Array.isArray(data.errors)) {
          errorList = data.errors;
        } else if (typeof data.errors === 'object') {
          // ASP.NET ModelState validation dictionary { Field: ["error1", "error2"] }
          errorList = Object.values(data.errors).flat() as string[];
        }
      }

      if (!errorMsg && errorList.length > 0) {
        errorMsg = errorList.join(', ');
      }

      return {
        success: false,
        message: errorMsg || `HTTP error ${res.status}: ${res.statusText}`,
        errors: errorList.length > 0 ? errorList : undefined,
      };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>;
    }

    return {
      success: true,
      message: 'Success',
      data: data as T,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || `Network error occurred. Please verify the API is running at ${API_BASE_URL || window.location.origin}.`,
    };
  }
}

export const api = {
  // --------------------------------------------------------------------------
  // Base Configuration
  // --------------------------------------------------------------------------
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  // --------------------------------------------------------------------------
  // Authentication & Session
  // --------------------------------------------------------------------------
  async login(emailOrNic: string, password: string): Promise<ApiResponse<AuthUser>> {
    interface BackendAuthData {
      token: string;
      expiration: string;
      user: User;
    }
    const res = await request<BackendAuthData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: emailOrNic.trim(),
        email: emailOrNic.trim(),
        password,
      }),
    });

    if (res.success && res.data) {
      const authUser: AuthUser = {
        id: res.data.user.id,
        email: res.data.user.email,
        fullName: res.data.user.fullName,
        nic: res.data.user.nic,
        role: res.data.user.role,
        token: res.data.token,
      };
      return {
        success: true,
        message: res.message || 'Login successful.',
        data: authUser,
      };
    }

    return {
      success: false,
      message: res.message || 'Invalid credentials or login failed.',
      errors: res.errors,
    };
  },


  // --------------------------------------------------------------------------
  // User Management (BackOffice System Admin)
  // --------------------------------------------------------------------------
  async getUsers(role?: string, status?: string): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    const queryString = params.toString();
    return request<User[]>(`/api/Users${queryString ? `?${queryString}` : ''}`);
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return request<User>(`/api/Users/${id}`);
  },

  async getUserByNic(nic: string): Promise<ApiResponse<User>> {
    return request<User>(`/api/Users/nic/${encodeURIComponent(nic)}`);
  },

  async createUser(payload: {
    nic: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    password: string;
    role: string;
  }): Promise<ApiResponse<User>> {
    return request<User>('/api/Users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUser(id: string, payload: UpdateUserDTO): Promise<ApiResponse<User>> {
    return request<User>(`/api/Users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    return request<boolean>(`/api/Users/${id}`, {
      method: 'DELETE',
    });
  },

  async activateUser(id: string): Promise<ApiResponse<User>> {
    return request<User>(`/api/Users/${id}/activate`, {
      method: 'PUT',
    });
  },

  async deactivateUser(id: string): Promise<ApiResponse<User>> {
    return request<User>(`/api/Users/${id}/deactivate`, {
      method: 'PUT',
    });
  },

  async toggleUserStatus(id: string, currentStatus: string): Promise<ApiResponse<User>> {
    const action = currentStatus === 'Active' ? 'deactivate' : 'activate';
    return request<User>(`/api/Users/${id}/${action}`, {
      method: 'PUT',
    });
  },

  async getPendingUserActivations(): Promise<ApiResponse<User[]>> {
    return request<User[]>('/api/Users/pending-activations');
  },
};
