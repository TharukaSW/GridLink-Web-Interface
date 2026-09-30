// ============================================================================
// File: StationsMapPage.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Geospatial Map View & Nearby Station Discovery
// Description: Plots solar microgrid stations on an interactive Leaflet map
//              from stored latitude and longitude, with station details on selection
//              and proximity distance queries (Page 9 marking rubric).
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { MicrogridNode } from '../types';

declare const L: any; // Leaflet global from index.html CDN

export const StationsMapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [stations, setStations] = useState<MicrogridNode[]>([]);
  const [selectedStation, setSelectedStation] = useState<MicrogridNode | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultLat = parseFloat(import.meta.env.VITE_DEFAULT_MAP_LAT || '6.9271') || 6.9271;
  const defaultLng = parseFloat(import.meta.env.VITE_DEFAULT_MAP_LNG || '79.8612') || 79.8612;
  const defaultRadius = parseInt(import.meta.env.VITE_DEFAULT_NEARBY_RADIUS_KM || '50') || 50;

  // Proximity Search State
  const [searchLat, setSearchLat] = useState<number>(defaultLat);
  const [searchLon, setSearchLon] = useState<number>(defaultLng);
  const [searchRadius, setSearchRadius] = useState<number>(defaultRadius);
  const [isNearbyMode, setIsNearbyMode] = useState(false);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await api.getMicrogridNodes();
      if (res.success && res.data) {
        setStations(res.data);
        if (res.data.length > 0) {
          setSelectedStation(res.data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProximitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.getNearbyNodes(searchLat, searchLon, searchRadius);
      if (res.success && res.data) {
        setStations(res.data);
        setIsNearbyMode(true);
        if (res.data.length > 0) {
          setSelectedStation(res.data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setIsNearbyMode(false);
    fetchStations();
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet script is still loading from CDN.');
      return;
    }

    // Initialize map if not yet created
    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current).setView([6.9271, 79.8612], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Plot stations
    stations.forEach((s) => {
      if (s.latitude && s.longitude) {
        const marker = L.marker([s.latitude, s.longitude]).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong style="color: #22496e;">${s.stationName}</strong><br/>
            <code>${s.stationCode}</code><br/>
            <span>Cap: ${s.capacityKWh} kW/h</span><br/>
            <span>Battery Slots: ${s.availableBatterySlots}/${s.totalBatterySlots}</span><br/>
            <small style="color: #6b6a63;">${s.operatingHours}</small>
          </div>
        `);

        marker.on('click', () => {
          setSelectedStation(s);
        });

        markersRef.current.push(marker);
      }
    });

    // If there are markers, fit bounds
    if (stations.length > 0) {
      const group = L.featureGroup(markersRef.current);
      if (markersRef.current.length > 0) {
        map.fitBounds(group.getBounds().pad(0.2));
      }
    }
  }, [stations]);

  // Center on selected station
  const handleSelectStation = (station: MicrogridNode) => {
    setSelectedStation(station);
    if (leafletMapRef.current && station.latitude && station.longitude) {
      leafletMapRef.current.setView([station.latitude, station.longitude], 12, {
        animate: true,
      });
    }
  };

  return (
    <div className="container py-4">
      {/* Title */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-semibold mb-1">
            Solar Microgrid Stations Map
          </h2>
          <p className="text-muted small mb-0">
            Interactive GIS plotting of solar microgrid hubs based on stored GPS latitude and longitude.
          </p>
        </div>

        <button className="btn btn-outline-secondary btn-sm" onClick={fetchStations}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Map
        </button>
      </div>

      {/* Proximity Radius Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <form onSubmit={handleProximitySearch} className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Latitude</label>
              <input
                type="number"
                step="0.0001"
                className="form-control form-control-sm"
                value={searchLat}
                onChange={(e) => setSearchLat(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Longitude</label>
              <input
                type="number"
                step="0.0001"
                className="form-control form-control-sm"
                value={searchLon}
                onChange={(e) => setSearchLon(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Radius (km)</label>
              <input
                type="number"
                min="1"
                max="500"
                className="form-control form-control-sm"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value) || 50)}
                required
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary-gridlink btn-sm flex-grow-1">
                <i className="bi bi-compass me-1"></i> Discover Nearby
              </button>
              {isNearbyMode && (
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleResetSearch}>
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Map Viewer */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-map me-2 text-primary"></i>
                Geospatial Microgrid Distribution ({stations.length} Plotted)
              </h5>
              <span className="badge bg-secondary-subtle text-secondary small">
                Click any marker to view node specs
              </span>
            </div>

            <div className="card-body p-0">
              <div ref={mapContainerRef} className="map-container" style={{ height: '520px', borderRadius: '0' }}></div>
            </div>
          </div>
        </div>

        {/* Right: Station Details Card */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                Station Details on Selection
              </h5>
            </div>

            <div className="card-body">
              {!selectedStation ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-pin-map fs-1 d-block mb-2 text-secondary"></i>
                  <h6>Select a station from the map or list below.</h6>
                </div>
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold text-dark mb-0">{selectedStation.stationName}</h5>
                      <span className="badge bg-primary-subtle text-primary font-monospace mt-1">
                        {selectedStation.stationCode}
                      </span>
                    </div>
                    <span className={`badge ${selectedStation.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {selectedStation.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="small text-muted mb-3">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                    {selectedStation.address}
                  </p>

                  {selectedStation.distanceKm !== undefined && (
                    <div className="alert alert-success py-2 small mb-3">
                      <i className="bi bi-cursor-fill me-1"></i>
                      Distance: <strong>{selectedStation.distanceKm} km</strong> from query location
                    </div>
                  )}

                  <div className="list-group list-group-flush border rounded-3 mb-3 small">
                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">GPS Coordinates:</span>
                      <strong className="font-monospace">
                        {selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}
                      </strong>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Generation Capacity:</span>
                      <strong className="text-success">{selectedStation.capacityKWh} kW/h</strong>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Battery Slots:</span>
                      <span className="badge bg-primary">
                        {selectedStation.availableBatterySlots} / {selectedStation.totalBatterySlots} Available
                      </span>
                    </div>

                    <div className="list-group-item d-flex justify-content-between">
                      <span className="text-muted">Operating Schedule:</span>
                      <strong>{selectedStation.operatingHours}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick List Selector */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-2 border-bottom">
              <span className="fw-bold small text-muted text-uppercase">Stations List</span>
            </div>
            <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '220px' }}>
              {stations.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center small py-2 ${
                    selectedStation?.id === s.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectStation(s)}
                >
                  <div>
                    <strong>{s.stationCode}</strong> &middot; {s.stationName}
                  </div>
                  {s.distanceKm !== undefined && (
                    <span className="badge bg-light text-dark border">{s.distanceKm} km</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
