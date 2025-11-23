/**
 * API Client for C2C Bid Analyzer
 * Handles all HTTP requests to Supabase Edge Functions
 */

import {
  Template,
  TemplateFilters,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateVersion,
  TemplateVariableValues,
} from './types';

// Get Supabase URL from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found in environment variables');
}

/**
 * Base API client class
 */
class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY!,
    };
  }

  /**
   * Set authorization token for authenticated requests
   */
  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Generic GET request
   */
  private async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generic POST request
   */
  private async post<T>(endpoint: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generic PUT request
   */
  private async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generic DELETE request
   */
  private async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // ========================================================================
  // TEMPLATE METHODS
  // ========================================================================

  /**
   * Get list of templates with optional filters
   *
   * @param filters - Optional filters (category, status, tags, search)
   * @returns Array of templates
   *
   * @example
   * // Get all approved templates
   * const templates = await api.getTemplates({ status: 'approved' });
   *
   * // Search for roofing templates
   * const roofingTemplates = await api.getTemplates({
   *   tags: ['roofing'],
   *   search: 'roof'
   * });
   */
  async getTemplates(filters?: TemplateFilters): Promise<Template[]> {
    const params: Record<string, string> = {};

    if (filters?.category) params.category = filters.category;
    if (filters?.status) params.status = filters.status;
    if (filters?.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }
    if (filters?.search) params.search = filters.search;

    return this.get<Template[]>('/templates', params);
  }

  /**
   * Get single template by ID
   *
   * @param templateId - Template UUID
   * @returns Template object
   */
  async getTemplate(templateId: string): Promise<Template> {
    return this.get<Template>(`/templates/${templateId}`);
  }

  /**
   * Create new template
   *
   * @param input - Template creation data
   * @returns Created template
   *
   * @example
   * const template = await api.createTemplate({
   *   title: 'Company Overview',
   *   category: 'company_info',
   *   content: '{COMPANY_NAME} is a leading provider...',
   *   tags: ['company', 'overview'],
   *   status: 'draft'
   * });
   */
  async createTemplate(input: CreateTemplateInput): Promise<Template> {
    return this.post<Template>('/templates', input);
  }

  /**
   * Update existing template
   * Creates a version snapshot before updating
   *
   * @param templateId - Template UUID
   * @param updates - Fields to update
   * @returns Updated template
   *
   * @example
   * const updated = await api.updateTemplate(templateId, {
   *   content: 'Updated content with {NEW_VARIABLE}',
   *   change_notes: 'Added new variable for project type'
   * });
   */
  async updateTemplate(
    templateId: string,
    updates: UpdateTemplateInput
  ): Promise<Template> {
    return this.put<Template>(`/templates/${templateId}`, updates);
  }

  /**
   * Approve template (changes status to 'approved')
   *
   * @param templateId - Template UUID
   * @param approver - Name of person approving
   * @returns Success response
   *
   * @example
   * await api.approveTemplate(templateId, 'Phil');
   */
  async approveTemplate(templateId: string, approver: string): Promise<void> {
    await this.post(`/templates-approve/${templateId}`, { approver });
  }

  /**
   * Archive template (soft delete - changes status to 'archived')
   *
   * @param templateId - Template UUID
   * @returns Success response
   */
  async archiveTemplate(templateId: string): Promise<void> {
    await this.delete(`/templates/${templateId}`);
  }

  /**
   * Preview template with variable substitution
   *
   * @param templateId - Template UUID
   * @param variableValues - Variable name/value pairs
   * @returns Preview response with processed content
   *
   * @example
   * const preview = await api.previewTemplate(templateId, {
   *   PROJECT_NAME: 'Roof Replacement',
   *   AGENCY: 'Department of Veterans Affairs'
   * });
   * console.log(preview.processed_content);
   */
  async previewTemplate(
    templateId: string,
    variableValues: TemplateVariableValues
  ): Promise<{
    template_id: string;
    template_title: string;
    original_content: string;
    processed_content: string;
    variables_used: string[];
    variables_provided: string[];
    missing_variables: string[];
  }> {
    return this.post(`/templates-preview/${templateId}`, {
      variables: variableValues,
    });
  }

  /**
   * Get version history for a template
   *
   * @param templateId - Template UUID
   * @returns Array of template versions
   */
  async getTemplateVersions(templateId: string): Promise<{
    template_id: string;
    template_title: string;
    current_version: number;
    version_count: number;
    versions: TemplateVersion[];
  }> {
    return this.get(`/templates-versions/${templateId}`);
  }

  /**
   * Increment template usage count
   * Call this when a template is used in a bid response
   *
   * @param templateId - Template UUID
   */
  async incrementTemplateUsage(templateId: string): Promise<void> {
    await this.post(`/templates-use/${templateId}`, {});
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
