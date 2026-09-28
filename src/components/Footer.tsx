// ============================================================================
// File: Footer.tsx
// Project: GridLink - Smart Solar Microgrid Trading System
// Module: Footer Component
// ============================================================================

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-custom mt-auto">
      <div className="container d-flex flex-column flex-md-row justify-content-between gap-1">
        <span>GridLink Energy Networks &middot; Solar microgrid trading &amp; distribution</span>
        <span>&copy; {new Date().getFullYear()} GridLink</span>
      </div>
    </footer>
  );
};
