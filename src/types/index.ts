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

export interface MicrogridNode {
  id: string;
  stationCode: string;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  capacityKWh: number;
  totalBatterySlots: number;
  availableBatterySlots: number;
  operatingHours: string;
  isActive: boolean;
  distanceKm?: number;
  activeReservationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMicrogridNodeDTO {
  stationCode: string;
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  capacityKWh: number;
  totalBatterySlots: number;
  availableBatterySlots?: number;
  operatingHours: string;
}

export interface UpdateMicrogridNodeDTO {
  stationName: string;
  address: string;
  latitude: number;
  longitude: number;
  capacityKWh: number;
  totalBatterySlots: number;
  availableBatterySlots: number;
  operatingHours: string;
  isActive: boolean;
}

export interface BookingSlot {
  id: string;
  stationId: string;
  slotNumber: number;
  slotTime: string;
  durationMinutes: number;
  capacityKWh: number;
  ratePerKWh: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  userId: string;
  nic: string;
  prosumerName: string;
  prosumerContact: string;
  stationId: string;
  stationName: string;
  slotId?: string;
  slotNumber?: number;
  reservationDateTime: string;
  durationMinutes: number;
  tradingType: 'DropOff' | 'Charging';
  requestedEnergyKWh: number;
  status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled' | 'Rejected';
  qrCodeData: string;
  qrCodeImageBase64?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  actualEnergyTransferredKWh?: number;
  operatorNotes?: string;
  createdAt: string;
}

export interface CreateReservationDTO {
  stationId: string;
  slotId?: string;
  slotNumber?: number;
  reservationDateTime: string;
  durationMinutes: number;
  tradingType: string;
  requestedEnergyKWh: number;
}

export interface UpdateUserDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: UserRole;
}

export interface UpdateSlotDTO {
  slotTime: string;
  durationMinutes: number;
  capacityKWh: number;
  ratePerKWh: number;
  isAvailable: boolean;
}

export interface UpdateReservationDTO {
  reservationDateTime: string;
  durationMinutes: number;
  requestedEnergyKWh: number;
  tradingType: string;
  stationId?: string;
}

export interface ReservationDashboardSummary {
  totalReservations: number;
  activeCount?: number;
  activeReservations?: number;
  pendingCount: number;
  approvedFutureCount?: number;
  approvedCount?: number;
  completedCount: number;
  cancelledCount: number;
  recentReservations?: Reservation[];
}

