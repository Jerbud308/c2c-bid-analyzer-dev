// ============================================================================
// C2C Restoration Government Bid Analyzer - Main App
// ============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { OpportunitiesDashboard } from './components/OpportunitiesDashboard';

// Placeholder components (to be implemented)
function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload New Opportunity</h1>
        <p className="text-gray-600">Upload page coming soon...</p>
        <Link to="/dashboard" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function ProcessingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Processing Document</h1>
        <p className="text-gray-600">Processing page coming soon...</p>
        <Link to="/dashboard" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analysis View</h1>
        <p className="text-gray-600">Analysis page coming soon...</p>
        <Link to="/dashboard" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Not Found</h1>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main App Component
// ----------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirects to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Main routes */}
        <Route path="/dashboard" element={<OpportunitiesDashboard />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/processing/:id" element={<ProcessingPage />} />
        <Route path="/analysis/:id" element={<AnalysisPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
