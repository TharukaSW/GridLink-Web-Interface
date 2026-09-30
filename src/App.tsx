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
import { MicrogridNodesPage } from './pages/MicrogridNodesPage';
import { UsersPage } from './pages/UsersPage';
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
      case 'nodes':
        return isAuthenticated ? <MicrogridNodesPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'map':
        return isAuthenticated ? <StationsMapPage /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'users':
        return isAuthenticated && isBackOffice ? <UsersPage /> : <HomePage onNavigate={setCurrentPage} />;
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
