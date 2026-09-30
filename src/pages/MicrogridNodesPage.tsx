// ============================================================================
// File: MicrogridNodesPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Microgrid Node Management Screen
// Description: Full management interface for solar microgrid hubs and slots.
//              Implements Backoffice hub creation, hub editing, schedule updates,
//              battery storage slot updates, station deletion with active
//              reservation safety guard, and complete booking slot CRUD operations.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BookingSlot, CreateMicrogridNodeDTO, MicrogridNode, UpdateMicrogridNodeDTO, UpdateSlotDTO } from '../types';

export const MicrogridNodesPage: React.FC = () => {
  const { isBackOffice, isGridOperator } = useAuth();

  const [nodes, setNodes] = useState<MicrogridNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MicrogridNode | null>(null);

  // Form states for creating a new hub
  const [createForm, setCreateForm] = useState<CreateMicrogridNodeDTO>({
    stationCode: '',
    stationName: '',
    address: '',
    latitude: 6.9271,
    longitude: 79.8612,
    capacityKWh: 500,
    totalBatterySlots: 10,
    availableBatterySlots: 10,
    operatingHours: '06:00 - 22:00',
  });

  // Form states for editing a hub
  const [editForm, setEditForm] = useState<UpdateMicrogridNodeDTO>({
    stationName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    capacityKWh: 0,
    totalBatterySlots: 0,
    availableBatterySlots: 0,
    operatingHours: '',
    isActive: true,
  });

  // Schedule modal state
  const [scheduleOperatingHours, setScheduleOperatingHours] = useState('');

  // Slots management state
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotDuration, setNewSlotDuration] = useState(60);
  const [newSlotCapacity, setNewSlotCapacity] = useState(50);
  const [newSlotRate, setNewSlotRate] = useState(45);

  // Edit slot modal / inline state
  const [editingSlot, setEditingSlot] = useState<BookingSlot | null>(null);
  const [editSlotForm, setEditSlotForm] = useState<UpdateSlotDTO>({
    slotTime: '',
    durationMinutes: 60,
    capacityKWh: 50,
    ratePerKWh: 45,
    isAvailable: true,
  });

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
      const res = await api.getMicrogridNodes({
        searchTerm: searchTerm || undefined,
        isActive: activeParam,
      });

      if (res.success && res.data) {
        setNodes(res.data);
      } else {
        setAlert({ type: 'danger', message: res.message || 'Failed to fetch microgrid nodes.' });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', message: err.message || 'Network error fetching nodes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNodes();
  };

  // --------------------------------------------------------------------------
  // Create Hub (Backoffice)
  // --------------------------------------------------------------------------
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const res = await api.createMicrogridNode(createForm);
    if (res.success) {
      setAlert({ type: 'success', message: 'Solar microgrid hub registered successfully!' });
      setShowCreateModal(false);
      fetchNodes();
      // Reset form
      setCreateForm({
        stationCode: '',
        stationName: '',
        address: '',
        latitude: 6.9271,
        longitude: 79.8612,
        capacityKWh: 500,
        totalBatterySlots: 10,
        availableBatterySlots: 10,
        operatingHours: '06:00 - 22:00',
      });
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to create microgrid hub.' });
    }
  };

  // --------------------------------------------------------------------------
  // Edit Hub (Backoffice)
  // --------------------------------------------------------------------------
  const openEditModal = (node: MicrogridNode) => {
    setSelectedNode(node);
    setEditForm({
      stationName: node.stationName,
      address: node.address,
      latitude: node.latitude,
      longitude: node.longitude,
      capacityKWh: node.capacityKWh,
      totalBatterySlots: node.totalBatterySlots,
      availableBatterySlots: node.availableBatterySlots,
      operatingHours: node.operatingHours,
      isActive: node.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    setAlert(null);

    const res = await api.updateMicrogridNode(selectedNode.id, editForm);
    if (res.success) {
      setAlert({ type: 'success', message: 'Microgrid hub details updated successfully!' });
      setShowEditModal(false);
      fetchNodes();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to update microgrid hub.' });
    }
  };

  // --------------------------------------------------------------------------
  // Dedicated Update Schedule (Backoffice)
  // --------------------------------------------------------------------------
  const openScheduleModal = (node: MicrogridNode) => {
    setSelectedNode(node);
    setScheduleOperatingHours(node.operatingHours);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    setAlert(null);

    const res = await api.updateSchedule(selectedNode.id, scheduleOperatingHours);
    if (res.success) {
      setAlert({
        type: 'success',
        message: `Operating hours for ${selectedNode.stationCode} updated to "${scheduleOperatingHours}".`,
      });
      setShowScheduleModal(false);
      fetchNodes();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to update schedule.' });
    }
  };

  // --------------------------------------------------------------------------
  // Battery Slots Quick Update (Grid Operator & Backoffice)
  // --------------------------------------------------------------------------
  const handleAdjustBatterySlots = async (node: MicrogridNode, delta: number) => {
    const newSlots = node.availableBatterySlots + delta;
    if (newSlots < 0 || newSlots > node.totalBatterySlots) {
      setAlert({
        type: 'warning',
        message: `Slots must be between 0 and maximum capacity (${node.totalBatterySlots}).`,
      });
      return;
    }

    const res = await api.updateBatterySlots(node.id, newSlots);
    if (res.success) {
      setAlert({
        type: 'success',
        message: `Battery storage slot availability updated for ${node.stationCode} to ${newSlots}.`,
      });
      fetchNodes();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to update battery slots.' });
    }
  };

  // --------------------------------------------------------------------------
  // Deactivate Node with Active Reservation Block Guard
  // --------------------------------------------------------------------------
  const handleDeactivate = async (node: MicrogridNode) => {
    if (!window.confirm(`Are you sure you want to deactivate hub "${node.stationName}" (${node.stationCode})?`)) {
      return;
    }

    setAlert(null);
    const res = await api.deactivateNode(node.id);
    if (res.success) {
      setAlert({ type: 'success', message: `Station ${node.stationCode} deactivated successfully.` });
      fetchNodes();
    } else {
      setAlert({
        type: 'danger',
        message: res.message || 'Action blocked: Active energy reservations exist for this station.',
      });
    }
  };

  const handleActivate = async (node: MicrogridNode) => {
    setAlert(null);
    const res = await api.activateNode(node.id);
    if (res.success) {
      setAlert({ type: 'success', message: `Station ${node.stationCode} reactivated successfully.` });
      fetchNodes();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to reactivate station.' });
    }
  };

  // --------------------------------------------------------------------------
  // Delete Solar Station Hub (Backoffice - Blocked if active reservations exist)
  // --------------------------------------------------------------------------
  const handleDeleteNode = async (node: MicrogridNode) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently DELETE solar station "${node.stationName}" (${node.stationCode})?\n\nNote: Deletion will be rejected by the server if active reservations exist.`
      )
    ) {
      return;
    }

    setAlert(null);
    const res = await api.deleteNode(node.id);
    if (res.success) {
      setAlert({ type: 'success', message: `Station ${node.stationCode} and its slots have been removed.` });
      fetchNodes();
    } else {
      setAlert({
        type: 'danger',
        message: res.message || 'Delete operation blocked: Active reservations exist for this solar station.',
      });
    }
  };

  // --------------------------------------------------------------------------
  // Slots Management Drawer / Modal
  // --------------------------------------------------------------------------
  const openSlotsModal = async (node: MicrogridNode) => {
    setSelectedNode(node);
    setShowSlotsModal(true);
    setEditingSlot(null);
    setSlotsLoading(true);
    try {
      const res = await api.getSlotsByStation(node.id);
      if (res.success && res.data) {
        setSlots(res.data);
      }
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleAddSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !newSlotTime) return;

    const res = await api.createSlot(selectedNode.id, {
      slotTime: new Date(newSlotTime).toISOString(),
      durationMinutes: newSlotDuration,
      capacityKWh: newSlotCapacity,
      ratePerKWh: newSlotRate,
      isAvailable: true,
    });

    if (res.success) {
      setAlert({ type: 'success', message: 'New booking slot added successfully!' });
      const updated = await api.getSlotsByStation(selectedNode.id);
      if (updated.success && updated.data) setSlots(updated.data);
      setNewSlotTime('');
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to create slot.' });
    }
  };

  // Start editing a slot
  const startEditSlot = (slot: BookingSlot) => {
    setEditingSlot(slot);
    setEditSlotForm({
      slotTime: new Date(slot.slotTime).toISOString().slice(0, 16),
      durationMinutes: slot.durationMinutes,
      capacityKWh: slot.capacityKWh,
      ratePerKWh: slot.ratePerKWh,
      isAvailable: slot.isAvailable,
    });
  };

  // Submit slot update
  const handleUpdateSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !selectedNode) return;

    const res = await api.updateSlot(editingSlot.id, {
      slotTime: new Date(editSlotForm.slotTime).toISOString(),
      durationMinutes: editSlotForm.durationMinutes,
      capacityKWh: editSlotForm.capacityKWh,
      ratePerKWh: editSlotForm.ratePerKWh,
      isAvailable: editSlotForm.isAvailable,
    });

    if (res.success) {
      setAlert({ type: 'success', message: `Slot #${editingSlot.slotNumber} updated successfully!` });
      setEditingSlot(null);
      const updated = await api.getSlotsByStation(selectedNode.id);
      if (updated.success && updated.data) setSlots(updated.data);
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to update slot.' });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to remove this booking slot?')) return;
    if (!selectedNode) return;

    const res = await api.deleteSlot(slotId);
    if (res.success) {
      setAlert({ type: 'success', message: 'Booking slot deleted.' });
      setSlots(slots.filter((s) => s.id !== slotId));
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to delete slot.' });
    }
  };

  return (
    <div className="container py-4">
      {/* Title & Top Controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-semibold mb-1">
            Solar Microgrid Node Management
          </h2>
          <p className="text-muted small mb-0">
            Configure solar microgrid hubs, GPS positioning, capacity specs, operational schedules, and battery slot availability.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchNodes}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          {isBackOffice && (
            <button className="btn btn-primary-gridlink btn-sm" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg me-1"></i> Register New Hub
            </button>
          )}
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.type === 'danger' && <i className="bi bi-shield-x me-2 fs-5"></i>}
          {alert.type === 'success' && <i className="bi bi-check-circle me-2 fs-5"></i>}
          {alert.type === 'warning' && <i className="bi bi-exclamation-triangle me-2 fs-5"></i>}
          <strong>{alert.message}</strong>
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-2 align-items-center">
            <div className="col-md-7 col-lg-6">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search hub by code (e.g. HUB-COL-01), name, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3 col-lg-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Hubs (Active & Inactive)</option>
                <option value="active">Active Hubs Only</option>
                <option value="inactive">Inactive Hubs Only</option>
              </select>
            </div>

            <div className="col-md-2 col-lg-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary-gridlink flex-grow-1">
                Filter
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Solar Hubs Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading solar microgrid nodes...</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-broadcast fs-1 d-block mb-2"></i>
              <h6>No solar microgrid stations found.</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-custom mb-0">
                <thead>
                  <tr>
                    <th>Hub Code</th>
                    <th>Station Name & Location</th>
                    <th>GPS Coordinates</th>
                    <th>Capacity</th>
                    <th>Battery Slots (Available/Total)</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node.id}>
                      <td>
                        <span className="fw-bold font-monospace text-primary">{node.stationCode}</span>
                      </td>
                      <td>
                        <div className="fw-bold">{node.stationName}</div>
                        <small className="text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          {node.address}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark font-monospace border">
                          {node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold text-success">{node.capacityKWh} kW/h</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`badge ${
                              node.availableBatterySlots > 0 ? 'bg-success' : 'bg-danger'
                            }`}
                          >
                            {node.availableBatterySlots} / {node.totalBatterySlots}
                          </span>
                          {(isGridOperator || isBackOffice) && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary btn-sm py-0 px-2"
                                title="Decrement Available Slot"
                                onClick={() => handleAdjustBatterySlots(node, -1)}
                                disabled={node.availableBatterySlots <= 0}
                              >
                                -
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm py-0 px-2"
                                title="Increment Available Slot"
                                onClick={() => handleAdjustBatterySlots(node, 1)}
                                disabled={node.availableBatterySlots >= node.totalBatterySlots}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="small text-muted font-monospace">
                          <i className="bi bi-clock me-1"></i>
                          {node.operatingHours}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${node.isActive ? 'badge-hub-active' : 'badge-hub-inactive'}`}>
                          {node.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          {/* Manage Slots */}
                          <button
                            className="btn btn-outline-primary btn-sm"
                            title="Manage Booking Slots"
                            onClick={() => openSlotsModal(node)}
                          >
                            <i className="bi bi-calendar-event me-1"></i> Slots
                          </button>

                          {/* Quick Schedule Update (Backoffice) */}
                          {isBackOffice && (
                            <button
                              className="btn btn-outline-info btn-sm"
                              title="Update Operational Schedule"
                              onClick={() => openScheduleModal(node)}
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>
                          )}

                          {/* Edit Details (Backoffice) */}
                          {isBackOffice && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              title="Edit Hub Details"
                              onClick={() => openEditModal(node)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}

                          {/* Deactivate / Reactivate (Backoffice) */}
                          {isBackOffice && (
                            node.isActive ? (
                              <button
                                className="btn btn-outline-warning btn-sm"
                                title="Deactivate Hub (Blocked if active reservations exist)"
                                onClick={() => handleDeactivate(node)}
                              >
                                <i className="bi bi-pause-circle"></i>
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline-success btn-sm"
                                title="Reactivate Hub"
                                onClick={() => handleActivate(node)}
                              >
                                <i className="bi bi-play-circle"></i>
                              </button>
                            )
                          )}

                          {/* Delete Solar Station (Backoffice) */}
                          {isBackOffice && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Delete Hub (Blocked if active reservations exist)"
                              onClick={() => handleDeleteNode(node)}
                            >
                              <i className="bi bi-trash"></i>
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
      {/* Modal: Register New Microgrid Hub (Backoffice)                     */}
      {/* ------------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-plus-circle text-primary me-2"></i>
                  Register Solar Microgrid Station Hub
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Station Code *</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. HUB-COL-02"
                        value={createForm.stationCode}
                        onChange={(e) => setCreateForm({ ...createForm, stationCode: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Station Hub Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Colombo South Solar Exchange"
                        value={createForm.stationName}
                        onChange={(e) => setCreateForm({ ...createForm, stationName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Physical Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="No 80, High Level Road, Nugegoda"
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">GPS Latitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        value={createForm.latitude}
                        onChange={(e) => setCreateForm({ ...createForm, latitude: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <small className="text-muted">Used for Google Maps plotting</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">GPS Longitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        value={createForm.longitude}
                        onChange={(e) => setCreateForm({ ...createForm, longitude: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <small className="text-muted">Used for Google Maps plotting</small>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Capacity (kW/h) *</label>
                      <input
                        type="number"
                        min="10"
                        className="form-control"
                        value={createForm.capacityKWh}
                        onChange={(e) => setCreateForm({ ...createForm, capacityKWh: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Total Battery Slots *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={createForm.totalBatterySlots}
                        onChange={(e) => {
                          const total = parseInt(e.target.value) || 1;
                          setCreateForm({
                            ...createForm,
                            totalBatterySlots: total,
                            availableBatterySlots: total,
                          });
                        }}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Operating Schedule *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="06:00 - 22:00"
                        value={createForm.operatingHours}
                        onChange={(e) => setCreateForm({ ...createForm, operatingHours: e.target.value })}
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
                    Register Hub
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Quick Update Schedule (Backoffice)                          */}
      {/* ------------------------------------------------------------------- */}
      {showScheduleModal && selectedNode && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-clock-history text-primary me-2"></i>
                  Update Operational Schedule
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowScheduleModal(false)}></button>
              </div>

              <form onSubmit={handleScheduleSubmit}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Update operating hours for <strong>{selectedNode.stationName}</strong> ({selectedNode.stationCode}).
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Operating Schedule *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 05:30 - 23:00 or 24 Hours"
                      value={scheduleOperatingHours}
                      onChange={(e) => setScheduleOperatingHours(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-gridlink">
                    Save Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Edit Microgrid Hub Details (Backoffice)                      */}
      {/* ------------------------------------------------------------------- */}
      {showEditModal && selectedNode && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Edit Station Hub: {selectedNode.stationCode}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Station Hub Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.stationName}
                        onChange={(e) => setEditForm({ ...editForm, stationName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Physical Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">GPS Latitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">GPS Longitude *</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Capacity (kW/h) *</label>
                      <input
                        type="number"
                        min="10"
                        className="form-control"
                        value={editForm.capacityKWh}
                        onChange={(e) => setEditForm({ ...editForm, capacityKWh: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Total Battery Slots *</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={editForm.totalBatterySlots}
                        onChange={(e) => setEditForm({ ...editForm, totalBatterySlots: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Available Battery Slots *</label>
                      <input
                        type="number"
                        min="0"
                        max={editForm.totalBatterySlots}
                        className="form-control"
                        value={editForm.availableBatterySlots}
                        onChange={(e) =>
                          setEditForm({ ...editForm, availableBatterySlots: parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Operating Schedule *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.operatingHours}
                        onChange={(e) => setEditForm({ ...editForm, operatingHours: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Active Status</label>
                      <select
                        className="form-select"
                        value={editForm.isActive ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
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

      {/* ------------------------------------------------------------------- */}
      {/* Modal: Station Booking Slots CRUD Management (Create, Read, Update, Delete) */}
      {/* ------------------------------------------------------------------- */}
      {showSlotsModal && selectedNode && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-calendar2-range text-primary me-2"></i>
                  Booking Slots: {selectedNode.stationName} ({selectedNode.stationCode})
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSlotsModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Form to edit an existing slot */}
                {editingSlot && (
                  <div className="card bg-warning-subtle border-warning p-3 mb-4 rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 text-dark">
                        <i className="bi bi-pencil me-1"></i> Edit Slot #{editingSlot.slotNumber}
                      </h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setEditingSlot(null)}
                      >
                        Cancel Edit
                      </button>
                    </div>
                    <form onSubmit={handleUpdateSlotSubmit} className="row g-2 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Slot Date & Time *</label>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={editSlotForm.slotTime}
                          onChange={(e) => setEditSlotForm({ ...editSlotForm, slotTime: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Duration (min)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editSlotForm.durationMinutes}
                          onChange={(e) =>
                            setEditSlotForm({ ...editSlotForm, durationMinutes: parseInt(e.target.value) || 60 })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Cap (kW/h)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editSlotForm.capacityKWh}
                          onChange={(e) =>
                            setEditSlotForm({ ...editSlotForm, capacityKWh: parseFloat(e.target.value) || 50 })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Rate (LKR/kWh)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editSlotForm.ratePerKWh}
                          onChange={(e) =>
                            setEditSlotForm({ ...editSlotForm, ratePerKWh: parseFloat(e.target.value) || 45 })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-1">
                        <label className="form-label small fw-semibold">Available</label>
                        <select
                          className="form-select form-select-sm"
                          value={editSlotForm.isAvailable ? 'true' : 'false'}
                          onChange={(e) =>
                            setEditSlotForm({ ...editSlotForm, isAvailable: e.target.value === 'true' })
                          }
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <button type="submit" className="btn btn-success btn-sm w-100">
                          <i className="bi bi-check-lg me-1"></i> Update Slot
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Form to add a new slot */}
                {(isBackOffice || isGridOperator) && !editingSlot && (
                  <div className="card bg-light border p-3 mb-4 rounded-3">
                    <h6 className="fw-bold mb-3 text-secondary">
                      <i className="bi bi-plus-circle me-1"></i> Add New Energy Slot
                    </h6>
                    <form onSubmit={handleAddSlotSubmit} className="row g-2 align-items-end">
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold">Slot Date & Time *</label>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={newSlotTime}
                          onChange={(e) => setNewSlotTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Duration (min)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={newSlotDuration}
                          onChange={(e) => setNewSlotDuration(parseInt(e.target.value) || 60)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Cap (kW/h)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={newSlotCapacity}
                          onChange={(e) => setNewSlotCapacity(parseFloat(e.target.value) || 50)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Rate (LKR/kWh)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={newSlotRate}
                          onChange={(e) => setNewSlotRate(parseFloat(e.target.value) || 45)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <button type="submit" className="btn btn-primary-gridlink btn-sm w-100">
                          <i className="bi bi-plus-lg me-1"></i> Add Slot
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Slots Table */}
                <h6 className="fw-bold mb-2">Available & Scheduled Slots ({slots.length})</h6>
                {slotsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 small text-muted">Loading slots...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="alert alert-info small mb-0">
                    No booking slots configured for this solar hub yet. Use the form above to add slots.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle table-custom mb-0">
                      <thead>
                        <tr>
                          <th>Slot #</th>
                          <th>Slot Time</th>
                          <th>Duration</th>
                          <th>Capacity (kW/h)</th>
                          <th>Rate (LKR/kWh)</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slots.map((s) => (
                          <tr key={s.id}>
                            <td className="fw-bold text-primary">Slot #{s.slotNumber}</td>
                            <td>
                              <div>{new Date(s.slotTime).toLocaleDateString()}</div>
                              <small className="text-muted">
                                {new Date(s.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </td>
                            <td>{s.durationMinutes} mins</td>
                            <td>{s.capacityKWh} kW/h</td>
                            <td>LKR {s.ratePerKWh.toFixed(2)}</td>
                            <td>
                              <span className={`badge ${s.isAvailable ? 'bg-success' : 'bg-secondary'}`}>
                                {s.isAvailable ? 'Available' : 'Booked'}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                {(isBackOffice || isGridOperator) && (
                                  <button
                                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                                    onClick={() => startEditSlot(s)}
                                    title="Edit Slot"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
                                {isBackOffice && (
                                  <button
                                    className="btn btn-outline-danger btn-sm py-0 px-2"
                                    onClick={() => handleDeleteSlot(s.id)}
                                    title="Delete Slot"
                                  >
                                    <i className="bi bi-trash"></i>
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

              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSlotsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
