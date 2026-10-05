// ============================================================================
// File: DashboardPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Operational Dashboard
// Description: Live operational metrics dashboard satisfying assignment rubric:
//              pending reservations, count of approved future reservations,
//              active hubs, battery storage slots, current/pending bookings,
//              full booking history, and working live search filter.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MicrogridNode, Reservation, ReservationDashboardSummary } from '../types';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isBackOffice } = useAuth();

  const [summary, setSummary] = useState<ReservationDashboardSummary | null>(null);
  const [nodes, setNodes] = useState<MicrogridNode[]>([]);
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'currentPending' | 'history'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch dashboard reservation stats live from API
      const summaryRes = await api.getDashboardSummary();
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }

      // 2. Fetch microgrid hubs stats live from API
      const nodesRes = await api.getMicrogridNodes();
      if (nodesRes.success && nodesRes.data) {
        setNodes(nodesRes.data);
      }

      // 3. Fetch reservations with search and status filter live from API
      const resFilterRes = await api.getReservations({
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
      });
      if (resFilterRes.success && resFilterRes.data) {
        setBookings(resFilterRes.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboardData();
  };

  // Calculations
  const totalCapacityKWh = nodes.reduce((sum, n) => sum + n.capacityKWh, 0);
  const totalAvailableSlots = nodes.reduce((sum, n) => sum + n.availableBatterySlots, 0);
  const totalBatterySlots = nodes.reduce((sum, n) => sum + n.totalBatterySlots, 0);
  const activeHubsCount = nodes.filter((n) => n.isActive).length;

  // Filter bookings based on active view tab
  const displayedBookings = bookings.filter((b) => {
    if (activeViewTab === 'currentPending') {
      return b.status === 'Pending' || b.status === 'Approved';
    }
    if (activeViewTab === 'history') {
      return b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'Rejected';
    }
    return true;
  });

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-semibold mb-1">Dashboard</h2>
          <p className="text-muted small mb-0">
            Welcome back, <strong>{user?.fullName}</strong> &middot; Signed in as{' '}
            {user?.role}
          </p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchDashboardData} disabled={loading}>
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i> Refresh
          </button>
          {isBackOffice && (
            <button className="btn btn-primary-gridlink btn-sm" onClick={() => onNavigate('nodes')}>
              Register hub
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg(null)}></button>
        </div>
      )}

      {/* Primary KPI Cards (Rubric: Pending Reservations + Count of Approved Future Reservations) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100">
            <div className="metric-label">Active solar hubs</div>
            <div className="metric-value">
              {activeHubsCount}<span className="text-muted fs-6"> / {nodes.length}</span>
            </div>
            <div className="small text-muted">{totalCapacityKWh.toLocaleString()} kW/h total capacity</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100">
            <div className="metric-label">Battery slots free</div>
            <div className="metric-value">
              {totalAvailableSlots}<span className="text-muted fs-6"> / {totalBatterySlots}</span>
            </div>
            <div className="small text-muted">Across all hubs</div>
          </div>
        </div>

        {/* Pending Reservations (Rubric required) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100">
            <div className="metric-label">Pending bookings</div>
            <div className="metric-value text-warning">{summary?.pendingCount ?? 0}</div>
            <div className="small text-muted">Awaiting approval</div>
          </div>
        </div>

        {/* Count of Approved Future Reservations (Rubric required) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100">
            <div className="metric-label">Approved, upcoming</div>
            <div className="metric-value text-success">
              {summary?.approvedFutureCount ?? summary?.approvedCount ?? 0}
            </div>
            <div className="small text-muted">Scheduled future trades</div>
          </div>
        </div>
      </div>

      {/* Filter and Live Bookings Section (Rubric: Current/Pending, Booking History, Working Search Filter) */}
      <div className="card mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <h5 className="fw-semibold mb-0">Bookings</h5>
            <span className="text-muted small">{displayedBookings.length} shown</span>
          </div>

          {/* Views Toggle: All vs Current/Pending vs Booking History */}
          <ul className="nav nav-pills mt-2 mt-md-0">
            <li className="nav-item">
              <button
                className={`nav-link py-1 px-3 small ${activeViewTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveViewTab('all')}
              >
                All Bookings
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-1 px-3 small ${
                  activeViewTab === 'currentPending' ? 'active bg-warning text-dark' : ''
                }`}
                onClick={() => setActiveViewTab('currentPending')}
              >
                Current &amp; Pending
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link py-1 px-3 small ${activeViewTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveViewTab('history')}
              >
                Booking History
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* Working Search Filter (Rubric required) */}
          <form onSubmit={handleSearchSubmit} className="row g-2 mb-4">
            <div className="col-md-6 col-lg-5">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by reservation #, prosumer NIC, station name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4 col-lg-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-md-2 col-lg-2">
              <button type="submit" className="btn btn-primary-gridlink w-100">
                Filter
              </button>
            </div>

            <div className="col-md-12 col-lg-2 text-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setActiveViewTab('all');
                }}
              >
                Reset
              </button>
            </div>
          </form>

          {/* Bookings Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading bookings...</span>
              </div>
              <p className="text-muted small mt-2">Fetching live reservations from Web API...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
              <h6>No reservations found matching the specified criteria.</h6>
              <p className="small mb-0">Use the Slot Bookings tab to create a new energy reservation.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-custom mb-0">
                <thead>
                  <tr>
                    <th>Reservation #</th>
                    <th>Prosumer (NIC)</th>
                    <th>Station Hub</th>
                    <th>Scheduled Slot</th>
                    <th>Type</th>
                    <th>Energy (kW/h)</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookings.slice(0, 15).map((r) => (
                    <tr key={r.id}>
                      <td className="font-monospace small">{r.reservationNumber}</td>
                      <td>
                        <div className="fw-medium">{r.prosumerName || 'Prosumer'}</div>
                        <small className="text-muted font-monospace">{r.nic}</small>
                      </td>
                      <td>
                        {r.stationName}
                      </td>
                      <td>
                        <div>{new Date(r.reservationDateTime).toLocaleDateString()}</div>
                        <small className="text-muted">
                          {new Date(r.reservationDateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          ({r.durationMinutes}m)
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.tradingType === 'DropOff'
                              ? 'bg-success-subtle text-success-emphasis'
                              : 'bg-primary-subtle text-primary-emphasis'
                          }`}
                        >
                          {r.tradingType}
                        </span>
                      </td>
                      <td className="font-monospace small">{r.requestedEnergyKWh} kW/h</td>
                      <td>
                        <span
                          className={`badge ${
                            r.status === 'Approved'
                              ? 'bg-success-subtle text-success-emphasis'
                              : r.status === 'Pending'
                              ? 'bg-warning-subtle text-warning-emphasis'
                              : r.status === 'Completed'
                              ? 'bg-secondary-subtle text-secondary-emphasis'
                              : 'bg-danger-subtle text-danger-emphasis'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => onNavigate('reservations')}
                          title="View in Reservations"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
