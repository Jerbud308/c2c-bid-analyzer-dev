// ============================================================================
// Custom Hook: useOpportunities
// ============================================================================
// Manages opportunities data fetching, filtering, and state
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOpportunities,
  bulkUpdateStatus,
  exportOpportunities,
  downloadBlob,
} from '../lib/api';
import type {
  OpportunityFilters,
  OpportunityWithAnalysis,
  DashboardMetrics,
  OpportunityStatus,
  ApiError,
} from '../lib/types';

interface UseOpportunitiesResult {
  opportunities: OpportunityWithAnalysis[];
  metrics: DashboardMetrics;
  totalCount: number;
  loading: boolean;
  error: ApiError | null;
  filters: OpportunityFilters;
  selectedIds: string[];

  // Actions
  updateFilters: (newFilters: Partial<OpportunityFilters>) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  selectOpportunity: (id: string, selected: boolean) => void;
  selectAll: (selected: boolean) => void;
  clearSelection: () => void;
  bulkAction: (action: 'status' | 'delete', status?: OpportunityStatus) => Promise<void>;
  exportData: (format: 'csv' | 'excel') => Promise<void>;
}

const defaultFilters: OpportunityFilters = {
  status: [],
  naics_code: [],
  set_aside_type: [],
  deadline_from: undefined,
  deadline_to: undefined,
  fit_score_min: undefined,
  fit_score_max: undefined,
  search: '',
  sort: 'deadline_date',
  order: 'asc',
  page: 1,
  limit: 20,
};

const defaultMetrics: DashboardMetrics = {
  total: 0,
  avg_fit_score: 0,
  urgent_count: 0,
};

// ----------------------------------------------------------------------------
// Hook Implementation
// ----------------------------------------------------------------------------

export function useOpportunities(initialFilters?: Partial<OpportunityFilters>): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<OpportunityWithAnalysis[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<OpportunityFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------------------------

  const fetchOpportunities = useCallback(async (currentFilters: OpportunityFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getOpportunities(currentFilters);
      setOpportunities(response.opportunities);
      setMetrics(response.metrics);
      setTotalCount(response.total_count);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Failed to fetch opportunities',
      };
      setError(apiError);
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------------------------------------------------------------------
  // Effects
  // ----------------------------------------------------------------------------

  // Debounced fetch when filters change
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchOpportunities(filters);
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters, fetchOpportunities]);

  // ----------------------------------------------------------------------------
  // Filter Actions
  // ----------------------------------------------------------------------------

  const updateFilters = useCallback((newFilters: Partial<OpportunityFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except page itself)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
    // Clear selection when filters change
    setSelectedIds([]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedIds([]);
  }, []);

  const refresh = useCallback(async () => {
    await fetchOpportunities(filters);
  }, [filters, fetchOpportunities]);

  // ----------------------------------------------------------------------------
  // Selection Actions
  // ----------------------------------------------------------------------------

  const selectOpportunity = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      if (selected) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter(existingId => existingId !== id);
      }
    });
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(opportunities.map(opp => opp.id));
    } else {
      setSelectedIds([]);
    }
  }, [opportunities]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ----------------------------------------------------------------------------
  // Bulk Actions
  // ----------------------------------------------------------------------------

  const bulkAction = useCallback(async (
    action: 'status' | 'delete',
    status?: OpportunityStatus
  ) => {
    if (selectedIds.length === 0) {
      throw new Error('No opportunities selected');
    }

    try {
      setLoading(true);
      setError(null);

      if (action === 'status' && status) {
        await bulkUpdateStatus(selectedIds, status);
      } else if (action === 'delete') {
        // Delete would be handled by individual delete API calls
        throw new Error('Bulk delete not yet implemented');
      }

      // Refresh data and clear selection
      await fetchOpportunities(filters);
      setSelectedIds([]);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Bulk action failed',
      };
      setError(apiError);
      console.error('Error performing bulk action:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedIds, filters, fetchOpportunities]);

  // ----------------------------------------------------------------------------
  // Export Action
  // ----------------------------------------------------------------------------

  const exportData = useCallback(async (format: 'csv' | 'excel') => {
    try {
      setLoading(true);
      setError(null);

      const blob = await exportOpportunities(filters, format);
      const filename = `opportunities-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      downloadBlob(blob, filename);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Export failed',
      };
      setError(apiError);
      console.error('Error exporting opportunities:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ----------------------------------------------------------------------------
  // Return
  // ----------------------------------------------------------------------------

  return {
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
  };
}
