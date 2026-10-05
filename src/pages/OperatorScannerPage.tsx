// ============================================================================
// File: OperatorScannerPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Operator Mode - QR Verification & Energy Transfer Finalization
// Description: Allows Grid Operators to verify transaction QR payloads against
//              the central Web API, review prosumer details, scan QR images,
//              and finalize physical energy transfer jobs as Completed.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Reservation } from '../types';

export const OperatorScannerPage: React.FC = () => {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedReservation, setVerifiedReservation] = useState<Reservation | null>(null);
  const [actualKWh, setActualKWh] = useState<number>(0);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e?: React.FormEvent, customPayload?: string) => {
    if (e) e.preventDefault();
    const payloadToVerify = (customPayload || qrInput).trim();

    if (!payloadToVerify) {
      setAlert({ type: 'warning', message: 'Please input or scan transaction QR payload data.' });
      return;
    }

    setAlert(null);
    setLoading(true);
    setVerifiedReservation(null);

    try {
      const res = await api.verifyQrCode(payloadToVerify);
      if (res.success && res.data) {
        setVerifiedReservation(res.data);
        setActualKWh(res.data.requestedEnergyKWh);
        setAlert({
          type: 'success',
          message: `Verified transaction for prosumer ${res.data.prosumerName} (${res.data.nic}) successfully!`,
        });
      } else {
        setAlert({
          type: 'danger',
          message: res.message || 'QR verification failed: Invalid payload or signature mismatch.',
        });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', message: err.message || 'Error communicating with verification service.' });
    } finally {
      setLoading(false);
    }
  };

  // Image File QR Detection (Standard Web BarcodeDetector API)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          setQrInput(rawValue);
          setAlert({
            type: 'success',
            message: 'QR code detected from uploaded image! Click Verify to validate.',
          });
          handleVerify(undefined, rawValue);
          return;
        }
      }
    } catch (err: any) {
      console.warn('BarcodeDetector error:', err);
    }

    // Fallback: Read as text if json file or alert user
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && (text.includes('resNum') || text.includes('RES-'))) {
        setQrInput(text);
        setAlert({ type: 'success', message: 'Loaded QR payload from file.' });
        handleVerify(undefined, text);
      } else {
        setAlert({
          type: 'warning',
          message:
            'Could not extract QR payload from image directly in this browser. Please enter or paste the QR code payload in the input field below.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedReservation) return;

    if (actualKWh <= 0) {
      setAlert({ type: 'warning', message: 'Actual transferred energy must be greater than zero.' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await api.finalizeReservation(verifiedReservation.id, {
        actualEnergyTransferredKWh: actualKWh,
        operatorNotes: operatorNotes || 'Energy transfer completed and verified by operator at station.',
      });

      if (res.success && res.data) {
        setAlert({
          type: 'success',
          message: `Transaction ${res.data.reservationNumber} finalized! Job updated to Completed.`,
        });
        setVerifiedReservation(res.data);
      } else {
        setAlert({ type: 'danger', message: res.message || 'Failed to finalize transaction.' });
      }
    } catch (err: any) {
      setAlert({ type: 'danger', message: err.message || 'Error finalizing transaction.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Title */}
      <div className="mb-4 pb-2 border-bottom">
        <h2 className="fw-semibold mb-1">
          Grid Operator Mode &amp; Verification
        </h2>
        <p className="text-muted small mb-0">
          Scan or input prosumer transaction QR data, verify cryptographic integrity on server, and finalize physical energy transfer.
        </p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i className="bi bi-info-circle me-2 fs-5"></i>
          <strong>{alert.message}</strong>
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left: QR Verification Input */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-camera me-2 text-primary"></i>
                Scan / Enter Transaction QR Payload
              </h5>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="bi bi-file-earmark-image me-1"></i> Upload QR Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,.json,.txt"
                onChange={handleImageUpload}
              />
            </div>

            <div className="card-body">
              <form onSubmit={handleVerify}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">QR Code String Payload *</label>
                  <textarea
                    className="form-control font-monospace"
                    rows={6}
                    placeholder='Paste raw QR payload or JSON: {"resNum":"RES-2026...","nic":"...","sec":"..."}'
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    required
                  ></textarea>
                  <small className="text-muted">
                    The mobile app generates this secure string containing SHA256 checksums verified by the Web API.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-gridlink w-100 py-2 fw-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Verifying on Server...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check me-2"></i>
                      Verify Transaction QR
                    </>
                  )}
                </button>
              </form>

              {/* Operator Verification Guidelines */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-semibold text-secondary mb-2">
                  <i className="bi bi-shield-check text-primary me-1"></i> Operator Verification Protocol
                </h6>
                <ul className="text-muted small ps-3 mb-0">
                  <li className="mb-1">Request the prosumer to display their official reservation QR token.</li>
                  <li className="mb-1">Scan via connected optical hardware or upload an image capture.</li>
                  <li className="mb-1">Verify that the vehicle/battery identification matches the station record.</li>
                  <li>Confirm physical meter reading prior to recording the final transfer.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Verification & Finalize Panel */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-clipboard2-check me-2 text-success"></i>
                Verified Transaction Details
              </h5>
              {verifiedReservation && (
                <span
                  className={`badge ${
                    verifiedReservation.status === 'Completed'
                      ? 'bg-primary'
                      : verifiedReservation.status === 'Approved'
                      ? 'bg-success'
                      : 'bg-secondary'
                  }`}
                >
                  {verifiedReservation.status}
                </span>
              )}
            </div>

            <div className="card-body">
              {!verifiedReservation ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-upc-scan fs-1 d-block mb-3 text-secondary"></i>
                  <h6>No verified reservation loaded yet.</h6>
                  <p className="small text-muted mb-0">
                    Scan or enter a QR payload on the left panel to load and finalize the power transfer.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="alert alert-success d-flex align-items-center mb-3 py-2">
                    <i className="bi bi-shield-fill-check fs-4 me-2"></i>
                    <div>
                      <strong>Server Signature Valid:</strong> Authenticated reservation for{' '}
                      <strong>{verifiedReservation.prosumerName}</strong>.
                    </div>
                  </div>

                  <div className="list-group list-group-flush border rounded-3 mb-3 small">
                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Reservation Number:</span>
                      <strong className="font-monospace text-primary">
                        {verifiedReservation.reservationNumber}
                      </strong>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Prosumer NIC:</span>
                      <strong className="font-monospace">{verifiedReservation.nic}</strong>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Prosumer Name:</span>
                      <span>{verifiedReservation.prosumerName}</span>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Station Hub:</span>
                      <span>{verifiedReservation.stationName}</span>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Scheduled Time:</span>
                      <span>{new Date(verifiedReservation.reservationDateTime).toLocaleString()}</span>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Trading Type:</span>
                      <span className="badge bg-light text-dark border">
                        {verifiedReservation.tradingType}
                      </span>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Requested Energy:</span>
                      <strong className="text-success">
                        {verifiedReservation.requestedEnergyKWh} kW/h
                      </strong>
                    </div>
                  </div>

                  {/* Finalize Job Section */}
                  {verifiedReservation.status === 'Completed' ? (
                    <div className="alert alert-info text-center py-3 mb-0">
                      <i className="bi bi-check-circle-fill fs-3 text-primary d-block mb-1"></i>
                      <h6 className="fw-bold mb-1">Job Finalized &amp; Completed</h6>
                      <small className="text-muted d-block">
                        Actual Energy Transferred: <strong>{verifiedReservation.actualEnergyTransferredKWh} kW/h</strong>
                      </small>
                      <small className="text-muted d-block">
                        Finalized At: {verifiedReservation.finalizedAt ? new Date(verifiedReservation.finalizedAt).toLocaleString() : 'Done'}
                      </small>
                    </div>
                  ) : (
                    <form onSubmit={handleFinalize} className="border p-3 rounded-3 bg-light">
                      <h6 className="fw-bold mb-3 text-dark">
                        <i className="bi bi-lightning-charge-fill text-warning me-1"></i>
                        Finalize Energy Transfer &amp; Close Job
                      </h6>

                      <div className="mb-3">
                        <label className="form-label fw-semibold small">
                          Actual Energy Transferred (kW/h) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          className="form-control form-control-sm"
                          value={actualKWh}
                          onChange={(e) => setActualKWh(parseFloat(e.target.value) || 0)}
                          required
                        />
                        <small className="text-muted">Read directly from smart meter / charging station.</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Operator Station Notes</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          placeholder="e.g. Battery condition verified, energy transferred via Port A."
                          value={operatorNotes}
                          onChange={(e) => setOperatorNotes(e.target.value)}
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-success w-100 py-2 fw-bold"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Finalizing Job...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check2-circle me-1"></i> Complete &amp; Finalize Job
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
