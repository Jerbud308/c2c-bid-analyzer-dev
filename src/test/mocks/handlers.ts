/**
 * MSW (Mock Service Worker) request handlers for testing
 *
 * These handlers intercept HTTP requests during tests and return mock responses,
 * allowing us to test API interactions without making real network calls.
 */

import { http, HttpResponse } from 'msw'

const BASE_URL = '*/functions/v1'

export const handlers = [
  /**
   * Mock upload-bid-package endpoint
   * Returns a successful upload response with test IDs
   */
  http.post(`${BASE_URL}/upload-bid-package`, async () => {
    return HttpResponse.json({
      success: true,
      opportunity_id: 'test-opp-123',
      document_id: 'test-doc-456',
      status: 'processing',
      message: 'Upload successful'
    })
  }),

  /**
   * Mock check-status endpoint
   * Returns a completed processing status
   */
  http.get(`${BASE_URL}/check-status`, ({ request }) => {
    const url = new URL(request.url)
    const oppId = url.searchParams.get('opportunity_id')

    return HttpResponse.json({
      opportunity_id: oppId,
      processing_status: 'completed',
      completion_percent: 100,
      ocr_completed: true,
      analysis_completed: true,
      page_count: 50,
      error_message: null,
      ready_for_review: true
    })
  }),

  /**
   * Mock get-analysis endpoint
   * Returns a complete analysis with test data
   */
  http.get(`${BASE_URL}/get-analysis`, ({ request }) => {
    const url = new URL(request.url)
    const oppId = url.searchParams.get('opportunity_id')

    return HttpResponse.json({
      opportunity: {
        id: oppId,
        solicitation_number: 'TEST-001',
        title: 'Test Roof Replacement Project',
        agency: 'U.S. Army Corps of Engineers',
        naics_code: '238160',
        set_aside_type: 'SDVOSB',
        location: 'Fort Lauderdale, FL',
        posted_date: '2025-11-01',
        deadline_date: '2025-12-31',
        estimated_value: 250000,
        status: 'reviewed',
        notes: null,
        assigned_to: null,
        created_at: '2025-11-22T10:00:00Z',
        updated_at: '2025-11-22T11:00:00Z'
      },
      analysis: {
        id: 'test-analysis-789',
        opportunity_id: oppId,
        document_id: 'test-doc-456',
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
        confidence_level: 'high',
        red_flags: [],
        analysis_timestamp: '2025-11-22T11:00:00Z',
        processing_time_seconds: 120
      },
      processing_metadata: {
        file_name: 'test-bid-package.pdf',
        page_count: 50,
        processing_time_seconds: 120,
        analyzed_at: '2025-11-22T11:00:00Z'
      }
    })
  })
]

/**
 * Error handlers for testing error scenarios
 * These can be imported and used in specific tests that need to test error handling
 */
export const errorHandlers = {
  /**
   * Upload failure - 500 server error
   */
  uploadServerError: http.post(`${BASE_URL}/upload-bid-package`, () => {
    return HttpResponse.json(
      { error: 'Internal server error', message: 'Failed to process upload' },
      { status: 500 }
    )
  }),

  /**
   * Upload failure - 400 bad request
   */
  uploadBadRequest: http.post(`${BASE_URL}/upload-bid-package`, () => {
    return HttpResponse.json(
      { error: 'Bad request', message: 'File is required' },
      { status: 400 }
    )
  }),

  /**
   * Status check - 404 not found
   */
  statusNotFound: http.get(`${BASE_URL}/check-status`, () => {
    return HttpResponse.json(
      { error: 'Not found', message: 'Opportunity not found' },
      { status: 404 }
    )
  }),

  /**
   * Analysis - 404 not ready
   */
  analysisNotReady: http.get(`${BASE_URL}/get-analysis`, () => {
    return HttpResponse.json(
      { error: 'Not found', message: 'Analysis not ready or opportunity not found' },
      { status: 404 }
    )
  }),

  /**
   * Network error simulation
   */
  networkError: http.post(`${BASE_URL}/upload-bid-package`, () => {
    return HttpResponse.error()
  })
}
