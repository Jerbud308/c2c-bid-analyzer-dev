// ============================================================================
// Component: BulkActionBar
// ============================================================================
// Fixed bottom bar for bulk actions on selected opportunities
// ============================================================================

import React, { useState } from 'react';
import type { OpportunityStatus } from '../lib/types';

interface BulkActionBarProps {
  selectedCount: number;
  onMarkAsPass: () => void;
  onDelete: () => void;
  onExport: (format: 'csv' | 'excel') => void;
  onClearSelection: () => void;
  onChangeStatus: (status: OpportunityStatus) => void;
}

export function BulkActionBar({
  selectedCount,
  onMarkAsPass,
  onDelete,
  onExport,
  onClearSelection,
  onChangeStatus,
}: BulkActionBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleStatusChange = (status: OpportunityStatus) => {
    onChangeStatus(status);
    setShowStatusMenu(false);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    onExport(format);
    setShowExportMenu(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Selection Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{selectedCount}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear selection
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Change Status (with dropdown) */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Change Status ▼
              </button>
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 right-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                  <StatusMenuItem status="reviewed" onClick={handleStatusChange} />
                  <StatusMenuItem status="bidding" onClick={handleStatusChange} />
                  <StatusMenuItem status="pass" onClick={handleStatusChange} />
                  <StatusMenuItem status="submitted" onClick={handleStatusChange} />
                  <StatusMenuItem status="won" onClick={handleStatusChange} />
                  <StatusMenuItem status="lost" onClick={handleStatusChange} />
                </div>
              )}
            </div>

            {/* Mark as Pass */}
            <button
              onClick={onMarkAsPass}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Mark as Pass
            </button>

            {/* Export (with dropdown) */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
              >
                Export ▼
              </button>
              {showExportMenu && (
                <div className="absolute bottom-full mb-2 right-0 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as Excel
                  </button>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Status Menu Item
// ----------------------------------------------------------------------------

interface StatusMenuItemProps {
  status: OpportunityStatus;
  onClick: (status: OpportunityStatus) => void;
}

function StatusMenuItem({ status, onClick }: StatusMenuItemProps) {
  const statusLabels: Record<OpportunityStatus, string> = {
    new: 'New',
    analyzing: 'Analyzing',
    reviewed: 'Reviewed',
    bidding: 'Bidding',
    submitted: 'Submitted',
    won: 'Won',
    lost: 'Lost',
    pass: 'Pass',
  };

  const statusIcons: Record<OpportunityStatus, string> = {
    new: '🆕',
    analyzing: '🔄',
    reviewed: '✅',
    bidding: '📝',
    submitted: '📤',
    won: '🏆',
    lost: '❌',
    pass: '⏭️',
  };

  return (
    <button
      onClick={() => onClick(status)}
      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
    >
      <span>{statusIcons[status]}</span>
      <span>{statusLabels[status]}</span>
    </button>
  );
}
