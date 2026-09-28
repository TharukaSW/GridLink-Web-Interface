// ============================================================================
// File: HomePage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Home Landing Page
// Description: Index landing page showcasing the Smart Solar Microgrid Trading
//              platform, features, system architecture, and quick access.
// ============================================================================

import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { isAuthenticated, isBackOffice } = useAuth();

  return (
    <div className="container py-4">
      {/* Hero Banner */}
      <div className="hero-banner p-4 p-md-5">
        <div className="row align-items-center g-4">
          <div className="col-lg-8">
            <div className="hero-eyebrow mb-3">Solar microgrid trading</div>
            <h1 className="fw-semibold mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#f4f2ed' }}>
              Trade, store and dispatch solar power across your local grid.
            </h1>
            <p className="mb-4" style={{ color: '#c9c6bc', maxWidth: '38rem' }}>
              GridLink connects solar prosumers, grid operators and back-office staff for
              peer-to-peer power trading and battery storage allocation.
            </p>
            <div className="d-flex flex-wrap gap-2">
              {isAuthenticated ? (
                <button className="btn btn-warning px-4" onClick={() => onNavigate('dashboard')}>
                  Go to dashboard
                </button>
              ) : (
                <button className="btn btn-warning px-4" onClick={() => onNavigate('login')}>
                  Sign in
                </button>
              )}
              <button
                className="btn btn-outline-light px-4"
                onClick={() => onNavigate(isAuthenticated ? 'nodes' : 'login')}
              >
                Browse solar hubs
              </button>
            </div>
          </div>
          <div className="col-lg-4 d-none d-lg-block">
            <dl className="hero-aside mb-0">
              <dt>Bookings</dt>
              <dd>Up to 7 days ahead, 12-hour cancellation notice</dd>
              <dt>Verification</dt>
              <dd>QR tokens checked on-site by grid operators</dd>
              <dt>Stack</dt>
              <dd className="mb-0">FAT service API on IIS, MongoDB</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="feature-card">
            <div className="feature-num">01</div>
            <h5>Microgrid hubs</h5>
            <p className="text-muted small">
              Manage solar hubs with GPS locations, generation capacity (kW/h) and battery slot
              availability. Hubs with active reservations can't be deactivated.
            </p>
            <button className="feature-link" onClick={() => onNavigate(isAuthenticated ? 'nodes' : 'login')}>
              View hubs &rarr;
            </button>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="feature-card">
            <div className="feature-num">02</div>
            <h5>Slot reservations</h5>
            <p className="text-muted small">
              Book energy drop-off and charging slots up to 7 days ahead. Cancellations need
              12 hours' notice; a QR code is issued for each approved booking.
            </p>
            <button className="feature-link" onClick={() => onNavigate(isAuthenticated ? 'reservations' : 'login')}>
              Manage slots &rarr;
            </button>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="feature-card">
            <div className="feature-num">03</div>
            <h5>Prosumer accounts</h5>
            <p className="text-muted small">
              Prosumers are identified by their NIC. Back-office staff approve new accounts and
              manage activation status.
            </p>
            <button className="feature-link" onClick={() => onNavigate(isAuthenticated ? 'prosumers' : 'login')}>
              Prosumer profiles &rarr;
            </button>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="feature-card">
            <div className="feature-num">04</div>
            <h5>Operator dispatch</h5>
            <p className="text-muted small">
              Grid operators scan a prosumer's booking QR code, verify it against the API and
              complete the physical energy transfer.
            </p>
            <button className="feature-link" onClick={() => onNavigate(isAuthenticated ? 'scanner' : 'login')}>
              Scan &amp; verify &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Console Access */}
      <div className="feature-card d-md-flex flex-row align-items-center justify-content-between gap-4 mb-4">
        <div>
          <h5 className="mb-1">Staff console</h5>
          <p className="text-muted small mb-0">
            Back-office and grid operator accounts can manage hubs, bookings and users from the console.
          </p>
        </div>
        <button
          className="btn btn-primary-gridlink px-4 mt-3 mt-md-0 flex-shrink-0"
          onClick={() => onNavigate(isAuthenticated ? (isBackOffice ? 'users' : 'dashboard') : 'login')}
        >
          {isAuthenticated ? 'Open console' : 'Sign in'}
        </button>
      </div>
    </div>
  );
};
