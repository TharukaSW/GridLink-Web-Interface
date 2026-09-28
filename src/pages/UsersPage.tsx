// ============================================================================
// File: UsersPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: User Administration Screen (BackOffice Only)
// Description: Manages web application user accounts with Backoffice and
//              Grid Operator roles, full CRUD operations (create, edit, delete),
//              lifecycle status toggles, and actionable pending activation approvals.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole, UpdateUserDTO } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    nic: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    role: 'GridOperator',
  });

  // Edit User Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserDTO>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'GridOperator',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers(roleFilter || undefined, statusFilter || undefined);
      if (res.success && res.data) {
        setUsers(res.data);
      }

      const pendingRes = await api.getPendingUserActivations();
      if (pendingRes.success && pendingRes.data) {
        setPendingUsers(pendingRes.data);
      }
    } catch (err: any) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load system users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  // Handle User Registration
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const res = await api.createUser(createForm);
    if (res.success) {
      setAlert({
        type: 'success',
        message: `User "${createForm.fullName}" registered successfully with ${createForm.role} role!`,
      });
      setShowCreateModal(false);
      fetchUsers();
      setCreateForm({
        nic: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        password: '',
        role: 'GridOperator',
      });
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to register user.' });
    }
  };

  // Open Edit User Modal
  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      address: u.address,
      role: u.role,
    });
    setShowEditModal(true);
  };

  // Handle User Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAlert(null);

    const res = await api.updateUser(selectedUser.id, editForm);
    if (res.success) {
      setAlert({
        type: 'success',
        message: `Account details for "${editForm.fullName}" updated successfully.`,
      });
      setShowEditModal(false);
      fetchUsers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to update user.' });
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (u: User) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${u.fullName}" (${u.email})?`)) {
      return;
    }

    setAlert(null);
    const res = await api.deleteUser(u.id);
    if (res.success) {
      setAlert({ type: 'success', message: `User "${u.fullName}" deleted successfully.` });
      fetchUsers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Failed to delete user.' });
    }
  };

  // Handle Activate / Deactivate Toggle
  const handleToggleStatus = async (user: User) => {
    const actionName = user.status === 'Active' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} account for ${user.fullName}?`)) return;

    setAlert(null);
    const res = await api.toggleUserStatus(user.id, user.status);
    if (res.success) {
      setAlert({
        type: 'success',
        message: `User ${user.fullName} is now ${user.status === 'Active' ? 'Inactive' : 'Active'}.`,
      });
      fetchUsers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Status update failed.' });
    }
  };

  // Handle Pending Activation Direct Approval
  const handleApprovePending = async (user: User) => {
    setAlert(null);
    const res = await api.activateUser(user.id);
    if (res.success) {
      setAlert({
        type: 'success',
        message: `Pending account for "${user.fullName}" has been approved and activated!`,
      });
      fetchUsers();
    } else {
      setAlert({ type: 'danger', message: res.message || 'Approval failed.' });
    }
  };

  // Apply client-side search filter
  const targetList = activeTab === 'all' ? users : pendingUsers;
  const filteredUsers = targetList.filter((u) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.nic.toLowerCase().includes(q) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container py-4">
      {/* Title & Top Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-semibold mb-1">
            User Management & Role-Based Access
          </h2>
          <p className="text-muted small mb-0">
            Create and administer web application users with Backoffice and Grid Operator roles.
          </p>
        </div>

        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button className="btn btn-primary-gridlink btn-sm" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-person-plus-fill me-1"></i> Create System User
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
                : 'bi-exclamation-octagon'
            } me-2 fs-5`}
          ></i>
          <strong>{alert.message}</strong>
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Tabs: All Users vs Pending Activations View */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="bi bi-people me-1"></i> All Users ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active bg-warning text-dark' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="bi bi-hourglass-split me-1"></i> Pending Activations View ({pendingUsers.length})
          </button>
        </li>
      </ul>

      {/* Search and Filters */}
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
                  placeholder="Search by name, NIC, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {activeTab === 'all' && (
              <>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="BackOffice">BackOffice Administrators</option>
                    <option value="GridOperator">Grid Operators</option>
                    <option value="Prosumer">Prosumers</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="PendingApproval">Pending Approval</option>
                  </select>
                </div>
              </>
            )}

            <div className={activeTab === 'all' ? 'col-md-2' : 'col-md-7 text-md-end'}>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setRoleFilter('');
                  setStatusFilter('');
                  setSearchTerm('');
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading system users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1 d-block mb-2"></i>
              <h6>No users found matching current filters.</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-custom mb-0">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>NIC Primary Key</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-bold">{u.fullName}</td>
                      <td>
                        <span className="badge bg-light text-dark font-monospace border">{u.nic}</span>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phoneNumber || 'N/A'}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'BackOffice'
                              ? 'badge-role-backoffice'
                              : u.role === 'GridOperator'
                              ? 'badge-role-operator'
                              : 'badge-role-prosumer'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.status === 'Active'
                              ? 'bg-success'
                              : u.status === 'PendingApproval'
                              ? 'bg-warning text-dark'
                              : 'bg-secondary'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group">
                          {/* If in pending view or user is pending approval, offer 1-click Approve button */}
                          {u.status === 'PendingApproval' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprovePending(u)}
                              title="Approve & Activate Account"
                            >
                              <i className="bi bi-check-circle me-1"></i> Approve
                            </button>
                          )}

                          {/* Edit user button */}
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => openEditModal(u)}
                            title="Edit User Account"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            className={`btn btn-sm ${
                              u.status === 'Active' ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.status === 'Active' ? (
                              <i className="bi bi-pause-circle"></i>
                            ) : (
                              <i className="bi bi-play-circle"></i>
                            )}
                          </button>

                          {/* Delete user button */}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User Permanently"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-person-plus text-primary me-2"></i>
                  Create Web Application User
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Kasun Perera"
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">National Identity Card (NIC) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 199512345678 or 951234567V"
                        value={createForm.nic}
                        onChange={(e) => setCreateForm({ ...createForm, nic: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@gridlink.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Mobile Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0771234567"
                        value={createForm.phoneNumber}
                        onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Physical Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="No 12, Kandy Road, Kiribathgoda"
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="At least 6 characters"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Assigned Role *</label>
                      <select
                        className="form-select"
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                        required
                      >
                        <option value="GridOperator">Grid Operator (Operational tools & QR verification)</option>
                        <option value="BackOffice">BackOffice (Full administrative control)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-gridlink">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {showEditModal && selectedUser && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header modal-header-custom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Edit User Details ({selectedUser.nic})
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Mobile Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Assigned Role *</label>
                      <select
                        className="form-select"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                        required
                      >
                        <option value="GridOperator">Grid Operator</option>
                        <option value="BackOffice">BackOffice Administrator</option>
                        <option value="Prosumer">Prosumer</option>
                      </select>
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
