// ============================================================================
// File: ProsumersPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Prosumer Management Screen
// Description: Manages solar prosumer profiles using NIC as the primary key.
//              Enforces business rule: Deactivated accounts can ONLY be
//              reactivated by a Backoffice officer. Provides search, pending
//              activation/deactivation views, and history inspection.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProsumerProfile, Reservation } from '../types';

export const ProsumersPage: React.FC = () => {
  const { isBackOffice } = useAuth();

  const [prosumers, setProsumers] = useState<ProsumerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProsumer, setSelectedProsumer] = useState<ProsumerProfile | null>(null);
  const [prosumerReservations, setProsumerReservations] = useState<Reservation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [registerForm, setRegisterForm] = useState({
    nic: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
  });

  const fetchProsumers = async () => {
    setLoading(true);
    try {
      const res = await api.getProsumers(statusFilter || undefined);
      if (res.success && res.data) {
        setProsumers(res.data);
      } else {
        setAlert({ type: 'danger', message: res.message || 'Failed to load prosumers.' });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', message: err.message || 'Network error fetching prosumers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProsumers();
  }, [statusFilter]);

  // Handle Prosumer Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const res = await api.registerProsumer(registerForm);
    if (res.success) {
      setAlert({ type: 'success', message: `Prosumer profile registered with NIC: ${registerForm.nic}!` });
      setShowRegisterModal(false);
      fetchProsumers();
      setRegisterForm({
        nic: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        password: '',
      });
    } else {
      setAlert({ type: 'danger', message: res.message || 'Registration failed.' });
    }
  };

  // Open Edit Modal
  const openEditModal = (p: ProsumerProfile) => {
    setSelectedProsumer(p);
    setEditForm({
      fullName: p.fullName,
      email: p.email,
      phoneNumber: p.phoneNumber,
      address: p.address,
    });
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProsumer) return;
    setAlert(null);

    const res = await api.updateProsumerProfile(selectedProsumer.nic, editForm);
    if (res.success) {
      setAlert({ type: 'success', message: 'Prosumer profile updated successfully.' });
      setShowEditModal(false);
      fetchProsumers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to update profile.' });
    }
  };

  // View Prosumer Details & Booking History
  const openHistoryModal = async (p: ProsumerProfile) => {
    setSelectedProsumer(p);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.getReservations({ nic: p.nic });
      if (res.success && res.data) {
        setProsumerReservations(res.data);
      } else {
        setProsumerReservations([]);
      }
    } catch {
      setProsumerReservations([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Deactivate Prosumer
  const handleDeactivate = async (nic: string) => {
    if (!window.confirm(`Are you sure you want to deactivate prosumer account with NIC: ${nic}?`)) return;

    setAlert(null);
    const res = await api.deactivateProsumer(nic);
    if (res.success) {
      setAlert({ type: 'success', message: `Prosumer (${nic}) deactivated successfully.` });
      fetchProsumers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Deactivation failed.' });
    }
  };

  // Activate Prosumer (Rule: BACKOFFICE ONLY)
  const handleActivate = async (nic: string) => {
    if (!isBackOffice) {
      setAlert({
        type: 'warning',
        message: 'Permission Denied: Deactivated prosumer accounts can only be reactivated by a Backoffice officer.',
      });
      return;
    }

    setAlert(null);
    const res = await api.activateProsumer(nic);
    if (res.success) {
      setAlert({ type: 'success', message: `Prosumer account (${nic}) reactivated by Backoffice officer.` });
      fetchProsumers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Activation failed.' });
    }
  };

  // Filtered List
  const filteredProsumers = prosumers.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.nic.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phoneNumber && p.phoneNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container py-4">
      {/* Title */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-semibold mb-1">
            Prosumer Profile Management
          </h2>
          <p className="text-muted small mb-0">
            Registered solar prosumers using National Identity Card (NIC) as the unique primary key.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchProsumers}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button className="btn btn-primary-gridlink btn-sm" onClick={() => setShowRegisterModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Register Prosumer
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i
            className={`bi ${
              alert.type === 'success'
                ? 'bi-check-circle'
                : alert.type === 'warning'
                ? 'bi-exclamation-triangle'
                : 'bi-info-circle'
            } me-2 fs-5`}
          ></i>
          <strong>{alert.message}</strong>
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search prosumers by NIC, name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Account Statuses</option>
                <option value="Active">Active Accounts</option>
                <option value="Inactive">Deactivated Accounts</option>
                <option value="PendingApproval">Pending Deactivation / Approval</option>
              </select>
            </div>

            <div className="col-md-4 text-md-end">
              <span className="badge bg-light text-muted border p-2">
                <i className="bi bi-shield-lock text-warning me-1"></i>
                Deactivated accounts reactivated <strong>only</strong> by Backoffice.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prosumers Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading prosumer profiles...</p>
            </div>
          ) : filteredProsumers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-1 d-block mb-2"></i>
              <h6>No prosumers found matching current criteria.</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-custom mb-0">
                <thead>
                  <tr>
                    <th>NIC (Primary Key)</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProsumers.map((p) => (
                    <tr key={p.nic}>
                      <td>
                        <span className="badge bg-light text-dark font-monospace border fs-7">{p.nic}</span>
                      </td>
                      <td className="fw-bold">{p.fullName}</td>
                      <td>{p.email}</td>
                      <td>{p.phoneNumber || 'N/A'}</td>
                      <td>{p.address}</td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'Active'
                              ? 'bg-success'
                              : p.status === 'PendingApproval'
                              ? 'bg-warning text-dark'
                              : 'bg-danger'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          {/* View details & reservation history */}
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openHistoryModal(p)}
                            title="View Prosumer Trading History"
                          >
                            <i className="bi bi-clock-history"></i>
                          </button>

                          {/* Edit profile */}
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => openEditModal(p)}
                            title="Edit Profile"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* Deactivate or Reactivate */}
                          {p.status === 'Active' ? (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeactivate(p.nic)}
                              title="Deactivate Account"
                            >
                              <i className="bi bi-person-slash"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => handleActivate(p.nic)}
                              title="Reactivate Account (Backoffice Only)"
                              disabled={!isBackOffice}
                            >
                              <i className="bi bi-person-check me-1"></i> Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Prosumer Details & Reservation History */}
      {showHistoryModal && selectedProsumer && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-person-vcard text-primary me-2"></i>
                  Prosumer Profile & Energy Trading History
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowHistoryModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <small className="text-muted d-block">NIC (Primary Key):</small>
                      <strong className="font-monospace text-primary">{selectedProsumer.nic}</strong>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Full Name:</small>
                      <strong>{selectedProsumer.fullName}</strong>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Email Address:</small>
                      <span>{selectedProsumer.email}</span>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Phone Number:</small>
                      <span>{selectedProsumer.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">Physical Address:</small>
                      <span>{selectedProsumer.address}</span>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">
                  <i className="bi bi-lightning-charge text-warning me-1"></i>
                  Power Trading Reservations ({prosumerReservations.length})
                </h6>

                {historyLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span className="ms-2 small text-muted">Loading reservations...</span>
                  </div>
                ) : prosumerReservations.length === 0 ? (
                  <div className="text-center py-4 text-muted border rounded-3 bg-white">
                    <i className="bi bi-calendar-x fs-2 d-block mb-1"></i>
                    No reservations recorded for this prosumer yet.
                  </div>
                ) : (
                  <div className="table-responsive border rounded-3" style={{ maxHeight: '250px' }}>
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Res #</th>
                          <th>Station</th>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Requested</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prosumerReservations.map((r) => (
                          <tr key={r.id}>
                            <td className="font-monospace small fw-bold">{r.reservationNumber}</td>
                            <td>{r.stationName}</td>
                            <td>{new Date(r.reservationDateTime).toLocaleString()}</td>
                            <td>
                              <span
                                className={`badge ${
                                  r.tradingType === 'DropOff' ? 'bg-primary-subtle text-primary' : 'bg-warning-subtle text-warning-emphasis'
                                }`}
                              >
                                {r.tradingType}
                              </span>
                            </td>
                            <td>{r.requestedEnergyKWh} kWh</td>
                            <td>
                              <span
                                className={`badge ${
                                  r.status === 'Approved'
                                    ? 'bg-success'
                                    : r.status === 'Completed'
                                    ? 'bg-primary'
                                    : r.status === 'Cancelled'
                                    ? 'bg-danger'
                                    : 'bg-warning text-dark'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Prosumer */}
      {showRegisterModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-person-plus text-primary me-2"></i>
                  Register Solar Prosumer Account
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRegisterModal(false)}></button>
              </div>

              <form onSubmit={handleRegisterSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">National Identity Card (NIC) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 199012345678 or 901234567V"
                        value={registerForm.nic}
                        onChange={(e) => setRegisterForm({ ...registerForm, nic: e.target.value })}
                        required
                      />
                      <small className="text-muted">Serves as the unique primary key.</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sunimal Silva"
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="prosumer@domain.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Mobile Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0771234567"
                        value={registerForm.phoneNumber}
                        onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Physical Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="No 45, Temple Road, Moratuwa"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Initial Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="At least 6 characters"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-gridlink">
                    Register Prosumer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Prosumer */}
      {showEditModal && selectedProsumer && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Edit Prosumer ({selectedProsumer.nic})
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Mobile Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Physical Address *</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-gridlink">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
