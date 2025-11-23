// ============================================================================
// API Client for C2C Bid Analyzer
// ============================================================================

import type {
  OpportunityFilters,
  OpportunitiesResponse,
  OpportunityStatus,
  BulkUpdateStatusResponse,
} from './types';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Please set environment variables.');
}

// Base URL for Supabase Edge Functions
const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

/**
 * Build query string from filters object
 */
function buildQueryString(filters?: OpportunityFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.status && filters.status.length > 0) {
    params.append('status', filters.status.join(','));
  }

  if (filters.naics_code && filters.naics_code.length > 0) {
    params.append('naics_code', filters.naics_code.join(','));
  }

  if (filters.set_aside_type && filters.set_aside_type.length > 0) {
    params.append('set_aside_type', filters.set_aside_type.join(','));
  }

  if (filters.deadline_from) {
    params.append('deadline_from', filters.deadline_from);
  }

  if (filters.deadline_to) {
    params.append('deadline_to', filters.deadline_to);
  }

  if (filters.fit_score_min !== undefined) {
    params.append('fit_score_min', filters.fit_score_min.toString());
  }

  if (filters.fit_score_max !== undefined) {
    params.append('fit_score_max', filters.fit_score_max.toString());
  }

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.sort) {
    params.append('sort', filters.sort);
  }

  if (filters.order) {
    params.append('order', filters.order);
  }

  if (filters.page) {
    params.append('page', filters.page.toString());
  }

  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Make authenticated request to Supabase Edge Function
 */
async function fetchFromFunction<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ----------------------------------------------------------------------------
// Opportunities API Methods
// ----------------------------------------------------------------------------

/**
 * Get list of opportunities with filtering, sorting, and pagination
 */
export async function getOpportunities(
  filters?: OpportunityFilters
): Promise<OpportunitiesResponse> {
  const queryString = buildQueryString(filters);
  return fetchFromFunction<OpportunitiesResponse>(`/opportunities${queryString}`);
}

/**
 * Get single opportunity by ID
 */
export async function getOpportunity(opportunityId: string): Promise<any> {
  return fetchFromFunction(`/opportunities/${opportunityId}`);
}

/**
 * Update opportunity status
 */
export async function updateOpportunityStatus(
  opportunityId: string,
  status: OpportunityStatus
): Promise<void> {
  return fetchFromFunction(`/opportunities/${opportunityId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

/**
 * Bulk update status for multiple opportunities
 */
export async function bulkUpdateStatus(
  opportunityIds: string[],
  status: OpportunityStatus
): Promise<BulkUpdateStatusResponse> {
  return fetchFromFunction<BulkUpdateStatusResponse>('/opportunities-bulk', {
    method: 'PUT',
    body: JSON.stringify({
      opportunity_ids: opportunityIds,
      status,
    }),
  });
}

/**
 * Delete opportunity (and all related documents/analysis via CASCADE)
 */
export async function deleteOpportunity(opportunityId: string): Promise<void> {
  return fetchFromFunction(`/opportunities/${opportunityId}`, {
    method: 'DELETE',
  });
}

/**
 * Bulk delete multiple opportunities
 */
export async function bulkDeleteOpportunities(opportunityIds: string[]): Promise<void> {
  // Call delete for each opportunity in parallel
  await Promise.all(
    opportunityIds.map(id => deleteOpportunity(id))
  );
}

/**
 * Export opportunities to CSV or Excel
 */
export async function exportOpportunities(
  filters?: OpportunityFilters,
  format: 'csv' | 'excel' = 'csv'
): Promise<Blob> {
  const queryString = buildQueryString(filters);
  const separator = queryString ? '&' : '?';
  const url = `${FUNCTIONS_BASE_URL}/opportunities-export${queryString}${separator}format=${format}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  return response.blob();
}

/**
 * Download exported file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------------------
// Helper Exports
// ----------------------------------------------------------------------------

export { buildQueryString };
