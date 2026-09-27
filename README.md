# GridLink - Smart Solar Microgrid Trading System (Web Interface)

**Module:** SE4040 Enterprise Application Development  
**Assignment:** Assignment 1 – Smart Solar Microgrid Trading System  
**Client:** React + TypeScript + Bootstrap 5 + Leaflet GIS (Vite)

---

## 1. Overview

GridLink Web Interface is the presentation client for back-office administration and microgrid site operators, adhering strictly to the **FAT Service pattern** where business rules reside in the central ASP.NET Core Web API.

### Key Capabilities
- **User Management & RBAC:** Role-based access control supporting BackOffice administrators and Grid Operators. Create, edit, delete, activate, and deactivate users, with actionable approval for pending activations.
- **Prosumer Management:** Manage solar prosumers using National Identity Card (NIC) as the unique primary key. Search prosumers, inspect trading history, deactivate accounts, and enforce the rule that deactivated accounts can **only** be reactivated by Backoffice officers.
- **Microgrid Node Management:** Manage solar grid hubs with GPS locations, capacity specs (kW/h), and battery slot availability. Supports updating operational schedules, station deletion with active reservation safety guards, and full CRUD on energy booking slots (create, update, delete).
- **Power Trading Slot Reservations:** Manage energy drop-off and charging reservations. Enforces 7-day advance booking rules and 12-hour notice for cancellations/updates, with automated QR code dispatch and cancellation receipt summaries.
- **Operational Dashboard:** Live metrics displaying pending reservations, count of approved future reservations, active hubs, and battery slots. Includes views for current/pending bookings, full booking history, and search filters.
- **Operator Verification & Scanner:** Scan/input prosumer transaction QR codes, verify cryptographic signatures against the server, and finalize physical energy transfer jobs as Completed. Includes QR image file upload and Viva quick demo helpers.
- **Geospatial Station Map:** Plots solar stations on an interactive GIS map from stored GPS coordinates with proximity radius search.

---

## 2. Environment Configuration

Create a `.env` file in the root of `GridLink-Web-Interface` (a template is provided in `.env.example`):

```env
# Backend ASP.NET Core Web API Base URL
VITE_API_BASE_URL=http://localhost:5015

# Application Branding
VITE_APP_TITLE=GridLink - Smart Solar Microgrid Trading System

# Geospatial Default Map Coordinates (Colombo, Sri Lanka)
VITE_DEFAULT_MAP_LAT=6.9271
VITE_DEFAULT_MAP_LNG=79.8612
VITE_DEFAULT_MAP_ZOOM=8

# Proximity Search Default Radius (km)
VITE_DEFAULT_NEARBY_RADIUS_KM=50
```

---

## 3. Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Running instance of `GridLink-API` (ASP.NET Core Web API on port 5015)

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 4. Default Demo Accounts

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **BackOffice Admin** | `admin@gridlink.com` | `Admin@123` | Full system administration, user management, hub CRUD, prosumer reactivation, slot approvals |
| **Grid Site Operator** | `operator@gridlink.com` | `Operator@123` | Operational tools, QR verification & finalization, battery slot adjustments, slot management |
