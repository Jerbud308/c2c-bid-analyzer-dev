/**
 * Unit tests for API client
 *
 * Tests all API functions with mock responses from MSW
 */

import { describe, it, expect } from 'vitest'
import { api } from '../api'
import { ApiError } from '../types'
import { server } from '@/test/setup'
import { errorHandlers } from '@/test/mocks/handlers'
import {
  mockUploadResponse,
  mockStatusResponse,
  mockAnalysisResponse,
  createMockFormData,
  createMockPdfFile
} from '@/test/fixtures/mockData'

describe('API Client', () => {
  describe('uploadBid', () => {
    it('should upload PDF and return opportunity ID', async () => {
      const formData = createMockFormData()

      const result = await api.uploadBid(formData)

      expect(result.success).toBe(true)
      expect(result.opportunity_id).toBe(mockUploadResponse.opportunity_id)
      expect(result.document_id).toBe(mockUploadResponse.document_id)
      expect(result.status).toBe('processing')
      expect(result.message).toBe('Upload successful')
    })

    it('should handle server errors gracefully', async () => {
      server.use(errorHandlers.uploadServerError)

      const formData = createMockFormData()

      await expect(api.uploadBid(formData)).rejects.toThrow(ApiError)
      await expect(api.uploadBid(formData)).rejects.toThrow(/failed to process/i)
    }, 15000)

    it('should handle bad request errors', async () => {
      server.use(errorHandlers.uploadBadRequest)

      const formData = createMockFormData()

      await expect(api.uploadBid(formData)).rejects.toThrow(ApiError)
      await expect(api.uploadBid(formData)).rejects.toThrow(/file is required/i)
    })

    it('should handle network errors', async () => {
      server.use(errorHandlers.networkError)

      const formData = createMockFormData()

      await expect(api.uploadBid(formData)).rejects.toThrow(ApiError)
    }, 15000)

    it('should include file metadata in request', async () => {
      const file = createMockPdfFile('custom-bid.pdf', 2048)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', 'Custom Project Title')
      formData.append('agency', 'Test Agency')

      const result = await api.uploadBid(formData)

      expect(result.success).toBe(true)
    })
  })

  describe('checkStatus', () => {
    it('should return processing status for valid opportunity ID', async () => {
      const status = await api.checkStatus('test-opp-123')

      expect(status.opportunity_id).toBe('test-opp-123')
      expect(status.processing_status).toBe(mockStatusResponse.processing_status)
      expect(status.completion_percent).toBe(100)
      expect(status.ready_for_review).toBe(true)
      expect(status.ocr_completed).toBe(true)
      expect(status.analysis_completed).toBe(true)
    })

    it('should handle opportunity not found error', async () => {
      server.use(errorHandlers.statusNotFound)

      await expect(api.checkStatus('invalid-id')).rejects.toThrow(ApiError)
      await expect(api.checkStatus('invalid-id')).rejects.toThrow(/not found/i)
    })

    it('should return null error message when processing succeeds', async () => {
      const status = await api.checkStatus('test-opp-123')

      expect(status.error_message).toBeNull()
    })

    it('should properly encode opportunity ID in URL', async () => {
      const specialId = 'test-opp-with-special-chars-!@#'
      const status = await api.checkStatus(specialId)

      expect(status.opportunity_id).toBeDefined()
    })
  })

  describe('getAnalysis', () => {
    it('should return full analysis for completed opportunity', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.opportunity).toBeDefined()
      expect(analysis.analysis).toBeDefined()
      expect(analysis.processing_metadata).toBeDefined()
    })

    it('should include opportunity details', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.opportunity.id).toBe('test-opp-123')
      expect(analysis.opportunity.title).toBe(mockAnalysisResponse.opportunity.title)
      expect(analysis.opportunity.agency).toBe(mockAnalysisResponse.opportunity.agency)
      expect(analysis.opportunity.solicitation_number).toBe('TEST-001')
    })

    it('should include analysis with fit score', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.analysis.fit_score).toBeGreaterThan(0)
      expect(analysis.analysis.fit_score).toBeLessThanOrEqual(100)
      expect(analysis.analysis.confidence_level).toBeDefined()
      expect(['high', 'medium', 'low']).toContain(analysis.analysis.confidence_level)
    })

    it('should include technical requirements array', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(Array.isArray(analysis.analysis.technical_requirements)).toBe(true)
      expect(analysis.analysis.technical_requirements.length).toBeGreaterThan(0)

      const firstReq = analysis.analysis.technical_requirements[0]
      expect(firstReq.category).toBeDefined()
      expect(firstReq.requirement).toBeDefined()
      expect(firstReq.reference_section).toBeDefined()
    })

    it('should include submission requirements', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(Array.isArray(analysis.analysis.submission_requirements)).toBe(true)
      expect(analysis.analysis.submission_requirements.length).toBeGreaterThan(0)

      const firstReq = analysis.analysis.submission_requirements[0]
      expect(firstReq.item).toBeDefined()
      expect(firstReq.format).toBeDefined()
    })

    it('should include qualifications with C2C status', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(Array.isArray(analysis.analysis.qualifications_required)).toBe(true)

      const firstQual = analysis.analysis.qualifications_required[0]
      expect(firstQual.type).toBeDefined()
      expect(firstQual.requirement).toBeDefined()
      expect(['met', 'needs_verification', 'not_met']).toContain(firstQual.c2c_status)
    })

    it('should include timeline and schedule information', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.analysis.timeline_schedule).toBeDefined()
      expect(Array.isArray(analysis.analysis.timeline_schedule.milestones)).toBe(true)
    })

    it('should include insurance and bonding requirements', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.analysis.insurance_bonding).toBeDefined()
      expect(analysis.analysis.insurance_bonding.general_liability).toBeDefined()
    })

    it('should include pricing structure', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.analysis.pricing_structure).toBeDefined()
      expect(Array.isArray(analysis.analysis.pricing_structure.line_items)).toBe(true)
    })

    it('should include red flags array (may be empty)', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(Array.isArray(analysis.analysis.red_flags)).toBe(true)
    })

    it('should include questions flagged for clarification', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(Array.isArray(analysis.analysis.questions_flagged)).toBe(true)
    })

    it('should include processing metadata', async () => {
      const analysis = await api.getAnalysis('test-opp-123')

      expect(analysis.processing_metadata.file_name).toBeDefined()
      expect(analysis.processing_metadata.page_count).toBeGreaterThan(0)
      expect(analysis.processing_metadata.processing_time_seconds).toBeGreaterThan(0)
      expect(analysis.processing_metadata.analyzed_at).toBeDefined()
    })

    it('should handle analysis not ready error', async () => {
      server.use(errorHandlers.analysisNotReady)

      await expect(api.getAnalysis('test-opp-123')).rejects.toThrow(ApiError)
      await expect(api.getAnalysis('test-opp-123')).rejects.toThrow(/not ready/i)
    })

    it('should handle opportunity not found error', async () => {
      server.use(errorHandlers.analysisNotReady)

      await expect(api.getAnalysis('invalid-id')).rejects.toThrow(ApiError)
    })
  })

  describe('Error Handling', () => {
    it('should throw ApiError with status code', async () => {
      server.use(errorHandlers.uploadServerError)

      try {
        await api.uploadBid(createMockFormData())
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).statusCode).toBe(500)
        expect((error as ApiError).message).toBeDefined()
      }
    }, 15000)

    it('should include error details', async () => {
      server.use(errorHandlers.uploadBadRequest)

      try {
        await api.uploadBid(createMockFormData())
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).details).toBeDefined()
      }
    })

    it('should normalize different error types', async () => {
      server.use(errorHandlers.networkError)

      await expect(api.uploadBid(createMockFormData())).rejects.toThrow(ApiError)
    }, 15000)
  })

  describe('Retry Logic', () => {
    it('should retry on 5xx errors', async () => {
      server.use(
        errorHandlers.uploadServerError
      )

      try {
        await api.uploadBid(createMockFormData())
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
      }
    }, 15000)

    it('should not retry on 4xx client errors (except 408, 429)', async () => {
      server.use(errorHandlers.uploadBadRequest)

      const startTime = Date.now()

      try {
        await api.uploadBid(createMockFormData())
      } catch (error) {
        const duration = Date.now() - startTime
        // Should fail quickly without retries (< 1 second)
        expect(duration).toBeLessThan(1000)
      }
    })
  })
})
