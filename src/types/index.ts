// ============================================================================
// File: index.ts
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Frontend Type Definitions
// Description: Strongly typed TypeScript interfaces mapping directly to the
//              GridLink C# Web API models and DTOs.
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export type UserRole = 'BackOffice' | 'GridOperator' | 'Prosumer';
export type UserStatus = 'Active' | 'Inactive' | 'PendingApproval';

export interface User {
  id: string;
  nic: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  nic: string;
  role: UserRole;
  token: string;
}

export interface UpdateUserDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: UserRole;
}

