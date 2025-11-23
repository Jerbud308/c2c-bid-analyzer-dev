// Database types
export interface Opportunity {
  id: string
  solicitation_number: string | null
  title: string
  agency: string | null
  location: string | null
  deadline: string | null
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  processing_status: string | null
  processing_substatus: string | null
  completion_percent: number
  ready_for_review: boolean
  error_message: string | null
  pdf_url: string | null
  page_count: number | null
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  opportunity_id: string
  fit_score: number | null
  fit_score_confidence: 'high' | 'medium' | 'low' | null
  scope_summary: string | null
  red_flags: string[] | null
  created_at: string
  updated_at: string
}

export interface TechnicalRequirement {
  id: string
  analysis_id: string
  category: string
  requirement: string
  reference_section: string | null
  created_at: string
}

export interface SubmissionRequirement {
  id: string
  analysis_id: string
  item_name: string
  format: string | null
  due_date: string | null
  created_at: string
}

export interface Qualification {
  id: string
  analysis_id: string
  type: string
  requirement: string
  status: 'met' | 'not_met' | 'needs_verification'
  created_at: string
}

export interface Timeline {
  id: string
  analysis_id: string
  start_date: string | null
  duration: string | null
  milestones: string[] | null
  created_at: string
}

export interface Insurance {
  id: string
  analysis_id: string
  general_liability: string | null
  workers_comp: string | null
  professional_liability: string | null
  bonding_required: boolean
  bond_amount: string | null
  created_at: string
}

export interface Pricing {
  id: string
  analysis_id: string
  structure_type: string | null
  line_items: string[] | null
  payment_terms: string | null
  created_at: string
}

export interface SiteCondition {
  id: string
  analysis_id: string
  description: string
  created_at: string
}

export interface Question {
  id: string
  analysis_id: string
  question: string
  priority: 'high' | 'medium' | 'low'
  created_at: string
}

// API response types
export interface UploadResponse {
  opportunityId: string
  message: string
}

export interface StatusResponse extends Opportunity {}

export interface AnalysisResponse {
  opportunity: Opportunity
  analysis: Analysis | null
  technical_requirements: TechnicalRequirement[]
  submission_requirements: SubmissionRequirement[]
  qualifications: Qualification[]
  timeline: Timeline | null
  insurance: Insurance | null
  pricing: Pricing | null
  site_conditions: SiteCondition[]
  questions: Question[]
}
