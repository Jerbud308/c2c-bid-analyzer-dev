// ============================================================================
// Component: OpportunityFilters
// ============================================================================
// Filter controls for opportunities dashboard
// ============================================================================

import React, { useState } from 'react';
import type { OpportunityFilters, OpportunityStatus } from '../lib/types';

interface OpportunityFiltersProps {
  filters: OpportunityFilters;
  onChange: (filters: Partial<OpportunityFilters>) => void;
  onClear: () => void;
}

export function OpportunityFilters({ filters, onChange, onClear }: OpportunityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate active filter count
  const activeFilterCount = [
    filters.status && filters.status.length > 0,
    filters.naics_code && filters.naics_code.length > 0,
    filters.set_aside_type && filters.set_aside_type.length > 0,
    filters.deadline_from,
    filters.deadline_to,
    filters.fit_score_min !== undefined,
    filters.fit_score_max !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            disabled={activeFilterCount === 0}
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Search by title, solicitation number, or agency..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <StatusFilter
              selected={filters.status || []}
              onChange={(status) => onChange({ status })}
            />
          </div>

          {/* NAICS Code Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NAICS Code
            </label>
            <NAICSFilter
              selected={filters.naics_code || []}
              onChange={(naics_code) => onChange({ naics_code })}
            />
          </div>

          {/* Set-Aside Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Set-Aside Type
            </label>
            <SetAsideFilter
              selected={filters.set_aside_type || []}
              onChange={(set_aside_type) => onChange({ set_aside_type })}
            />
          </div>

          {/* Deadline Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.deadline_from || ''}
                onChange={(e) => onChange({ deadline_from: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.deadline_to || ''}
                onChange={(e) => onChange({ deadline_to: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Fit Score Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fit Score Range (0-100)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.fit_score_min || ''}
                onChange={(e) => onChange({ fit_score_min: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Min"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={filters.fit_score_max || ''}
                onChange={(e) => onChange({ fit_score_max: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Max"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Status Filter
// ----------------------------------------------------------------------------

const STATUSES: OpportunityStatus[] = [
  'new',
  'analyzing',
  'reviewed',
  'bidding',
  'submitted',
  'won',
  'lost',
  'pass',
];

interface StatusFilterProps {
  selected: OpportunityStatus[];
  onChange: (selected: OpportunityStatus[]) => void;
}

function StatusFilter({ selected, onChange }: StatusFilterProps) {
  const toggleStatus = (status: OpportunityStatus) => {
    if (selected.includes(status)) {
      onChange(selected.filter(s => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map(status => (
        <button
          key={status}
          onClick={() => toggleStatus(status)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selected.includes(status)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// NAICS Code Filter
// ----------------------------------------------------------------------------

const NAICS_CODES = [
  { code: '238160', label: 'Roofing Contractors' },
  { code: '238310', label: 'Drywall and Insulation' },
  { code: '236220', label: 'Commercial Building Construction' },
  { code: '236118', label: 'Residential Remodelers' },
  { code: '238210', label: 'Electrical Contractors' },
  { code: '562910', label: 'Remediation Services (Asbestos)' },
];

interface NAICSFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

function NAICSFilter({ selected, onChange }: NAICSFilterProps) {
  const toggleNAICS = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="space-y-2">
      {NAICS_CODES.map(({ code, label }) => (
        <label key={code} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(code)}
            onChange={() => toggleNAICS(code)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {code} - {label}
          </span>
        </label>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Set-Aside Type Filter
// ----------------------------------------------------------------------------

const SET_ASIDE_TYPES = ['SDVOSB', '8(a)', 'HUBZone', 'WOSB', 'None'];

interface SetAsideFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

function SetAsideFilter({ selected, onChange }: SetAsideFilterProps) {
  const toggleSetAside = (type: string) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="space-y-2">
      {SET_ASIDE_TYPES.map(type => (
        <label key={type} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(type)}
            onChange={() => toggleSetAside(type)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{type}</span>
        </label>
      ))}
    </div>
  );
}
