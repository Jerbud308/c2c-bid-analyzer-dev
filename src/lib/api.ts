/**
 * API client for C2C Bid Analyzer
 *
 * This file provides a framework-agnostic API client for interacting with
 * Supabase Edge Functions. It includes automatic retry logic, request timeouts,
 * error normalization, and comprehensive TypeScript types.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Type-safe error handling
 * - Development mode logging
 * - Framework agnostic (works with Vite, Next.js, etc.)
 */

import { supabase } from './supabase';
import {
  UploadResponse,
  StatusResponse,
  AnalysisResponse,
  NotificationPreferences,
  NotificationLog,
  ApiError,
} from './types';
import {
  MAX_RETRIES,
  RETRY_DELAY,
  REQUEST_TIMEOUT,
} from './constants';

/**
 * Base URL for Supabase Edge Functions
 */
const FUNCTIONS_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/**
 * Supabase anonymous key for authorization
 */
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Development mode flag
 */
const isDev = import.meta.env.DEV;

/**
 * Logs messages in development mode
 * @param message - The message to log
 * @param data - Optional data to include
 */
function devLog(message: string, data?: any): void {
  if (isDev) {
    console.log(`[API Client] ${message}`, data ?? '');
  }
}

/**
 * Creates an AbortController with a timeout
 * @param timeoutMs - Timeout in milliseconds
 * @returns An AbortSignal that will abort after the timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Sleeps for a specified duration
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalizes various error types into a structured ApiError
 * @param error - The error to normalize
 * @param context - Context about where the error occurred
 * @returns A normalized ApiError
 */
function normalizeError(error: unknown, context: string): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ApiError(
      'Network error: Unable to connect to the server',
      0,
      { context, originalError: error.message }
    );
  }

  // Abort errors (timeout)
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError(
      'Request timeout: The server took too long to respond',
      408,
      { context }
    );
  }

  // Generic errors
  if (error instanceof Error) {
    return new ApiError(
      error.message,
      undefined,
      { context, originalError: error }
    );
  }

  // Unknown error type
  return new ApiError(
    'An unknown error occurred',
    500,
    { context, originalError: error }
  );
}

/**
 * Makes a fetch request with retry logic and error handling
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retry attempts remaining
 * @returns The parsed JSON response
 * @throws {ApiError} If the request fails after all retries
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<T> {
  const attempt = MAX_RETRIES - retries + 1;
  devLog(`Request attempt ${attempt}/${MAX_RETRIES}`, { url, options });

  try {
    // Add timeout to the request
    const signal = createTimeoutSignal(REQUEST_TIMEOUT);
    const response = await fetch(url, {
      ...options,
      signal,
    });

    devLog(`Response received`, { status: response.status, url });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorDetails: any = { status: response.status, url };

      // Try to parse error response
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = { ...errorDetails, ...errorData };
      } catch {
        // Response body is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    // Parse successful response
    const data = await response.json();
    devLog(`Response parsed successfully`, data);
    return data as T;
  } catch (error) {
    const normalizedError = normalizeError(error, `fetchWithRetry: ${url}`);

    // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
    const shouldRetry =
      retries > 0 &&
      (!normalizedError.statusCode ||
       normalizedError.statusCode >= 500 ||
       normalizedError.statusCode === 408 ||
       normalizedError.statusCode === 429 ||
       normalizedError.statusCode === 0); // Network errors

    if (shouldRetry) {
      const delay = RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries);
      devLog(`Retrying after ${delay}ms`, { retriesLeft: retries - 1 });
      await sleep(delay);
      return fetchWithRetry<T>(url, options, retries - 1);
    }

    devLog(`Request failed`, normalizedError);
    throw normalizedError;
  }
}

/**
 * API client for C2C Bid Analyzer
 *
 * Provides methods for uploading bids, checking processing status,
 * and retrieving analysis results.
 *
 * @example
 * ```typescript
 * import { api } from '@/lib/api'
 *
 * // Upload a bid
 * const formData = new FormData()
 * formData.append('file', pdfFile)
 * formData.append('title', 'Roof Replacement Project')
 * const result = await api.uploadBid(formData)
 *
 * // Check status
 * const status = await api.checkStatus(result.opportunity_id)
 *
 * // Get analysis when ready
 * if (status.ready_for_review) {
 *   const analysis = await api.getAnalysis(result.opportunity_id)
 * }
 * ```
 */
export const api = {
  /**
   * Uploads a bid package PDF for processing
   *
   * @param formData - FormData containing the file and optional metadata
   *   - file: PDF file to upload (required)
   *   - title: Title for the opportunity (optional)
   *   - agency: Agency name (optional)
   *   - solicitation_number: Solicitation number (optional)
   *   - deadline_date: Submission deadline (optional)
   *
   * @returns Upload response with opportunity and document IDs
   * @throws {ApiError} If upload fails
   *
   * @example
   * ```typescript
   * const formData = new FormData()
   * formData.append('file', pdfFile)
   * formData.append('title', 'Building Renovation')
   * formData.append('agency', 'GSA')
   * const result = await api.uploadBid(formData)
   * console.log(result.opportunity_id) // Use for status checking
   * ```
   */
  async uploadBid(formData: FormData): Promise<UploadResponse> {
    devLog('Uploading bid package', {
      hasFile: formData.has('file'),
      title: formData.get('title')
    });

    const url = `${FUNCTIONS_BASE_URL}/upload-bid-package`;
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: formData,
    };

    try {
      const response = await fetchWithRetry<UploadResponse>(url, options);
      devLog('Bid uploaded successfully', { opportunity_id: response.opportunity_id });
      return response;
    } catch (error) {
      throw normalizeError(error, 'uploadBid');
    }
  },

  /**
   * Checks the processing status of an opportunity
   *
   * @param opportunityId - The opportunity ID to check
   * @returns Current processing status and metadata
   * @throws {ApiError} If status check fails or opportunity not found
   *
   * @example
   * ```typescript
   * const status = await api.checkStatus('123e4567-e89b-12d3-a456-426614174000')
   * console.log(`Processing: ${status.completion_percent}%`)
   * if (status.ready_for_review) {
   *   // Analysis is complete
   * }
   * ```
   */
  async checkStatus(opportunityId: string): Promise<StatusResponse> {
    devLog('Checking status', { opportunityId });

    const url = `${FUNCTIONS_BASE_URL}/check-status?opportunity_id=${encodeURIComponent(opportunityId)}`;
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetchWithRetry<StatusResponse>(url, options);
      devLog('Status retrieved', {
        status: response.processing_status,
        completion: response.completion_percent
      });
      return response;
    } catch (error) {
      // Handle 404 specially - opportunity not found
      if (error instanceof ApiError && error.statusCode === 404) {
        throw new ApiError(
          'Opportunity not found',
          404,
          { opportunityId }
        );
      }
      throw normalizeError(error, 'checkStatus');
    }
  },

  /**
   * Retrieves the complete analysis for an opportunity
   *
   * @param opportunityId - The opportunity ID to retrieve
   * @returns Complete analysis data including opportunity, analysis, and metadata
   * @throws {ApiError} If analysis retrieval fails, opportunity not found, or not ready
   *
   * @example
   * ```typescript
   * try {
   *   const analysis = await api.getAnalysis('123e4567-e89b-12d3-a456-426614174000')
   *   console.log(`Fit Score: ${analysis.analysis.fit_score}`)
   *   console.log(`Confidence: ${analysis.analysis.confidence_level}`)
   * } catch (error) {
   *   if (error.statusCode === 404) {
   *     console.log('Analysis not ready yet')
   *   }
   * }
   * ```
   */
  async getAnalysis(opportunityId: string): Promise<AnalysisResponse> {
    devLog('Getting analysis', { opportunityId });

    const url = `${FUNCTIONS_BASE_URL}/get-analysis?opportunity_id=${encodeURIComponent(opportunityId)}`;
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetchWithRetry<AnalysisResponse>(url, options);
      devLog('Analysis retrieved', {
        fit_score: response.analysis.fit_score,
        confidence: response.analysis.confidence_level
      });
      return response;
    } catch (error) {
      // Handle 404 specially - analysis not ready or not found
      if (error instanceof ApiError && error.statusCode === 404) {
        throw new ApiError(
          'Analysis not ready or opportunity not found',
          404,
          { opportunityId }
        );
      }
      throw normalizeError(error, 'getAnalysis');
    }
  },

  /**
   * Gets notification preferences for a user
   *
   * @param email - The user's email address
   * @returns User's notification preferences
   * @throws {ApiError} If retrieval fails or user not found
   *
   * @example
   * ```typescript
   * const prefs = await api.getNotificationPreferences('user@example.com')
   * console.log(`Daily digest enabled: ${prefs.notify_daily_digest}`)
   * ```
   */
  async getNotificationPreferences(email: string): Promise<NotificationPreferences> {
    devLog('Getting notification preferences', { email });

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_email', email)
        .single();

      if (error) {
        throw new ApiError(
          `Failed to get preferences: ${error.message}`,
          error.code === 'PGRST116' ? 404 : 500,
          { email, error }
        );
      }

      devLog('Preferences retrieved', { email });
      return data as NotificationPreferences;
    } catch (error) {
      throw normalizeError(error, 'getNotificationPreferences');
    }
  },

  /**
   * Updates notification preferences for a user
   *
   * @param email - The user's email address
   * @param preferences - Partial preferences to update
   * @returns Updated notification preferences
   * @throws {ApiError} If update fails
   *
   * @example
   * ```typescript
   * const updated = await api.updateNotificationPreferences('user@example.com', {
   *   notify_daily_digest: false,
   *   deadline_reminder_days: [7, 3, 1]
   * })
   * ```
   */
  async updateNotificationPreferences(
    email: string,
    preferences: Partial<Omit<NotificationPreferences, 'user_email' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationPreferences> {
    devLog('Updating notification preferences', { email, preferences });

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(preferences)
        .eq('user_email', email)
        .select()
        .single();

      if (error) {
        throw new ApiError(
          `Failed to update preferences: ${error.message}`,
          500,
          { email, error }
        );
      }

      devLog('Preferences updated', { email });
      return data as NotificationPreferences;
    } catch (error) {
      throw normalizeError(error, 'updateNotificationPreferences');
    }
  },

  /**
   * Gets notification history for a user
   *
   * @param email - The user's email address
   * @param limit - Maximum number of notifications to retrieve (default: 50)
   * @returns Array of notification log entries
   * @throws {ApiError} If retrieval fails
   *
   * @example
   * ```typescript
   * const history = await api.getNotificationHistory('user@example.com', 20)
   * console.log(`Last 20 notifications:`, history)
   * ```
   */
  async getNotificationHistory(email: string, limit = 50): Promise<NotificationLog[]> {
    devLog('Getting notification history', { email, limit });

    try {
      const { data, error } = await supabase
        .from('notification_log')
        .select('*')
        .eq('user_email', email)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new ApiError(
          `Failed to get notification history: ${error.message}`,
          500,
          { email, error }
        );
      }

      devLog('Notification history retrieved', { email, count: data?.length || 0 });
      return (data || []) as NotificationLog[];
    } catch (error) {
      throw normalizeError(error, 'getNotificationHistory');
    }
  },

  /**
   * Sends a test notification email
   *
   * @param email - The recipient's email address
   * @param type - Type of notification to test
   * @returns Success status
   * @throws {ApiError} If test email fails to send
   *
   * @example
   * ```typescript
   * await api.sendTestNotification('user@example.com', 'daily_digest')
   * ```
   */
  async sendTestNotification(email: string, type: string = 'analysis_complete'): Promise<{ success: boolean }> {
    devLog('Sending test notification', { email, type });

    const url = `${FUNCTIONS_BASE_URL}/send-test-notification`;
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, type }),
    };

    try {
      const response = await fetchWithRetry<{ success: boolean }>(url, options);
      devLog('Test notification sent', { email, type });
      return response;
    } catch (error) {
      throw normalizeError(error, 'sendTestNotification');
    }
  },
};

/**
 * Default export for convenience
 */
export default api;
