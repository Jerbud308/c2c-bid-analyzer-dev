/**
 * TypeScript type definitions for C2C Bid Analyzer
 */

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Valid template categories for organizing bid response content
 */
export type TemplateCategory =
  | 'company_info'      // Company overview, history, capabilities
  | 'safety'            // Safety programs, OSHA compliance
  | 'quality'           // Quality control approaches
  | 'personnel'         // Key personnel resumes and bios
  | 'past_projects'     // Past project descriptions
  | 'capabilities'      // Technical capabilities, equipment
  | 'certifications'    // Certifications and licenses
  | 'other';            // Miscellaneous content

/**
 * Template workflow status
 */
export type TemplateStatus = 'draft' | 'approved' | 'archived';

/**
 * Template entity - reusable bid response content with variable placeholders
 */
export interface Template {
  id: string;
  title: string;
  category: TemplateCategory;
  content: string;                    // Rich text content with {VARIABLE} placeholders
  variables: string[];                // Extracted variable names like ["PROJECT_NAME", "AGENCY"]
  tags: string[];                     // Searchable tags: "roofing", "asbestos", "federal", "Florida"
  status: TemplateStatus;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  usage_count: number;                // Number of times used in bids
}

/**
 * Template version history entry
 */
export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  content: string;
  variables: string[];
  created_at: string;
  created_by: string | null;
  change_notes: string | null;        // Description of what changed
}

/**
 * Filters for querying templates
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  status?: TemplateStatus;
  tags?: string[];                    // Show templates with ANY of these tags
  search?: string;                    // Full-text search in title + content
}

/**
 * Input for creating a new template
 */
export interface CreateTemplateInput {
  title: string;
  category: TemplateCategory;
  content: string;
  tags: string[];
  status?: TemplateStatus;            // Defaults to 'draft'
}

/**
 * Input for updating an existing template
 */
export interface UpdateTemplateInput {
  title?: string;
  category?: TemplateCategory;
  content?: string;
  tags?: string[];
  status?: TemplateStatus;
  change_notes?: string;              // For version history
}

/**
 * Variable values for template preview/population
 */
export interface TemplateVariableValues {
  [variableName: string]: string;
}

// ============================================================================
// OPPORTUNITY TYPES (for context when using templates)
// ============================================================================

/**
 * Government contract opportunity status
 */
export type OpportunityStatus =
  | 'new'
  | 'analyzing'
  | 'reviewed'
  | 'bidding'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'pass';

/**
 * Government contract opportunity
 */
export interface Opportunity {
  id: string;
  solicitation_number: string | null;
  title: string;
  agency: string | null;
  naics_code: string | null;
  set_aside_type: string | null;
  location: string | null;
  posted_date: string | null;
  deadline_date: string | null;
  estimated_value: number | null;
  status: OpportunityStatus;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CATEGORY DISPLAY HELPERS
// ============================================================================

/**
 * Human-readable labels for template categories
 */
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  company_info: 'Company Info',
  safety: 'Safety',
  quality: 'Quality Control',
  personnel: 'Personnel',
  past_projects: 'Past Projects',
  capabilities: 'Capabilities',
  certifications: 'Certifications',
  other: 'Other'
};

/**
 * Status badge colors
 */
export const TEMPLATE_STATUS_COLORS: Record<TemplateStatus, string> = {
  draft: 'yellow',
  approved: 'green',
  archived: 'gray'
};
