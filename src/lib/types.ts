// ============================================================================
// Type Definitions for C2C Bid Analyzer
// ============================================================================

// Compliance Checklist Types
// ============================================================================

export type ChecklistCategory =
  | 'Administrative'
  | 'Technical'
  | 'Qualifications'
  | 'Pricing'
  | 'Certifications'
  | 'Insurance'

export type ChecklistStatus = 'not_started' | 'in_progress' | 'complete'

export type ResponsibleParty = 'Blake' | 'Phil' | null

export interface ChecklistItem {
  id: string
  category: ChecklistCategory
  description: string
  reference_section: string | null
  status: ChecklistStatus
  responsible_party: ResponsibleParty
  notes: string | null
  source: string
  created_at: string
  completed_at: string | null
}

export interface ComplianceChecklist {
  id: string
  opportunity_id: string
  generated_at: string
  last_updated: string
  completion_percentage: number
  items: ChecklistItem[]
  custom_items: ChecklistItem[]
}

export interface ChecklistResponse {
  checklist_id: string
  opportunity_id: string
  items: ChecklistItem[]
  custom_items: ChecklistItem[]
  completion_percentage: number
  generated_at: string
  last_updated: string
}

export interface ChecklistItemUpdate {
  status?: ChecklistStatus
  responsible_party?: ResponsibleParty
  notes?: string
}

export interface CustomChecklistItem {
  category: ChecklistCategory
  description: string
  responsible_party?: ResponsibleParty
}

// Opportunity Types
// ============================================================================

export type OpportunityStatus =
  | 'new'
  | 'analyzing'
  | 'reviewed'
  | 'bidding'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'pass'

export interface Opportunity {
  id: string
  solicitation_number: string | null
  title: string
  agency: string | null
  naics_code: string | null
  set_aside_type: string | null
  location: string | null
  posted_date: string | null
  deadline_date: string | null
  estimated_value: number | null
  status: OpportunityStatus
  notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

// Bid Document Types
// ============================================================================

export type ProcessingStatus =
  | 'pending'
  | 'ocr_processing'
  | 'ocr_completed'
  | 'ai_processing'
  | 'completed'
  | 'failed'

export interface BidDocument {
  id: string
  opportunity_id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  page_count: number | null
  upload_date: string
  processing_status: ProcessingStatus
  ocr_completed_at: string | null
  analysis_completed_at: string | null
  error_message: string | null
}

// Bid Analysis Types
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type QualificationStatus = 'met' | 'needs_verification' | 'not_met'

export interface TechnicalRequirement {
  category: string
  requirement: string
  reference_section?: string
}

export interface SubmissionRequirement {
  item: string
  format?: string
  due?: string
  reference_section?: string
}

export interface Qualification {
  type: string
  requirement: string
  c2c_status: QualificationStatus
  reference_section?: string
}

export interface TimelineSchedule {
  start_date?: string
  duration?: string
  milestones?: Array<{
    name: string
    date: string
  }>
}

export interface InsuranceBonding {
  general_liability?: string
  workers_comp?: string
  performance_bond?: string
  payment_bond?: string
}

export interface PricingStructure {
  structure_type: string
  line_items?: Array<{
    item: string
    description: string
  }>
  payment_terms?: string
}

export interface RedFlag {
  issue: string
  severity: 'high' | 'medium' | 'low'
  description: string
}

export interface QuestionFlagged {
  question: string
  reference_section?: string
  reason: string
}

export interface BidAnalysis {
  id: string
  opportunity_id: string
  document_id: string
  scope_summary: string | null
  technical_requirements: TechnicalRequirement[]
  submission_requirements: SubmissionRequirement[]
  qualifications_required: Qualification[]
  timeline_schedule: TimelineSchedule
  insurance_bonding: InsuranceBonding
  pricing_structure: PricingStructure
  prevailing_wage: boolean | null
  site_conditions: string | null
  questions_flagged: QuestionFlagged[]
  fit_score: number | null
  confidence_level: ConfidenceLevel | null
  red_flags: RedFlag[]
  raw_ocr_text: string | null
  analysis_timestamp: string
  processing_time_seconds: number | null
}

// Export Format Types
// ============================================================================

export type ExportFormat = 'pdf' | 'excel'
