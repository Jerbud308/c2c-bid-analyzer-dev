/**
 * Test fixtures and mock data
 *
 * This file contains reusable mock data for tests, ensuring consistency
 * across test suites and reducing duplication.
 */

import type {
  Opportunity,
  Analysis,
  UploadResponse,
  StatusResponse,
  AnalysisResponse,
  OpportunityStatus,
  ProcessingStatus,
  ConfidenceLevel
} from '@/lib/types'

// ============================================================================
// Mock Opportunities
// ============================================================================

export const mockOpportunity: Opportunity = {
  id: 'test-opp-123',
  solicitation_number: 'TEST-001',
  title: 'Test Roof Replacement Project',
  agency: 'U.S. Army Corps of Engineers',
  naics_code: '238160',
  set_aside_type: 'SDVOSB',
  location: 'Fort Lauderdale, FL',
  posted_date: '2025-11-01',
  deadline_date: '2025-12-31',
  estimated_value: 250000,
  status: 'new' as OpportunityStatus,
  notes: null,
  assigned_to: null,
  created_at: '2025-11-22T10:00:00Z',
  updated_at: '2025-11-22T11:00:00Z'
}

export const mockOpportunityReviewed: Opportunity = {
  ...mockOpportunity,
  status: 'reviewed' as OpportunityStatus,
  notes: 'Good fit for C2C, proceed with bid'
}

export const mockOpportunityBidding: Opportunity = {
  ...mockOpportunity,
  status: 'bidding' as OpportunityStatus,
  assigned_to: 'user-123'
}

// ============================================================================
// Mock Analysis
// ============================================================================

export const mockAnalysis: Omit<Analysis, 'id' | 'opportunity_id' | 'document_id' | 'analysis_timestamp' | 'processing_time_seconds'> = {
  scope_summary: 'Complete tear-off and replacement of existing modified bitumen roof system on Building 453. Project includes removal of existing roof system, installation of new TPO 60 mil membrane, insulation upgrades, and all associated flashings and trim.',
  technical_requirements: [
    {
      category: 'Materials',
      requirement: 'TPO 60 mil membrane, white color',
      reference_section: 'Section 3.2.1'
    },
    {
      category: 'Installation',
      requirement: 'Mechanically fastened system per manufacturer specs',
      reference_section: 'Section 3.3.2'
    },
    {
      category: 'Warranty',
      requirement: '20-year manufacturer warranty required',
      reference_section: 'Section 3.4'
    }
  ],
  submission_requirements: [
    {
      item: 'SF-1449 Commercial Bid Form',
      format: 'PDF',
      due: '2025-12-31'
    },
    {
      item: 'Price Schedule',
      format: 'Excel',
      due: '2025-12-31'
    },
    {
      item: 'Past Performance References',
      format: 'PDF'
    }
  ],
  qualifications_required: [
    {
      type: 'License',
      requirement: 'Florida Roofing Contractor License',
      c2c_status: 'met'
    },
    {
      type: 'Certification',
      requirement: 'TPO manufacturer certification',
      c2c_status: 'met'
    },
    {
      type: 'Experience',
      requirement: '3 similar projects in last 5 years',
      c2c_status: 'needs_verification'
    }
  ],
  timeline_schedule: {
    start_date: '2026-01-15',
    duration: '60 days',
    milestones: [
      'Mobilization: Day 1',
      'Tear-off complete: Day 10',
      'New roof installation: Day 30',
      'Final inspection: Day 60'
    ]
  },
  insurance_bonding: {
    general_liability: '$1,000,000 per occurrence / $2,000,000 aggregate',
    workers_comp: 'Statutory limits',
    performance_bond: '100% of contract value',
    payment_bond: '100% of contract value'
  },
  pricing_structure: {
    structure_type: 'Lump sum',
    line_items: [
      'Base Bid - Complete roof replacement',
      'Alternate 1 - Additional insulation upgrade',
      'Alternate 2 - Extended warranty to 25 years'
    ],
    payment_terms: '30 days net, progress payments monthly'
  },
  prevailing_wage: true,
  site_conditions: 'Active military base, security clearance required for all workers. Site access 7AM-4PM weekdays only.',
  questions_flagged: [
    'Confirm security clearance requirements and timeline',
    'Clarify access restrictions for material deliveries',
    'Verify acceptable manufacturers for TPO membrane'
  ],
  fit_score: 85,
  confidence_level: 'high' as ConfidenceLevel,
  red_flags: []
}

export const mockAnalysisWithRedFlags: typeof mockAnalysis = {
  ...mockAnalysis,
  fit_score: 55,
  confidence_level: 'medium' as ConfidenceLevel,
  red_flags: [
    'Short timeline may be challenging',
    'Security clearance requirements add complexity',
    'Prevailing wage requirements increase labor costs'
  ]
}

// ============================================================================
// Mock API Responses
// ============================================================================

export const mockUploadResponse: UploadResponse = {
  success: true,
  opportunity_id: 'test-opp-123',
  document_id: 'test-doc-456',
  status: 'processing',
  message: 'Upload successful'
}

export const mockStatusResponse: StatusResponse = {
  opportunity_id: 'test-opp-123',
  processing_status: 'completed' as ProcessingStatus,
  completion_percent: 100,
  ocr_completed: true,
  analysis_completed: true,
  page_count: 50,
  error_message: null,
  ready_for_review: true
}

export const mockStatusResponseProcessing: StatusResponse = {
  ...mockStatusResponse,
  processing_status: 'ocr_processing' as ProcessingStatus,
  completion_percent: 35,
  analysis_completed: false,
  ready_for_review: false
}

export const mockStatusResponseFailed: StatusResponse = {
  ...mockStatusResponse,
  processing_status: 'failed' as ProcessingStatus,
  completion_percent: 0,
  error_message: 'OCR extraction failed: Invalid PDF format',
  ready_for_review: false
}

export const mockAnalysisResponse: AnalysisResponse = {
  opportunity: mockOpportunity,
  analysis: {
    id: 'test-analysis-789',
    opportunity_id: 'test-opp-123',
    document_id: 'test-doc-456',
    ...mockAnalysis,
    analysis_timestamp: '2025-11-22T11:00:00Z',
    processing_time_seconds: 120
  },
  processing_metadata: {
    file_name: 'test-bid-package.pdf',
    page_count: 50,
    processing_time_seconds: 120,
    analyzed_at: '2025-11-22T11:00:00Z'
  }
}

// ============================================================================
// Mock Files
// ============================================================================

/**
 * Creates a mock PDF file for upload testing
 */
export function createMockPdfFile(
  name: string = 'test.pdf',
  size: number = 1024 * 1024 // 1MB default
): File {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type: 'application/pdf' })
}

/**
 * Creates a mock non-PDF file for validation testing
 */
export function createMockNonPdfFile(
  name: string = 'test.txt',
  type: string = 'text/plain'
): File {
  return new File(['test content'], name, { type })
}

/**
 * Creates a mock FormData with PDF file
 */
export function createMockFormData(
  file: File = createMockPdfFile(),
  title: string = 'Test Project'
): FormData {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)
  return formData
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a mock opportunity with custom properties
 */
export function createMockOpportunity(
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    ...mockOpportunity,
    ...overrides
  }
}

/**
 * Creates a mock analysis with custom properties
 */
export function createMockAnalysisResponse(
  overrides: Partial<AnalysisResponse> = {}
): AnalysisResponse {
  return {
    ...mockAnalysisResponse,
    ...overrides
  }
}
