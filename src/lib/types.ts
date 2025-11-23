// ============================================================================
// Type Definitions for C2C Bid Analyzer
// ============================================================================

// ----------------------------------------------------------------------------
// Enums and Constants
// ----------------------------------------------------------------------------

export type OpportunityStatus =
  | 'new'
  | 'analyzing'
  | 'reviewed'
  | 'bidding'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'pass';

export type ProcessingStatus =
  | 'pending'
  | 'ocr_processing'
  | 'ocr_completed'
  | 'ai_processing'
  | 'completed'
  | 'failed';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type SetAsideType = 'SDVOSB' | '8(a)' | 'HUBZone' | 'WOSB' | 'None';

export type NAICSCode =
  | '238160' // Roofing Contractors
  | '238310' // Drywall and Insulation Contractors
  | '236220' // Commercial and Institutional Building Construction
  | '236118' // Residential Remodelers
  | '238210' // Electrical Contractors
  | '562910'; // Remediation Services (Asbestos)

// ----------------------------------------------------------------------------
// Database Models
// ----------------------------------------------------------------------------

export interface Opportunity {
  id: string;
  solicitation_number: string | null;
  title: string;
  agency: string | null;
  naics_code: string | null;
  set_aside_type: string | null;
  location: string | null;
  posted_date: string | null; // ISO date string
  deadline_date: string | null; // ISO date string
  estimated_value: number | null;
  status: OpportunityStatus;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface BidDocument {
  id: string;
  opportunity_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  page_count: number | null;
  upload_date: string;
  processing_status: ProcessingStatus;
  ocr_completed_at: string | null;
  analysis_completed_at: string | null;
  error_message: string | null;
}

export interface BidAnalysis {
  id: string;
  opportunity_id: string;
  document_id: string;
  scope_summary: string | null;
  technical_requirements: TechnicalRequirement[];
  submission_requirements: SubmissionRequirement[];
  qualifications_required: QualificationRequirement[];
  timeline_schedule: TimelineSchedule | null;
  insurance_bonding: InsuranceBonding | null;
  pricing_structure: PricingStructure | null;
  prevailing_wage: boolean | null;
  site_conditions: string | null;
  questions_flagged: QuestionFlagged[];
  fit_score: number | null;
  confidence_level: ConfidenceLevel | null;
  red_flags: RedFlag[];
  raw_ocr_text: string | null;
  analysis_timestamp: string;
  processing_time_seconds: number | null;
}

// ----------------------------------------------------------------------------
// JSONB Field Structures
// ----------------------------------------------------------------------------

export interface TechnicalRequirement {
  category: string;
  requirement: string;
  reference_section: string;
}

export interface SubmissionRequirement {
  item: string;
  format: string;
  due: string;
}

export interface QualificationRequirement {
  type: string;
  requirement: string;
  c2c_status: 'met' | 'needs_verification' | 'not_met';
}

export interface TimelineSchedule {
  start_date: string;
  duration: string;
  completion_date?: string;
  milestones: Milestone[];
}

export interface Milestone {
  name: string;
  duration: string;
  completion: string;
}

export interface InsuranceBonding {
  general_liability?: string;
  workers_comp?: string;
  performance_bond?: string;
  payment_bond?: string;
  additional_insured?: string;
}

export interface PricingStructure {
  structure_type: string;
  payment_terms: string;
  line_items: LineItem[];
}

export interface LineItem {
  clin: string;
  description: string;
  unit: string;
  quantity: number;
  estimated_amount?: string;
  estimated_unit_price?: string;
}

export interface QuestionFlagged {
  question: string;
  category: string;
  criticality: 'high' | 'medium' | 'low';
}

export interface RedFlag {
  flag: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  disqualifying: boolean;
}

// ----------------------------------------------------------------------------
// Dashboard-Specific Types
// ----------------------------------------------------------------------------

export interface OpportunityWithAnalysis extends Opportunity {
  fit_score?: number | null;
  confidence_level?: ConfidenceLevel | null;
  processing_status?: ProcessingStatus;
  analysis_completed?: boolean;
}

export interface OpportunityFilters {
  status?: OpportunityStatus[];
  naics_code?: string[];
  set_aside_type?: string[];
  deadline_from?: string;
  deadline_to?: string;
  fit_score_min?: number;
  fit_score_max?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OpportunitiesResponse {
  opportunities: OpportunityWithAnalysis[];
  total_count: number;
  page: number;
  limit: number;
  metrics: DashboardMetrics;
}

export interface DashboardMetrics {
  total: number;
  avg_fit_score: number;
  urgent_count: number; // Deadlines in next 7 days
}

// ----------------------------------------------------------------------------
// API Request/Response Types
// ----------------------------------------------------------------------------

export interface UpdateStatusRequest {
  status: OpportunityStatus;
}

export interface BulkUpdateStatusRequest {
  opportunity_ids: string[];
  status: OpportunityStatus;
}

export interface BulkUpdateStatusResponse {
  success: boolean;
  updated_count: number;
}

export interface ExportFormat {
  format: 'csv' | 'excel';
}

// ----------------------------------------------------------------------------
// UI Component Props Types
// ----------------------------------------------------------------------------

export interface TableSortState {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
}

export interface ViewMode {
  mode: 'table' | 'card';
}

// ----------------------------------------------------------------------------
// Utility Types
// ----------------------------------------------------------------------------

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
}
