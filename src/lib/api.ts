// ============================================================================
// API Client for C2C Bid Analyzer
// ============================================================================

import type {
  ChecklistResponse,
  ChecklistItemUpdate,
  CustomChecklistItem,
  ExportFormat,
} from './types'

// Configuration
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Helper Functions
// ============================================================================

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${SUPABASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Compliance Checklist API
// ============================================================================

/**
 * Get compliance checklist for an opportunity
 * @param opportunityId - The opportunity ID
 * @returns Promise with checklist data
 */
export async function getChecklist(opportunityId: string): Promise<ChecklistResponse> {
  return fetchAPI<ChecklistResponse>(
    `/functions/v1/get-checklist?opportunity_id=${opportunityId}`
  )
}

/**
 * Update a checklist item
 * @param checklistId - The checklist ID
 * @param itemId - The item ID
 * @param updates - Partial updates to apply
 * @returns Promise with success response
 */
export async function updateChecklistItem(
  checklistId: string,
  itemId: string,
  updates: ChecklistItemUpdate
): Promise<{ success: boolean }> {
  return fetchAPI('/functions/v1/update-checklist-item', {
    method: 'POST',
    body: JSON.stringify({
      checklist_id: checklistId,
      item_id: itemId,
      updates,
    }),
  })
}

/**
 * Add a custom checklist item
 * @param checklistId - The checklist ID
 * @param item - The custom item to add
 * @returns Promise with success response and new item ID
 */
export async function addCustomItem(
  checklistId: string,
  item: CustomChecklistItem
): Promise<{ success: boolean; item_id: string }> {
  return fetchAPI('/functions/v1/add-custom-checklist-item', {
    method: 'POST',
    body: JSON.stringify({
      checklist_id: checklistId,
      category: item.category,
      description: item.description,
      responsible_party: item.responsible_party || null,
    }),
  })
}

/**
 * Delete a custom checklist item
 * @param checklistId - The checklist ID
 * @param itemId - The item ID to delete
 * @returns Promise with success response
 */
export async function deleteCustomItem(
  checklistId: string,
  itemId: string
): Promise<{ success: boolean }> {
  return fetchAPI('/functions/v1/delete-custom-checklist-item', {
    method: 'POST',
    body: JSON.stringify({
      checklist_id: checklistId,
      item_id: itemId,
    }),
  })
}

/**
 * Export checklist to PDF or Excel
 * @param checklistId - The checklist ID
 * @param format - Export format ('pdf' or 'excel')
 * @returns Promise with blob data for download
 */
export async function exportChecklist(
  checklistId: string,
  format: ExportFormat
): Promise<Blob> {
  const url = `${SUPABASE_URL}/functions/v1/export-checklist?checklist_id=${checklistId}&format=${format}`

  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`)
  }

  return response.blob()
}

/**
 * Trigger checklist generation for an opportunity
 * @param opportunityId - The opportunity ID
 * @returns Promise with success response
 */
export async function generateChecklist(
  opportunityId: string
): Promise<{ success: boolean; checklist_id: string; item_count: number }> {
  return fetchAPI('/functions/v1/generate-checklist', {
    method: 'POST',
    body: JSON.stringify({ opportunityId }),
  })
}

// Opportunity API (placeholder for future implementation)
// ============================================================================

/**
 * Get opportunity by ID
 * (To be implemented when frontend needs it)
 */
export async function getOpportunity(opportunityId: string): Promise<any> {
  // TODO: Implement when needed
  throw new Error('Not implemented')
}

/**
 * List all opportunities
 * (To be implemented when frontend needs it)
 */
export async function listOpportunities(): Promise<any[]> {
  // TODO: Implement when needed
  throw new Error('Not implemented')
}

// Export all API functions
export const api = {
  // Checklist
  getChecklist,
  updateChecklistItem,
  addCustomItem,
  deleteCustomItem,
  exportChecklist,
  generateChecklist,

  // Opportunities (to be implemented)
  getOpportunity,
  listOpportunities,
}

export default api
