// ============================================================================
// File: Navbar.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Navigation Bar Component
// Description: Modern, enterprise-grade navigation bar featuring clean role-based
//              menus, grouped dropdowns, and status-aware user profile pill.
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAuthenticated, isBackOffice, isGridOperator, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<'network' | 'trading' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const isNetworkActive = currentPage === 'nodes' || currentPage === 'map';
  const isTradingActive = currentPage === 'reservations' || currentPage === 'prosumers';

  return (
    <nav className="navbar navbar-expand-xl navbar-dark navbar-gridlink sticky-top" ref={navRef}>
      <div className="container-fluid px-3 px-lg-4">
        {/* Brand Logo & Title */}
        <div
          className="navbar-brand-wrap me-4"
          onClick={() => handleNavClick(isAuthenticated ? 'dashboard' : 'home')}
        >
          <span className="navbar-brand-mark">
            <i className="bi bi-sun-fill"></i>
          </span>
          <span className="navbar-brand-title">GridLink</span>
          <span className="navbar-brand-sub d-none d-sm-inline">Microgrid Exchange</span>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0 shadow-none px-2"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <i className={`bi ${mobileMenuOpen ? 'bi-x-lg text-white' : 'bi-list text-white'} fs-4`}></i>
        </button>

        {/* Main Navigation Menu */}
        <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show mt-3 mt-xl-0' : ''}`} id="gridlinkNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-xl-0 d-flex align-items-xl-center gap-1">
            {/* Public Links */}
            {!isAuthenticated && (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link-gridlink ${currentPage === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('home')}
                >
                  <span>Home</span>
                </button>
              </li>
            )}

            {/* Authenticated Links */}
            {isAuthenticated && (
              <>
                {/* 1. Dashboard (All Staff) */}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link-gridlink ${currentPage === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleNavClick('dashboard')}
                  >
                    <span>Dashboard</span>
                  </button>
                </li>

                {/* BackOffice Menus */}
                {isBackOffice && (
                  <>
                    {/* Microgrid Network Dropdown */}
                    <li className="nav-item nav-dropdown-container">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${isNetworkActive ? 'active' : ''}`}
                        onClick={() => setOpenDropdown(openDropdown === 'network' ? null : 'network')}
                      >
                        <span>Network Hubs</span>
                        <i className={`bi bi-chevron-down ms-1 small transition-transform ${openDropdown === 'network' ? 'rotate-180' : ''}`}></i>
                      </button>

                      {openDropdown === 'network' && (
                        <div className="nav-dropdown-menu">
                          <button
                            type="button"
                            className={`nav-dropdown-item ${currentPage === 'nodes' ? 'active' : ''}`}
                            onClick={() => handleNavClick('nodes')}
                          >
                            <div>
                              <div className="fw-medium">Solar Hubs &amp; Slots</div>
                              <small className="d-block">
                                Node capacity, slots &amp; operating hours
                              </small>
                            </div>
                          </button>

                          <button
                            type="button"
                            className={`nav-dropdown-item ${currentPage === 'map' ? 'active' : ''}`}
                            onClick={() => handleNavClick('map')}
                          >
                            <div>
                              <div className="fw-medium">Geospatial Station Map</div>
                              <small className="d-block">
                                Interactive map &amp; proximity radar
                              </small>
                            </div>
                          </button>
                        </div>
                      )}
                    </li>

                    {/* Energy Trading Dropdown */}
                    <li className="nav-item nav-dropdown-container">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${isTradingActive ? 'active' : ''}`}
                        onClick={() => setOpenDropdown(openDropdown === 'trading' ? null : 'trading')}
                      >
                        <span>Trading</span>
                        <i className={`bi bi-chevron-down ms-1 small transition-transform ${openDropdown === 'trading' ? 'rotate-180' : ''}`}></i>
                      </button>

                      {openDropdown === 'trading' && (
                        <div className="nav-dropdown-menu">
                          <button
                            type="button"
                            className={`nav-dropdown-item ${currentPage === 'reservations' ? 'active' : ''}`}
                            onClick={() => handleNavClick('reservations')}
                          >
                            <div>
                              <div className="fw-medium">Slot Reservations</div>
                              <small className="d-block">
                                7-day bookings, approvals &amp; cancel
                              </small>
                            </div>
                          </button>

                          <button
                            type="button"
                            className={`nav-dropdown-item ${currentPage === 'prosumers' ? 'active' : ''}`}
                            onClick={() => handleNavClick('prosumers')}
                          >
                            <div>
                              <div className="fw-medium">Prosumers Directory</div>
                              <small className="d-block">
                                NIC accounts, trading logs &amp; status
                              </small>
                            </div>
                          </button>
                        </div>
                      )}
                    </li>

                    {/* User Admin */}
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${currentPage === 'users' ? 'active' : ''}`}
                        onClick={() => handleNavClick('users')}
                      >
                        <span>User Admin</span>
                      </button>
                    </li>
                  </>
                )}

                {/* Grid Operator Menus */}
                {isGridOperator && !isBackOffice && (
                  <>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${currentPage === 'scanner' ? 'active' : ''}`}
                        onClick={() => handleNavClick('scanner')}
                      >
                        <span>QR Verification</span>
                      </button>
                    </li>

                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${currentPage === 'nodes' ? 'active' : ''}`}
                        onClick={() => handleNavClick('nodes')}
                      >
                        <span>Microgrid Nodes</span>
                      </button>
                    </li>

                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${currentPage === 'map' ? 'active' : ''}`}
                        onClick={() => handleNavClick('map')}
                      >
                        <span>Stations Map</span>
                      </button>
                    </li>

                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link-gridlink ${currentPage === 'reservations' ? 'active' : ''}`}
                        onClick={() => handleNavClick('reservations')}
                      >
                        <span>Reservations</span>
                      </button>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          {/* Right Section: Operator Console Shortcut & User Profile */}
          <div className="d-flex align-items-center flex-wrap gap-2 mt-2 mt-xl-0">
            {/* Quick Action for BackOffice to access Operator Scanner */}
            {isAuthenticated && isBackOffice && (
              <button
                type="button"
                className={`btn-nav-action me-2 ${currentPage === 'scanner' ? 'active' : ''}`}
                onClick={() => handleNavClick('scanner')}
                title="Open physical station operator verification station"
              >
                <span>Operator Scanner</span>
              </button>
            )}

            {/* User Session Profile & Logout */}
            {isAuthenticated && user ? (
              <div className="d-flex align-items-center gap-2">
                <div className="user-profile-pill">
                  <div className="avatar-circle">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-start d-none d-md-block">
                    <div className="text-white small fw-medium text-truncate" style={{ maxWidth: '140px' }}>
                      {user.fullName}
                    </div>
                    <div className="user-profile-role">{user.role}</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-nav-signout"
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  title="Sign out of system"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-warning btn-sm px-3"
                onClick={() => handleNavClick('login')}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
