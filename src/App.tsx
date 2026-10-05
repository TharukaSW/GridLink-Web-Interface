// ============================================================================
// File: App.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Main React Application Root
// Description: Primary routing and layout container connecting the Navbar,
//              role-protected pages, and Footer within AuthProvider.
// ============================================================================

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MicrogridNodesPage } from './pages/MicrogridNodesPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { UsersPage } from './pages/UsersPage';
import { ProsumersPage } from './pages/ProsumersPage';
import { OperatorScannerPage } from './pages/OperatorScannerPage';
import { StationsMapPage } from './pages/StationsMapPage';

import { AuthUser } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, isBackOffice, isGridOperator } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');

  const handleLoginSuccess = (loggedInUser?: AuthUser) => {
    if (loggedInUser?.role === 'GridOperator') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return isAuthenticated ? <DashboardPage onNavigate={setCurrentPage} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'nodes':
        return isAuthenticated ? <MicrogridNodesPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'reservations':
        return isAuthenticated ? <ReservationsPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'map':
        return isAuthenticated ? <StationsMapPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'prosumers':
        return isAuthenticated ? <ProsumersPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'users':
        return isAuthenticated && isBackOffice ? <UsersPage /> : <DashboardPage onNavigate={setCurrentPage} />;
      case 'scanner':
        return isAuthenticated && (isGridOperator || isBackOffice) ? (
          <OperatorScannerPage />
        ) : (
          <DashboardPage onNavigate={setCurrentPage} />
        );
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content flex-grow-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
