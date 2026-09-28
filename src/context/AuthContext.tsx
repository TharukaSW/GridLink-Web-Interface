// ============================================================================
// File: AuthContext.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Authentication Context
// Description: Provides user authentication state, JWT storage in localStorage,
//              role checks (BackOffice vs Grid Operator), login and logout.
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBackOffice: boolean;
  isGridOperator: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restore session from localStorage on initialization
  useEffect(() => {
    const storedUser = localStorage.getItem('gridlink_user');
    const storedToken = localStorage.getItem('gridlink_token');

    if (storedUser && storedToken) {
      try {
        const parsed: AuthUser = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('gridlink_user');
        localStorage.removeItem('gridlink_token');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      setUser(res.data);
      localStorage.setItem('gridlink_user', JSON.stringify(res.data));
      localStorage.setItem('gridlink_token', res.data.token);
      return { success: true, message: res.message || 'Login successful', user: res.data };
    }
    return { success: false, message: res.message || 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gridlink_user');
    localStorage.removeItem('gridlink_token');
  };

  const isBackOffice = user?.role === 'BackOffice';
  const isGridOperator = user?.role === 'GridOperator';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isBackOffice,
        isGridOperator,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
