/**
 * TypeScript type definitions for C2C Bid Analyzer API
 *
 * This file contains all the type definitions used throughout the application,
 * including database entities, API responses, and custom error types.
 */

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * Represents a government contracting opportunity in the system
 */
export interface Opportunity {
  /** Unique identifier for the opportunity */
  id: string;
  /** Government solicitation number (e.g., "W912BU-24-R-0001") */
  solicitation_number: string | null;
  /** Title/name of the opportunity */
  title: string;
  /** Government agency posting the opportunity */
  agency: string | null;
  /** NAICS code for the contract type */
  naics_code: string | null;
  /** Set-aside type (SDVOSB, 8(a), HUBZone, WOSB, etc.) */
  set_aside_type: string | null;
  /** Geographic location of the work */
  location: string | null;
  /** Date the opportunity was posted */
  posted_date: string | null;
  /** Submission deadline date */
  deadline_date: string | null;
  /** Estimated contract value in dollars */
  estimated_value: number | null;
  /** Current status of the opportunity */
  status: OpportunityStatus;
  /** Internal notes about the opportunity */
  notes: string | null;
  /** User ID of the assigned team member */
  assigned_to: string | null;
  /** Timestamp when the record was created */
  created_at: string;
  /** Timestamp when the record was last updated */
  updated_at: string;
}

/**
 * Valid status values for an opportunity
 */
export type OpportunityStatus =
  | 'new'        // Just uploaded, not yet reviewed
  | 'analyzing'  // AI analysis in progress
  | 'reviewed'   // Analysis complete, under review
  | 'bidding'    // Decided to bid, preparing proposal
  | 'submitted'  // Proposal submitted
  | 'won'        // Contract awarded to us
  | 'lost'       // Contract awarded to competitor
  | 'pass';      // Decided not to bid

/**
 * Represents an uploaded bid document
 */
export interface BidDocument {
  /** Unique identifier for the document */
  id: string;
  /** ID of the associated opportunity */
  opportunity_id: string;
  /** Original filename of the uploaded file */
  file_name: string;
  /** Storage path in Supabase Storage */
  file_path: string;
  /** File size in bytes */
  file_size: number | null;
  /** MIME type of the file */
  mime_type: string | null;
  /** Number of pages in the document */
  page_count: number | null;
  /** Timestamp when the file was uploaded */
  upload_date: string;
  /** Current processing status */
  processing_status: ProcessingStatus;
  /** Timestamp when OCR completed */
  ocr_completed_at: string | null;
  /** Timestamp when AI analysis completed */
  analysis_completed_at: string | null;
  /** Error message if processing failed */
  error_message: string | null;
}

/**
 * Valid processing status values for a bid document
 */
export type ProcessingStatus =
  | 'pending'         // Uploaded, not yet started
  | 'ocr_processing'  // OCR extraction in progress
  | 'ocr_completed'   // OCR done, waiting for AI analysis
  | 'ai_processing'   // AI analysis in progress
  | 'completed'       // Fully processed and ready
  | 'failed';         // Processing failed

/**
 * Complete AI analysis of a bid document
 */
export interface Analysis {
  /** Unique identifier for the analysis */
  id: string;
  /** ID of the associated opportunity */
  opportunity_id: string;
  /** ID of the analyzed document */
  document_id: string;
  /** High-level summary of the project scope */
  scope_summary: string;
  /** Technical requirements extracted from the bid */
  technical_requirements: TechnicalRequirement[];
  /** Required submission items and formats */
  submission_requirements: SubmissionRequirement[];
  /** Qualifications required from bidders */
  qualifications_required: Qualification[];
  /** Project timeline and milestones */
  timeline_schedule: TimelineSchedule;
  /** Insurance and bonding requirements */
  insurance_bonding: InsuranceBonding;
  /** Pricing structure and payment terms */
  pricing_structure: PricingStructure;
  /** Whether prevailing wage requirements apply */
  prevailing_wage: boolean | null;
  /** Site conditions and access information */
  site_conditions: string | null;
  /** Questions that need clarification */
  questions_flagged: string[];
  /** Fit score (0-100) indicating how well this matches C2C's capabilities */
  fit_score: number;
  /** AI confidence level in the analysis */
  confidence_level: ConfidenceLevel;
  /** Potential issues or concerns identified */
  red_flags: string[];
  /** Timestamp when the analysis was completed */
  analysis_timestamp: string;
  /** Time taken to process in seconds */
  processing_time_seconds: number | null;
}

/**
 * A technical requirement extracted from the bid
 */
export interface TechnicalRequirement {
  /** Category/type of requirement */
  category: string;
  /** Description of the requirement */
  requirement: string;
  /** Section reference in the original document */
  reference_section: string;
}

/**
 * A required submission item
 */
export interface SubmissionRequirement {
  /** Name of the required item */
  item: string;
  /** Required format (PDF, Excel, etc.) */
  format: string;
  /** Due date if specified separately */
  due?: string;
}

/**
 * A qualification requirement with C2C's status
 */
export interface Qualification {
  /** Type of qualification */
  type: string;
  /** Description of the requirement */
  requirement: string;
  /** C2C's current status for this qualification */
  c2c_status: 'met' | 'needs_verification' | 'not_met';
}

/**
 * Project timeline and schedule information
 */
export interface TimelineSchedule {
  /** Project start date */
  start_date?: string;
  /** Project duration */
  duration?: string;
  /** Key milestones and deadlines */
  milestones: string[];
}

/**
 * Insurance and bonding requirements
 */
export interface InsuranceBonding {
  /** General liability insurance requirement */
  general_liability?: string;
  /** Workers compensation requirement */
  workers_comp?: string;
  /** Performance bond requirement */
  performance_bond?: string;
  /** Payment bond requirement */
  payment_bond?: string;
  /** Other insurance/bonding requirements */
  [key: string]: string | undefined;
}

/**
 * Pricing structure information
 */
export interface PricingStructure {
  /** Type of pricing structure (lump sum, unit price, etc.) */
  structure_type?: string;
  /** Line items to be priced */
  line_items: string[];
  /** Payment terms and schedule */
  payment_terms?: string;
}

/**
 * AI confidence level in the analysis
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ============================================================================
// Notification Types
// ============================================================================

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  /** User's email address */
  user_email: string;
  /** User's display name */
  user_name: string | null;
  /** Receive email when analysis completes */
  notify_analysis_complete: boolean;
  /** Receive email when processing fails */
  notify_processing_failed: boolean;
  /** Receive deadline reminder emails */
  notify_deadline_reminders: boolean;
  /** Receive daily digest of new opportunities */
  notify_daily_digest: boolean;
  /** Receive email when opportunity status changes */
  notify_status_change: boolean;
  /** Time of day to receive daily digest (HH:mm:ss format) */
  digest_time: string;
  /** Days before deadline to send reminders (e.g., [7, 3, 1]) */
  deadline_reminder_days: number[];
  /** Timestamp when preferences were created */
  created_at: string;
  /** Timestamp when preferences were last updated */
  updated_at: string;
}

/**
 * Valid notification types
 */
export type NotificationType =
  | 'analysis_complete'
  | 'processing_failed'
  | 'deadline_reminder'
  | 'daily_digest'
  | 'status_change';

/**
 * Notification delivery status
 */
export type NotificationStatus = 'sent' | 'failed' | 'bounced';

/**
 * Notification log entry
 */
export interface NotificationLog {
  /** Unique identifier for the log entry */
  id: string;
  /** Email address notification was sent to */
  user_email: string;
  /** Type of notification */
  notification_type: NotificationType;
  /** Associated opportunity ID (if applicable) */
  opportunity_id: string | null;
  /** Timestamp when notification was sent */
  sent_at: string;
  /** Delivery status */
  status: NotificationStatus;
  /** Error message if delivery failed */
  error_message: string | null;
  /** Additional metadata about the email */
  email_metadata: Record<string, any>;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from the upload-bid-package endpoint
 */
export interface UploadResponse {
  /** Whether the upload was successful */
  success: boolean;
  /** ID of the created opportunity */
  opportunity_id: string;
  /** ID of the created document */
  document_id: string;
  /** Current processing status */
  status: string;
  /** Human-readable message */
  message: string;
}

/**
 * Response from the check-status endpoint
 */
export interface StatusResponse {
  /** ID of the opportunity being checked */
  opportunity_id: string;
  /** Current processing status */
  processing_status: ProcessingStatus;
  /** Processing completion percentage (0-100) */
  completion_percent: number;
  /** Whether OCR has completed */
  ocr_completed: boolean;
  /** Whether AI analysis has completed */
  analysis_completed: boolean;
  /** Number of pages in the document */
  page_count: number | null;
  /** Error message if processing failed */
  error_message: string | null;
  /** Whether the analysis is ready to view */
  ready_for_review: boolean;
}

/**
 * Response from the get-analysis endpoint
 */
export interface AnalysisResponse {
  /** The opportunity record */
  opportunity: Opportunity;
  /** The AI analysis (without raw OCR text) */
  analysis: Omit<Analysis, 'raw_ocr_text'>;
  /** Processing metadata */
  processing_metadata: {
    /** Original filename */
    file_name: string;
    /** Number of pages processed */
    page_count: number;
    /** Total processing time in seconds */
    processing_time_seconds: number;
    /** Timestamp when analysis completed */
    analyzed_at: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error class for API errors
 * Provides structured error information including status codes and details
 */
export class ApiError extends Error {
  /**
   * Creates a new API error
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (if applicable)
   * @param details - Additional error details
   */
  constructor(
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
