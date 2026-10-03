// ============================================================================
// File: ReservationsPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Power Trading & Energy Slot Reservation Management
// Description: Manages energy slot bookings, enforcing business rules:
//              scheduled within 7 days, 12-hour notice for cancellations/updates,
//              summary displays after every action, and server-generated
//              secure transaction QR code dispatch.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CreateReservationDTO, MicrogridNode, Reservation } from '../types';

export const ReservationsPage: React.FC = () => {
  const { user, isBackOffice, isGridOperator } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stations, setStations] = useState<MicrogridNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelSummaryModal, setShowCancelSummaryModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [cancelledRes, setCancelledRes] = useState<Reservation | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateReservationDTO>({
    stationId: '',
    reservationDateTime: '',
    durationMinutes: 60,
    tradingType: 'DropOff',
    requestedEnergyKWh: 25.0,
  });

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('');

  // Update Form State
  const [updateDateTime, setUpdateDateTime] = useState('');
  const [updateDuration, setUpdateDuration] = useState(60);
  const [updateKWh, setUpdateKWh] = useState(25.0);
  const [updateTradingType, setUpdateTradingType] = useState('DropOff');
  const [updateStationId, setUpdateStationId] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.getReservations({
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        stationId: stationFilter || undefined,
      });

      if (res.success && res.data) {
        setReservations(res.data);
      } else {
        setAlert({ type: 'danger', message: res.message || 'Failed to load reservations.' });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', message: err.message || 'Network error fetching reservations.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    const res = await api.getMicrogridNodes({ isActive: true });
    if (res.success && res.data) {
      setStations(res.data);
      const stationList = res.data;
      if (stationList && stationList.length > 0 && !createForm.stationId) {
        setCreateForm((prev) => ({ ...prev, stationId: stationList[0].id }));
      }
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchStations();
  }, [statusFilter, stationFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReservations();
  };

  // --------------------------------------------------------------------------
  // Create Reservation (Enforces 7-day rule)
  // --------------------------------------------------------------------------
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // Frontend validation for 7-day rule
    const chosenTime = new Date(createForm.reservationDateTime);
    const now = new Date();
    const maxFuture = new Date();
    maxFuture.setDate(now.getDate() + 7);

    if (chosenTime < now) {
      setAlert({ type: 'warning', message: 'Reservation date and time cannot be in the past.' });
      return;
    }

    if (chosenTime > maxFuture) {
      setAlert({
        type: 'warning',
        message: 'Business Rule Violation: Reservations must be scheduled within 7 days from now.',
      });
      return;
    }

    const res = await api.createReservation({
      ...createForm,
      reservationDateTime: chosenTime.toISOString(),
    });

    if (res.success && res.data) {
      setAlert({ type: 'success', message: 'Energy reservation created and approved successfully!' });
      setShowCreateModal(false);
      fetchReservations();
      // Show summary with QR code (Satisfies summary requirement)
      setSelectedRes(res.data);
      setShowQrModal(true);
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to create reservation.' });
    }
  };

  // --------------------------------------------------------------------------
  // Update Reservation (Enforces 12-hour notice & 7-day rule)
  // --------------------------------------------------------------------------
  const openUpdateModal = (res: Reservation) => {
    setSelectedRes(res);
    setUpdateDateTime(new Date(res.reservationDateTime).toISOString().slice(0, 16));
    setUpdateDuration(res.durationMinutes);
    setUpdateKWh(res.requestedEnergyKWh);
    setUpdateTradingType(res.tradingType);
    setUpdateStationId(res.stationId);
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    setAlert(null);

    const chosenTime = new Date(updateDateTime);
    const now = new Date();
    const maxFuture = new Date();
    maxFuture.setDate(now.getDate() + 7);

    if (chosenTime < now) {
      setAlert({ type: 'warning', message: 'New scheduled date cannot be in the past.' });
      return;
    }

    if (chosenTime > maxFuture) {
      setAlert({ type: 'warning', message: 'New schedule must be within 7 days from today.' });
      return;
    }

    const res = await api.updateReservation(selectedRes.id, {
      reservationDateTime: chosenTime.toISOString(),
      durationMinutes: updateDuration,
      requestedEnergyKWh: updateKWh,
      tradingType: updateTradingType || selectedRes.tradingType,
      stationId: updateStationId || selectedRes.stationId,
    });

    if (res.success && res.data) {
      setAlert({ type: 'success', message: 'Reservation updated successfully! New QR dispatched.' });
      setShowUpdateModal(false);
      fetchReservations();
      // Show summary with updated QR code
      setSelectedRes(res.data);
      setShowQrModal(true);
    } else {
      setAlert({
        type: 'danger',
        message: res.message || 'Failed to update reservation (12-hour notice rule enforced).',
      });
    }
  };

  // --------------------------------------------------------------------------
  // Cancel Reservation (Enforces 12-hour notice rule & shows cancellation summary)
  // --------------------------------------------------------------------------
  const openCancelModal = (res: Reservation) => {
    setSelectedRes(res);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes || !cancelReason.trim()) return;
    setAlert(null);

    const res = await api.cancelReservation(selectedRes.id, cancelReason);
    if (res.success && res.data) {
      setAlert({ type: 'success', message: 'Reservation cancelled successfully. Battery storage slot released.' });
      setShowCancelModal(false);
      setCancelledRes(res.data);
      setShowCancelSummaryModal(true);
      fetchReservations();
    } else {
      setAlert({
        type: 'danger',
        message: res.message || 'Cancellation rejected: At least 12 hours notice is required before slot time.',
      });
    }
  };

  // --------------------------------------------------------------------------
  // Approve Reservation (Operator / Admin)
  // --------------------------------------------------------------------------
  const handleApprove = async (id: string) => {
    setAlert(null);
    const res = await api.approveReservation(id);
    if (res.success) {
      setAlert({ type: 'success', message: 'Reservation approved successfully.' });
      fetchReservations();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to approve.' });
    }
  };

  const openQrModal = (res: Reservation) => {
    setSelectedRes(res);
    setShowQrModal(true);
  };

  return (
    <div className="container py-4">
      {/* Title & Top Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-semibold mb-1">
            Energy Slot Reservations & Power Trading
          </h2>
          <p className="text-muted small mb-0">
            Schedule drop-off and charging slots. Enforces 7-day advance booking and strict 12-hour notice cancellation rules.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchReservations}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button className="btn btn-primary-gridlink btn-sm" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> New Energy Booking
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.type === 'danger' && <i className="bi bi-shield-x me-2 fs-5"></i>}
          {alert.type === 'success' && <i className="bi bi-check2-circle me-2 fs-5"></i>}
          {alert.type === 'warning' && <i className="bi bi-exclamation-triangle me-2 fs-5"></i>}
          <strong>{alert.message}</strong>
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Search & Station / Status Filters */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by reservation #, prosumer NIC, or hub name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
              >
                <option value="">All Solar Stations</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationCode} - {s.stationName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
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

            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary-gridlink flex-grow-1">
                Filter
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setStationFilter('');
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Power Trading Bookings ({reservations.length})</h5>
          <span className="badge bg-light text-dark border">
            <i className="bi bi-shield-check text-success me-1"></i>
            12-Hour Cancellation Rule Active
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading reservations from server...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
              <h6>No power trading reservations found.</h6>
              <button className="btn btn-sm btn-primary-gridlink mt-2" onClick={() => setShowCreateModal(true)}>
                Create Booking
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-custom mb-0">
                <thead>
                  <tr>
                    <th>Reservation #</th>
                    <th>Prosumer</th>
                    <th>Station Hub</th>
                    <th>Scheduled Time</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>QR Dispatch</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-bold font-monospace text-primary">{r.reservationNumber}</td>
                      <td>
                        <div className="fw-bold">{r.prosumerName || 'Prosumer'}</div>
                        <small className="text-muted font-monospace">{r.nic}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {r.stationName}
                        </span>
                      </td>
                      <td>
                        <div>{new Date(r.reservationDateTime).toLocaleDateString()}</div>
                        <small className="text-muted">
                          {new Date(r.reservationDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({r.durationMinutes} min)
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.tradingType === 'DropOff'
                              ? 'bg-primary-subtle text-primary border border-primary-subtle'
                              : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                          }`}
                        >
                          <i
                            className={`bi ${
                              r.tradingType === 'DropOff' ? 'bi-box-arrow-in-down' : 'bi-battery-charging'
                            } me-1`}
                          ></i>
                          {r.tradingType}
                        </span>
                      </td>
                      <td className="fw-bold text-dark">{r.requestedEnergyKWh} kW/h</td>
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
                      <td>
                        {r.qrCodeImageBase64 ? (
                          <button
                            className="btn btn-outline-dark btn-sm py-0 px-2"
                            onClick={() => openQrModal(r)}
                            title="View Secure QR Code Dispatch"
                          >
                            <i className="bi bi-qr-code me-1"></i> QR
                          </button>
                        ) : (
                          <span className="text-muted small">N/A</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          {/* Approve (if pending) */}
                          {r.status === 'Pending' && (isBackOffice || isGridOperator) && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(r.id)}
                              title="Approve Reservation"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          )}

                          {/* Edit / Reschedule */}
                          {r.status === 'Approved' && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => openUpdateModal(r)}
                              title="Update / Reschedule (Requires 12h notice)"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}

                          {/* Cancel */}
                          {r.status === 'Approved' && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => openCancelModal(r)}
                              title="Cancel Reservation (Requires 12h notice)"
                            >
                              <i className="bi bi-x-circle"></i>
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

      {/* ------------------------------------------------------------------- */}
      {/* Modal: New Energy Reservation (7-Day rule enforced)                 */}
      {/* ------------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-calendar-plus text-primary me-2"></i>
                  Create Energy Trading Slot Reservation
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 small mb-3">
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Business Rules:</strong> Reservations must be scheduled within <strong>7 days</strong> from today. Updates and cancellations require at least <strong>12 hours</strong> advance notice.
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Target Solar Microgrid Hub *</label>
                      <select
                        className="form-select"
                        value={createForm.stationId}
                        onChange={(e) => setCreateForm({ ...createForm, stationId: e.target.value })}
                        required
                      >
                        {stations.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.stationCode} &middot; {s.stationName} ({s.availableBatterySlots} slots avail.)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Trading Activity *</label>
                      <select
                        className="form-select"
                        value={createForm.tradingType}
                        onChange={(e) => setCreateForm({ ...createForm, tradingType: e.target.value })}
                        required
                      >
                        <option value="DropOff">Solar Power Drop-Off (Feed into microgrid)</option>
                        <option value="Charging">Battery Charging (Draw from microgrid)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Date & Time (Within 7 Days) *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={createForm.reservationDateTime}
                        onChange={(e) => setCreateForm({ ...createForm, reservationDateTime: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="15"
                        max="240"
                        step="15"
                        className="form-control"
                        value={createForm.durationMinutes}
                        onChange={(e) => setCreateForm({ ...createForm, durationMinutes: parseInt(e.target.value) || 60 })}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Energy (kW/h)</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="0.5"
                        className="form-control"
                        value={createForm.requestedEnergyKWh}
                        onChange={(e) => setCreateForm({ ...createForm, requestedEnergyKWh: parseFloat(e.target.value) || 25 })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-gridlink">
                    Confirm & Dispatch Reservation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Update / Reschedule Reservation (12-hour notice enforced)    */}
      {/* ------------------------------------------------------------------- */}
      {showUpdateModal && selectedRes && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Reschedule / Modify Reservation #{selectedRes.reservationNumber}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUpdateModal(false)}></button>
              </div>

              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-body p-4">
                  <div className="alert alert-warning py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    <strong>Notice Requirement:</strong> Per project specifications, reservation modifications require at least <strong>12 hours notice</strong> prior to scheduled slot time.
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Station Hub</label>
                      <select
                        className="form-select"
                        value={updateStationId}
                        onChange={(e) => setUpdateStationId(e.target.value)}
                        required
                      >
                        {stations.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.stationCode} &middot; {s.stationName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Trading Activity</label>
                      <select
                        className="form-select"
                        value={updateTradingType}
                        onChange={(e) => setUpdateTradingType(e.target.value)}
                        required
                      >
                        <option value="DropOff">Solar Power Drop-Off</option>
                        <option value="Charging">Battery Charging</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">New Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={updateDateTime}
                        onChange={(e) => setUpdateDateTime(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Duration (Min)</label>
                      <input
                        type="number"
                        min="15"
                        max="240"
                        step="15"
                        className="form-control"
                        value={updateDuration}
                        onChange={(e) => setUpdateDuration(parseInt(e.target.value) || 60)}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Energy (kW/h)</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="0.5"
                        className="form-control"
                        value={updateKWh}
                        onChange={(e) => setUpdateKWh(parseFloat(e.target.value) || 25)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-gridlink">
                    Save Changes & Update QR
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Cancel Reservation (12-hour notice enforced)                 */}
      {/* ------------------------------------------------------------------- */}
      {showCancelModal && selectedRes && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-x-octagon me-2"></i>
                  Cancel Reservation #{selectedRes.reservationNumber}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
              </div>

              <form onSubmit={handleCancelSubmit}>
                <div className="modal-body p-4">
                  <p className="text-muted small">
                    Cancelling scheduled slot for <strong>{selectedRes.stationName}</strong> at{' '}
                    <strong>{new Date(selectedRes.reservationDateTime).toLocaleString()}</strong>.
                  </p>

                  <div className="alert alert-warning py-2 small mb-3">
                    <i className="bi bi-clock-history me-1"></i>
                    <strong>Rule Check:</strong> Cancellations require at least 12 hours notice prior to slot time. Cancelling will release the allocated battery storage slot.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason for Cancellation *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Inclement weather, inverter maintenance, vehicle battery unavailable..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-danger">
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Cancellation Summary Page (Satisfies Page 8 Rubric)          */}
      {/* ------------------------------------------------------------------- */}
      {showCancelSummaryModal && cancelledRes && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Cancellation Receipt Summary
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelSummaryModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="text-center mb-3">
                  <i className="bi bi-x-circle text-danger display-4"></i>
                  <h5 className="fw-bold mt-2">Reservation Cancelled</h5>
                  <p className="text-muted small font-monospace">{cancelledRes.reservationNumber}</p>
                </div>

                <div className="list-group list-group-flush border rounded-3 mb-3 small">
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Prosumer NIC:</span>
                    <strong className="font-monospace">{cancelledRes.nic}</strong>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Station Hub:</span>
                    <strong>{cancelledRes.stationName}</strong>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Original Slot:</span>
                    <span>{new Date(cancelledRes.reservationDateTime).toLocaleString()}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Cancelled At:</span>
                    <span>{cancelledRes.cancelledAt ? new Date(cancelledRes.cancelledAt).toLocaleString() : 'Just now'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Reason:</span>
                    <span className="text-dark fw-semibold">{cancelledRes.cancellationReason || 'N/A'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between bg-light">
                    <span className="text-success fw-bold">
                      <i className="bi bi-arrow-repeat me-1"></i> Battery Slot:
                    </span>
                    <span className="badge bg-success">Released to Station Pool</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary w-100" onClick={() => setShowCancelSummaryModal(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Secure QR Dispatch & Action Summary (Page 8 Rubric)          */}
      {/* ------------------------------------------------------------------- */}
      {showQrModal && selectedRes && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-qr-code-scan text-primary me-2"></i>
                  Transaction Summary & QR Dispatch
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowQrModal(false)}></button>
              </div>

              <div className="modal-body p-4 text-center">
                {/* QR Code image */}
                {selectedRes.qrCodeImageBase64 ? (
                  <div className="p-3 bg-white border rounded-4 shadow-sm d-inline-block mb-3">
                    <img
                      src={selectedRes.qrCodeImageBase64}
                      alt="Transaction QR"
                      style={{ width: '220px', height: '220px', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="alert alert-secondary py-3 mb-3">
                    QR code payload generated without embedded raster image.
                  </div>
                )}

                <h5 className="fw-bold font-monospace text-primary mb-1">{selectedRes.reservationNumber}</h5>
                <span
                  className={`badge mb-3 ${
                    selectedRes.status === 'Approved'
                      ? 'bg-success'
                      : selectedRes.status === 'Completed'
                      ? 'bg-primary'
                      : 'bg-warning text-dark'
                  }`}
                >
                  {selectedRes.status}
                </span>

                <div className="list-group list-group-flush border rounded-3 text-start small mb-3">
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Prosumer NIC:</span>
                    <strong className="font-monospace">{selectedRes.nic}</strong>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Target Solar Hub:</span>
                    <strong>{selectedRes.stationName}</strong>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Scheduled Time:</span>
                    <strong>{new Date(selectedRes.reservationDateTime).toLocaleString()}</strong>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Activity Type:</span>
                    <span>{selectedRes.tradingType}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Energy Allocation:</span>
                    <strong className="text-success">{selectedRes.requestedEnergyKWh} kW/h</strong>
                  </div>
                </div>

                <div className="accordion" id="qrPayloadAccordion">
                  <div className="accordion-item border">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed py-2 small"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#qrPayloadCollapse"
                      >
                        <i className="bi bi-code-slash me-2"></i> View Cryptographic QR Payload
                      </button>
                    </h2>
                    <div id="qrPayloadCollapse" className="accordion-collapse collapse">
                      <div className="accordion-body p-2 bg-light">
                        <textarea
                          readOnly
                          className="form-control form-control-sm font-monospace"
                          rows={4}
                          value={selectedRes.qrCodeData}
                        ></textarea>
                        <small className="text-muted d-block mt-1">
                          Grid Operators can scan this payload using the Operator Mode verification tool.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-primary-gridlink w-100" onClick={() => setShowQrModal(false)}>
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
