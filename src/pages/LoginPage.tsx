// ============================================================================
// File: LoginPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Authentication Screen
// Description: Secure enterprise portal login supporting BackOffice administrators
//              and Grid Site Operators.
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

import { AuthUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user?: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h3 className="fw-semibold mb-1">Sign in</h3>
              <p className="text-muted small mb-4">Back-office and grid operator accounts</p>

              {errorMsg && (
                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
                  <div>{errorMsg}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-medium">Email or NIC</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="name@gridlink.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-medium">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-gridlink w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
