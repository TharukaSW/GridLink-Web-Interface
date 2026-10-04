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
  BookingSlot,
  CreateMicrogridNodeDTO,
  CreateReservationDTO,
  MicrogridNode,
  ProsumerProfile,
  Reservation,
  ReservationDashboardSummary,
  UpdateMicrogridNodeDTO,
  UpdateReservationDTO,
  UpdateSlotDTO,
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

  async registerProsumerAuth(payload: {
    nic: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    password: string;
  }): Promise<ApiResponse<User>> {
    return request<User>('/api/auth/register-prosumer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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

  // --------------------------------------------------------------------------
  // Prosumer Profile Management (NIC Primary Key)
  // --------------------------------------------------------------------------
  async getProsumers(status?: string): Promise<ApiResponse<ProsumerProfile[]>> {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<ProsumerProfile[]>(`/api/prosumers${params}`);
  },

  async getProsumerByNic(nic: string): Promise<ApiResponse<ProsumerProfile>> {
    return request<ProsumerProfile>(`/api/prosumers/${encodeURIComponent(nic)}`);
  },

  async registerProsumer(payload: {
    nic: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    password: string;
  }): Promise<ApiResponse<ProsumerProfile>> {
    return request<ProsumerProfile>('/api/prosumers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProsumerProfile(
    nic: string,
    payload: {
      fullName: string;
      email: string;
      phoneNumber: string;
      address: string;
    }
  ): Promise<ApiResponse<ProsumerProfile>> {
    return request<ProsumerProfile>(`/api/prosumers/${encodeURIComponent(nic)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async activateProsumer(nic: string): Promise<ApiResponse<any>> {
    return request<any>(`/api/prosumers/${encodeURIComponent(nic)}/activate`, {
      method: 'PATCH',
    });
  },

  async deactivateProsumer(nic: string): Promise<ApiResponse<any>> {
    return request<any>(`/api/prosumers/${encodeURIComponent(nic)}/deactivate`, {
      method: 'PATCH',
    });
  },

  async requestProsumerDeactivation(nic: string): Promise<ApiResponse<any>> {
    return request<any>(`/api/prosumers/${encodeURIComponent(nic)}/request-deactivation`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Solar Microgrid Node Management
  // --------------------------------------------------------------------------
  async getMicrogridNodes(params?: {
    searchTerm?: string;
    isActive?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
  }): Promise<ApiResponse<MicrogridNode[]>> {
    const query = new URLSearchParams();
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.minCapacity) query.append('minCapacity', String(params.minCapacity));
    if (params?.maxCapacity) query.append('maxCapacity', String(params.maxCapacity));
    const qs = query.toString();
    return request<MicrogridNode[]>(`/api/microgrid-nodes${qs ? `?${qs}` : ''}`);
  },

  async getNearbyNodes(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<ApiResponse<MicrogridNode[]>> {
    return request<MicrogridNode[]>(
      `/api/microgrid-nodes/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`
    );
  },

  async getMicrogridNodeById(id: string): Promise<ApiResponse<MicrogridNode>> {
    return request<MicrogridNode>(`/api/microgrid-nodes/${id}`);
  },

  async getNodeByCode(stationCode: string): Promise<ApiResponse<MicrogridNode>> {
    return request<MicrogridNode>(`/api/microgrid-nodes/code/${encodeURIComponent(stationCode)}`);
  },

  async createMicrogridNode(payload: CreateMicrogridNodeDTO): Promise<ApiResponse<MicrogridNode>> {
    return request<MicrogridNode>('/api/microgrid-nodes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMicrogridNode(id: string, payload: UpdateMicrogridNodeDTO): Promise<ApiResponse<MicrogridNode>> {
    return request<MicrogridNode>(`/api/microgrid-nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateSchedule(id: string, operatingHours: string): Promise<ApiResponse<MicrogridNode>> {
    return request<MicrogridNode>(`/api/microgrid-nodes/${id}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ operatingHours }),
    });
  },

  async updateBatterySlots(id: string, availableBatterySlots: number): Promise<ApiResponse<MicrogridNode>> {
    return request<MicrogridNode>(`/api/microgrid-nodes/${id}/battery-slots`, {
      method: 'PATCH',
      body: JSON.stringify({ availableBatterySlots }),
    });
  },

  async deactivateNode(id: string): Promise<ApiResponse<boolean>> {
    return request<boolean>(`/api/microgrid-nodes/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async activateNode(id: string): Promise<ApiResponse<boolean>> {
    return request<boolean>(`/api/microgrid-nodes/${id}/activate`, {
      method: 'PATCH',
    });
  },

  async deleteNode(id: string): Promise<ApiResponse<boolean>> {
    return request<boolean>(`/api/microgrid-nodes/${id}`, {
      method: 'DELETE',
    });
  },

  // --------------------------------------------------------------------------
  // Booking Slots Management
  // --------------------------------------------------------------------------
  async getSlotsByStation(stationId: string, availableOnly?: boolean): Promise<ApiResponse<BookingSlot[]>> {
    const params = availableOnly !== undefined ? `?availableOnly=${availableOnly}` : '';
    return request<BookingSlot[]>(`/api/microgrid-nodes/${stationId}/slots${params}`);
  },

  async getSlotById(slotId: string): Promise<ApiResponse<BookingSlot>> {
    return request<BookingSlot>(`/api/microgrid-nodes/slots/${slotId}`);
  },

  async createSlot(
    stationId: string,
    payload: {
      slotTime: string;
      durationMinutes: number;
      capacityKWh: number;
      ratePerKWh: number;
      isAvailable: boolean;
    }
  ): Promise<ApiResponse<BookingSlot>> {
    return request<BookingSlot>(`/api/microgrid-nodes/${stationId}/slots`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSlot(slotId: string, payload: UpdateSlotDTO): Promise<ApiResponse<BookingSlot>> {
    return request<BookingSlot>(`/api/microgrid-nodes/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteSlot(slotId: string): Promise<ApiResponse<boolean>> {
    return request<boolean>(`/api/microgrid-nodes/slots/${slotId}`, {
      method: 'DELETE',
    });
  },

  // --------------------------------------------------------------------------
  // Energy Slot Reservations & Power Trading
  // --------------------------------------------------------------------------
  async getReservations(filter?: {
    searchTerm?: string;
    status?: string;
    stationId?: string;
    nic?: string;
  }): Promise<ApiResponse<Reservation[]>> {
    const query = new URLSearchParams();
    if (filter?.searchTerm) query.append('searchTerm', filter.searchTerm);
    if (filter?.status) query.append('status', filter.status);
    if (filter?.stationId) query.append('stationId', filter.stationId);
    if (filter?.nic) query.append('nic', filter.nic);
    const qs = query.toString();
    return request<Reservation[]>(`/api/Reservations${qs ? `?${qs}` : ''}`);
  },

  async getMyReservations(status?: string): Promise<ApiResponse<Reservation[]>> {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Reservation[]>(`/api/Reservations/my-bookings${params}`);
  },

  async getReservationById(id: string): Promise<ApiResponse<Reservation>> {
    return request<Reservation>(`/api/Reservations/${id}`);
  },

  async createReservation(payload: CreateReservationDTO): Promise<ApiResponse<Reservation>> {
    return request<Reservation>('/api/Reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateReservation(id: string, payload: UpdateReservationDTO): Promise<ApiResponse<Reservation>> {
    return request<Reservation>(`/api/Reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async cancelReservation(id: string, reason: string): Promise<ApiResponse<Reservation>> {
    return request<Reservation>(`/api/Reservations/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async approveReservation(id: string): Promise<ApiResponse<Reservation>> {
    return request<Reservation>(`/api/Reservations/${id}/approve`, {
      method: 'PUT',
    });
  },

  async verifyQrCode(qrData: string): Promise<ApiResponse<Reservation>> {
    return request<Reservation>('/api/Reservations/verify', {
      method: 'POST',
      body: JSON.stringify(qrData),
    });
  },

  async finalizeReservation(
    id: string,
    payload: {
      actualEnergyTransferredKWh: number;
      operatorNotes?: string;
    }
  ): Promise<ApiResponse<Reservation>> {
    return request<Reservation>(`/api/Reservations/${id}/finalize`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getDashboardSummary(nic?: string): Promise<ApiResponse<ReservationDashboardSummary>> {
    const params = nic ? `?nic=${encodeURIComponent(nic)}` : '';
    return request<ReservationDashboardSummary>(`/api/Reservations/dashboard/summary${params}`);
  },

  async getAvailableStations(): Promise<ApiResponse<any[]>> {
    return request<any[]>('/api/Reservations/stations');
  },
};
