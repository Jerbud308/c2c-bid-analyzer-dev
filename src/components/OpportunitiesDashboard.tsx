// ============================================================================
// Component: OpportunitiesDashboard
// ============================================================================
// Main dashboard page for viewing all opportunities
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpportunities } from '../hooks/useOpportunities';
import { DashboardMetrics } from './DashboardMetrics';
import { OpportunityFilters } from './OpportunityFilters';
import { OpportunityTable } from './OpportunityTable';
import { OpportunityCardGrid } from './OpportunityCard';
import { BulkActionBar } from './BulkActionBar';
import type { OpportunityStatus } from '../lib/types';

type ViewMode = 'table' | 'card';

export function OpportunitiesDashboard() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const {
    opportunities,
    metrics,
    totalCount,
    loading,
    error,
    filters,
    selectedIds,
    updateFilters,
    clearFilters,
    refresh,
    selectOpportunity,
    selectAll,
    clearSelection,
    bulkAction,
    exportData,
  } = useOpportunities();

  // Handle sort
  const handleSort = (field: string) => {
    const newOrder = filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    updateFilters({ sort: field, order: newOrder });
  };

  // Handle select
  const handleSelect = (ids: string[]) => {
    // Clear current selection
    clearSelection();
    // Add new selections
    ids.forEach(id => selectOpportunity(id, true));
  };

  // Handle individual select
  const handleSelectOne = (id: string, selected: boolean) => {
    selectOpportunity(id, selected);
  };

  // Handle bulk status change
  const handleBulkStatusChange = async (status: OpportunityStatus) => {
    try {
      await bulkAction('status', status);
      alert(`Successfully updated ${selectedIds.length} opportunities to "${status}"`);
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} opportunities? This cannot be undone.`)) {
      return;
    }

    try {
      await bulkAction('delete');
      alert(`Successfully deleted ${selectedIds.length} opportunities`);
    } catch (err) {
      alert(`Failed to delete opportunities: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      await exportData(format);
    } catch (err) {
      alert(`Failed to export: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle pagination
  const totalPages = Math.ceil(totalCount / (filters.limit || 20));
  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and track government contract opportunities
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              + Upload New
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics */}
        <DashboardMetrics metrics={metrics} loading={loading} />

        {/* Filters */}
        <OpportunityFilters
          filters={filters}
          onChange={updateFilters}
          onClear={clearFilters}
        />

        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="deadline_date">Deadline</option>
                <option value="fit_score">Fit Score</option>
                <option value="created_at">Created Date</option>
                <option value="updated_at">Updated Date</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => updateFilters({ order: filters.order === 'asc' ? 'desc' : 'asc' })}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {filters.order === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Results count */}
            <span className="text-sm text-gray-600">
              {totalCount} {totalCount === 1 ? 'result' : 'results'}
            </span>

            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !opportunities.length && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        )}

        {/* Results */}
        {!loading || opportunities.length > 0 ? (
          <>
            {viewMode === 'table' ? (
              <OpportunityTable
                opportunities={opportunities}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSort={handleSort}
                sortField={filters.sort || 'deadline_date'}
                sortOrder={filters.order || 'asc'}
              />
            ) : (
              <OpportunityCardGrid
                opportunities={opportunities}
                selectedIds={selectedIds}
                onSelect={handleSelectOne}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        filters.page === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={filters.page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : null}

        {/* Empty State */}
        {!loading && opportunities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-xl text-gray-600 mb-4">No opportunities match your filters</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onMarkAsPass={() => handleBulkStatusChange('pass')}
        onDelete={handleBulkDelete}
        onExport={handleExport}
        onClearSelection={clearSelection}
        onChangeStatus={handleBulkStatusChange}
      />
    </div>
  );
}
