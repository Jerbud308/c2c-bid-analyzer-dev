// Shared types for Supabase Edge Functions

// Database types matching schema
export interface Opportunity {
  id: string;
  solicitation_number: string;
  title: string;
  agency: string;
  source?: string;
  url?: string;
  due_date?: string;
  posted_date?: string;
  location?: string;
  naics_codes?: string[];
  set_aside?: string;
  status: 'new' | 'reviewed' | 'proposal_prep' | 'submitted' | 'awarded' | 'lost' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface BidDocument {
  id: string;
  opportunity_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count?: number;
  processing_status: 'pending' | 'ocr_processing' | 'ocr_completed' | 'ai_processing' | 'completed' | 'failed';
  error_message?: string;
  ocr_completed_at?: string;
  analysis_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BidAnalysis {
  id: string;
  opportunity_id: string;
  document_id: string;
  raw_ocr_text?: string;
  scope_summary?: string;
  technical_requirements?: TechnicalRequirement[];
  submission_requirements?: SubmissionRequirement[];
  qualifications_required?: QualificationRequirement[];
  timeline_schedule?: TimelineSchedule;
  insurance_bonding?: InsuranceBonding;
  pricing_structure?: PricingStructure;
  prevailing_wage?: boolean;
  site_conditions?: string;
  questions_flagged?: string[];
  fit_score?: number;
  confidence_level?: 'high' | 'medium' | 'low';
  red_flags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TechnicalRequirement {
  category: 'Materials' | 'Installation' | 'Standards';
  requirement: string;
  reference_section: string;
}

export interface SubmissionRequirement {
  item: string;
  format: string;
  due: string;
}

export interface QualificationRequirement {
  type: 'License' | 'Certification' | 'Experience';
  requirement: string;
  c2c_status: 'met' | 'needs_verification' | 'not_met';
}

export interface TimelineSchedule {
  start_date: string;
  duration: string;
  milestones: string[];
}

export interface InsuranceBonding {
  general_liability?: string;
  workers_comp?: string;
  performance_bond?: string;
  payment_bond?: string;
}

export interface PricingStructure {
  structure_type: 'lump sum' | 'unit price' | 'cost plus';
  line_items: string[];
  payment_terms: string;
}

// API Request/Response types
export interface UploadBidRequest {
  file: File;
  solicitation_number: string;
  title: string;
  agency: string;
  due_date?: string;
  location?: string;
  naics_codes?: string[];
  set_aside?: string;
  url?: string;
}

export interface UploadBidResponse {
  success: boolean;
  opportunity_id: string;
  document_id: string;
  status: string;
  message: string;
}

export interface OCRProcessorRequest {
  documentId: string;
  opportunityId: string;
  filePath: string;
}

export interface OCRProcessorResponse {
  success: boolean;
  text_length: number;
  page_count: number;
  processing_time_seconds: number;
}

export interface AIAnalyzerRequest {
  documentId: string;
  opportunityId: string;
}

export interface AIAnalyzerResponse {
  success: boolean;
  fit_score: number;
  confidence: string;
  processing_time: number;
}

export interface CheckStatusResponse {
  opportunity_id: string;
  processing_status: string;
  completion_percent: number;
  ocr_completed: boolean;
  analysis_completed: boolean;
  page_count?: number;
  error_message?: string;
  ready_for_review: boolean;
}

export interface GetAnalysisResponse {
  opportunity: Opportunity;
  analysis: Omit<BidAnalysis, 'raw_ocr_text'>;
  processing_metadata: {
    file_name: string;
    page_count?: number;
    processing_time_seconds?: number;
    analyzed_at?: string;
  };
}

// AI Analysis structured output
export interface AIAnalysisOutput {
  scope_summary: string;
  technical_requirements: TechnicalRequirement[];
  submission_requirements: SubmissionRequirement[];
  qualifications_required: QualificationRequirement[];
  timeline_schedule: TimelineSchedule;
  insurance_bonding: InsuranceBonding;
  pricing_structure: PricingStructure;
  prevailing_wage: boolean;
  site_conditions: string;
  questions_flagged: string[];
}

// Google Cloud Vision types
export interface GoogleCloudCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface VisionAPIResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        width: number;
        height: number;
      }>;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

// Error response type
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// CORS headers helper
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
