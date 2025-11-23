/**
 * Unit tests for utility functions
 *
 * Tests all utility functions for formatting, validation, and helpers
 */

import { describe, it, expect } from 'vitest'
import {
  formatFileSize,
  formatDate,
  formatDateTime,
  getDaysRemaining,
  formatDaysRemaining,
  getFitScoreColor,
  getConfidenceBadgeColor,
  getConfidenceTextColor,
  getStatusIcon,
  getStatusLabel,
  calculateEstimatedTime,
  formatDuration,
  cn,
  isValidPdfFile,
  isValidFileSize,
  formatCurrency,
  formatPercentage
} from '../utils'
import type { ConfidenceLevel, ProcessingStatus } from '../types'

describe('Utility Functions', () => {
  // ============================================================================
  // File Formatting
  // ============================================================================

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes (< 1KB)', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
      expect(formatFileSize(1023)).toBe('1023 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(10240)).toBe('10.0 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(5242880)).toBe('5.0 MB')
      expect(formatFileSize(52428800)).toBe('50.0 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
      expect(formatFileSize(2147483648)).toBe('2.0 GB')
    })

    it('should use 1 decimal place for sizes >= 1KB', () => {
      expect(formatFileSize(1536)).toMatch(/^\d+\.\d KB$/)
      expect(formatFileSize(1048576)).toMatch(/^\d+\.\d MB$/)
    })
  })

  // ============================================================================
  // Date Formatting
  // ============================================================================

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = formatDate('2025-11-22')
      expect(result).toContain('Nov')
      expect(result).toContain('22')
      expect(result).toContain('2025')
    })

    it('should format ISO datetime string', () => {
      const result = formatDate('2025-11-22T15:30:00Z')
      expect(result).toContain('Nov')
      expect(result).toContain('22')
      expect(result).toContain('2025')
    })

    it('should handle invalid dates gracefully', () => {
      const invalid = 'not-a-date'
      expect(formatDate(invalid)).toBe(invalid)
    })
  })

  describe('formatDateTime', () => {
    it('should format ISO datetime string with time', () => {
      const result = formatDateTime('2025-11-22T15:30:00Z')
      expect(result).toContain('Nov')
      expect(result).toContain('22')
      expect(result).toContain('2025')
      // Should include time in 12-hour format
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/)
    })

    it('should handle invalid dates gracefully', () => {
      const invalid = 'not-a-date'
      expect(formatDateTime(invalid)).toBe(invalid)
    })
  })

  describe('getDaysRemaining', () => {
    it('should calculate positive days remaining', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 5)
      const result = getDaysRemaining(tomorrow.toISOString())
      expect(result).toBe(5)
    })

    it('should return 0 for today', () => {
      const today = new Date()
      const result = getDaysRemaining(today.toISOString())
      expect(result).toBe(0)
    })

    it('should calculate negative days for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 3)
      const result = getDaysRemaining(yesterday.toISOString())
      expect(result).toBe(-3)
    })

    it('should handle invalid dates', () => {
      expect(getDaysRemaining('invalid')).toBe(0)
    })
  })

  describe('formatDaysRemaining', () => {
    it('should format today', () => {
      expect(formatDaysRemaining(0)).toBe('Due today')
    })

    it('should format 1 day left', () => {
      expect(formatDaysRemaining(1)).toBe('1 day left')
    })

    it('should format multiple days left', () => {
      expect(formatDaysRemaining(5)).toBe('5 days left')
      expect(formatDaysRemaining(30)).toBe('30 days left')
    })

    it('should format 1 day overdue', () => {
      expect(formatDaysRemaining(-1)).toBe('1 day overdue')
    })

    it('should format multiple days overdue', () => {
      expect(formatDaysRemaining(-5)).toBe('5 days overdue')
      expect(formatDaysRemaining(-30)).toBe('30 days overdue')
    })
  })

  // ============================================================================
  // Scoring and Status
  // ============================================================================

  describe('getFitScoreColor', () => {
    it('should return green for high scores (>= 80)', () => {
      expect(getFitScoreColor(80)).toBe('green')
      expect(getFitScoreColor(85)).toBe('green')
      expect(getFitScoreColor(100)).toBe('green')
    })

    it('should return yellow for medium scores (60-79)', () => {
      expect(getFitScoreColor(60)).toBe('yellow')
      expect(getFitScoreColor(70)).toBe('yellow')
      expect(getFitScoreColor(79)).toBe('yellow')
    })

    it('should return red for low scores (< 60)', () => {
      expect(getFitScoreColor(0)).toBe('red')
      expect(getFitScoreColor(45)).toBe('red')
      expect(getFitScoreColor(59)).toBe('red')
    })
  })

  describe('getConfidenceBadgeColor', () => {
    it('should return green background for high confidence', () => {
      expect(getConfidenceBadgeColor('high' as ConfidenceLevel)).toBe('bg-green-100')
    })

    it('should return yellow background for medium confidence', () => {
      expect(getConfidenceBadgeColor('medium' as ConfidenceLevel)).toBe('bg-yellow-100')
    })

    it('should return red background for low confidence', () => {
      expect(getConfidenceBadgeColor('low' as ConfidenceLevel)).toBe('bg-red-100')
    })
  })

  describe('getConfidenceTextColor', () => {
    it('should return green text for high confidence', () => {
      expect(getConfidenceTextColor('high' as ConfidenceLevel)).toBe('text-green-800')
    })

    it('should return yellow text for medium confidence', () => {
      expect(getConfidenceTextColor('medium' as ConfidenceLevel)).toBe('text-yellow-800')
    })

    it('should return red text for low confidence', () => {
      expect(getConfidenceTextColor('low' as ConfidenceLevel)).toBe('text-red-800')
    })
  })

  describe('getStatusIcon', () => {
    it('should return correct emoji for each status', () => {
      expect(getStatusIcon('pending' as ProcessingStatus)).toBe('⏳')
      expect(getStatusIcon('ocr_processing' as ProcessingStatus)).toBe('📄')
      expect(getStatusIcon('ocr_completed' as ProcessingStatus)).toBe('📝')
      expect(getStatusIcon('ai_processing' as ProcessingStatus)).toBe('🤖')
      expect(getStatusIcon('completed' as ProcessingStatus)).toBe('✅')
      expect(getStatusIcon('failed' as ProcessingStatus)).toBe('❌')
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct label for each status', () => {
      expect(getStatusLabel('pending' as ProcessingStatus)).toBe('Queued')
      expect(getStatusLabel('ocr_processing' as ProcessingStatus)).toBe('Extracting text...')
      expect(getStatusLabel('ocr_completed' as ProcessingStatus)).toBe('Text extracted')
      expect(getStatusLabel('ai_processing' as ProcessingStatus)).toBe('Analyzing document...')
      expect(getStatusLabel('completed' as ProcessingStatus)).toBe('Complete')
      expect(getStatusLabel('failed' as ProcessingStatus)).toBe('Failed')
    })
  })

  // ============================================================================
  // Time Estimation
  // ============================================================================

  describe('calculateEstimatedTime', () => {
    it('should calculate time for small documents', () => {
      // 10 pages: 10 * 2 + 60 = 80 seconds
      expect(calculateEstimatedTime(10)).toBe(80)
    })

    it('should calculate time for medium documents', () => {
      // 50 pages: 50 * 2 + 60 = 160 seconds
      expect(calculateEstimatedTime(50)).toBe(160)
    })

    it('should calculate time for large documents', () => {
      // 200 pages: 200 * 2 + 60 = 460 seconds
      expect(calculateEstimatedTime(200)).toBe(460)
    })

    it('should handle 0 pages', () => {
      expect(calculateEstimatedTime(0)).toBe(60)
    })
  })

  describe('formatDuration', () => {
    it('should format seconds only (< 60s)', () => {
      expect(formatDuration(45)).toBe('45s')
      expect(formatDuration(30)).toBe('30s')
    })

    it('should format minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s')
      expect(formatDuration(150)).toBe('2m 30s')
      expect(formatDuration(125)).toBe('2m 5s')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(3600)).toBe('1h')
      expect(formatDuration(3665)).toBe('1h 1m')
      expect(formatDuration(7200)).toBe('2h')
    })

    it('should omit seconds when hours are present', () => {
      expect(formatDuration(3665)).toBe('1h 1m')
      expect(formatDuration(3661)).toBe('1h 1m')
    })

    it('should handle exact minutes', () => {
      expect(formatDuration(60)).toBe('1m')
      expect(formatDuration(120)).toBe('2m')
    })
  })

  // ============================================================================
  // Class Name Utilities
  // ============================================================================

  describe('cn', () => {
    it('should combine multiple class names', () => {
      expect(cn('base', 'text-red-500', 'font-bold')).toBe('base text-red-500 font-bold')
    })

    it('should filter out falsy values', () => {
      expect(cn('base', false && 'hidden', 'end')).toBe('base end')
      expect(cn('base', null, undefined, 'end')).toBe('base end')
      expect(cn('base', '', 'end')).toBe('base end')
    })

    it('should handle conditional expressions', () => {
      const isActive = true
      expect(cn('base', isActive && 'active', 'end')).toBe('base active end')

      const isHidden = false
      expect(cn('base', isHidden && 'hidden', 'end')).toBe('base end')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
      expect(cn(null, undefined, false)).toBe('')
    })
  })

  // ============================================================================
  // Validation
  // ============================================================================

  describe('isValidPdfFile', () => {
    it('should accept PDF files by MIME type', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      expect(isValidPdfFile(file)).toBe(true)
    })

    it('should accept PDF files by extension', () => {
      const file = new File(['test'], 'test.pdf', { type: '' })
      expect(isValidPdfFile(file)).toBe(true)
    })

    it('should accept .PDF extension (case insensitive)', () => {
      const file = new File(['test'], 'test.PDF', { type: '' })
      expect(isValidPdfFile(file)).toBe(true)
    })

    it('should reject non-PDF files', () => {
      const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      expect(isValidPdfFile(txtFile)).toBe(false)

      const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      expect(isValidPdfFile(jpgFile)).toBe(false)
    })
  })

  describe('isValidFileSize', () => {
    it('should accept files within size limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.pdf', { type: 'application/pdf' })
      expect(isValidFileSize(file, 10000)).toBe(true)
    })

    it('should accept files exactly at size limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.pdf', { type: 'application/pdf' })
      expect(isValidFileSize(file, 1000)).toBe(true)
    })

    it('should reject files over size limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.pdf', { type: 'application/pdf' })
      expect(isValidFileSize(file, 500)).toBe(false)
    })

    it('should handle empty files', () => {
      const file = new File([], 'test.pdf', { type: 'application/pdf' })
      expect(isValidFileSize(file, 1000)).toBe(true)
    })
  })

  // ============================================================================
  // Number Formatting
  // ============================================================================

  describe('formatCurrency', () => {
    it('should format whole numbers without decimals', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(50000)).toBe('$50,000')
      expect(formatCurrency(1000000)).toBe('$1,000,000')
    })

    it('should round decimal values', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235')
      expect(formatCurrency(1234.49)).toBe('$1,234')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })
  })

  describe('formatPercentage', () => {
    it('should format with no decimals by default', () => {
      expect(formatPercentage(75)).toBe('75%')
      expect(formatPercentage(100)).toBe('100%')
      expect(formatPercentage(0)).toBe('0%')
    })

    it('should format with specified decimal places', () => {
      expect(formatPercentage(33.333, 1)).toBe('33.3%')
      expect(formatPercentage(66.666, 2)).toBe('66.67%')
      expect(formatPercentage(50.5, 1)).toBe('50.5%')
    })

    it('should handle whole numbers with decimals', () => {
      expect(formatPercentage(100, 2)).toBe('100.00%')
    })
  })
})
