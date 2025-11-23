/**
 * Application constants for C2C Bid Analyzer
 *
 * This file contains all configuration constants used throughout the application,
 * including file upload limits, API settings, and business-specific data.
 */

// ============================================================================
// File Upload Configuration
// ============================================================================

/**
 * Maximum allowed file size for PDF uploads (50 MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_FILE_TYPES = ['application/pdf'];

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Interval (in milliseconds) for polling processing status
 * Used when checking if a document has finished processing
 */
export const POLLING_INTERVAL = 5000; // 5 seconds

/**
 * Request timeout (in milliseconds) for API calls
 * Requests that exceed this duration will be aborted
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Maximum number of retry attempts for failed API requests
 */
export const MAX_RETRIES = 3;

/**
 * Initial delay (in milliseconds) between retry attempts
 * Uses exponential backoff: 1s, 2s, 4s
 */
export const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Business Data
// ============================================================================

/**
 * NAICS codes relevant to C2C Construction's business
 * Maps NAICS code to human-readable description
 */
export const NAICS_CODES: Record<string, string> = {
  '238160': 'Roofing Contractors',
  '238310': 'Drywall and Insulation',
  '236220': 'Commercial Building Construction',
  '236118': 'Residential Remodelers',
  '238210': 'Electrical Contractors',
  '562910': 'Remediation Services',
};

/**
 * Common set-aside types in government contracting
 * These are preference programs for small businesses
 */
export const SET_ASIDE_TYPES = [
  'SDVOSB',  // Service-Disabled Veteran-Owned Small Business
  '8(a)',    // SBA 8(a) Business Development Program
  'HUBZone', // Historically Underutilized Business Zone
  'WOSB',    // Women-Owned Small Business
] as const;

/**
 * Type for set-aside values
 */
export type SetAsideType = typeof SET_ASIDE_TYPES[number];

// ============================================================================
// Processing Estimates
// ============================================================================

/**
 * Estimated OCR processing time per page (in seconds)
 */
export const OCR_TIME_PER_PAGE = 2;

/**
 * Estimated AI analysis time (in seconds) regardless of page count
 */
export const AI_ANALYSIS_TIME = 60;
