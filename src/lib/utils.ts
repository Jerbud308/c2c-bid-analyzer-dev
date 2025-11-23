/**
 * Utility functions for C2C Bid Analyzer
 *
 * This file provides framework-agnostic utility functions for formatting,
 * date manipulation, and UI helper functions. All functions are pure and
 * have no side effects.
 */

import type { ConfidenceLevel, ProcessingStatus } from './types';
import { OCR_TIME_PER_PAGE, AI_ANALYSIS_TIME } from './constants';

// ============================================================================
// File Formatting Utilities
// ============================================================================

/**
 * Formats a file size in bytes to a human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "500 KB", "3.2 GB")
 *
 * @example
 * ```typescript
 * formatFileSize(1536) // "1.5 KB"
 * formatFileSize(1048576) // "1.0 MB"
 * formatFileSize(52428800) // "50.0 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Format with 1 decimal place for sizes >= 1KB
  return i === 0
    ? `${value} ${sizes[i]}`
    : `${value.toFixed(1)} ${sizes[i]}`;
}

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Formats an ISO date string to a readable date
 *
 * @param dateString - ISO 8601 date string
 * @returns Formatted date (e.g., "Nov 22, 2025")
 *
 * @example
 * ```typescript
 * formatDate("2025-11-22T15:30:00Z") // "Nov 22, 2025"
 * formatDate("2025-01-15") // "Jan 15, 2025"
 * ```
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Formats an ISO date string to a readable date and time
 *
 * @param dateString - ISO 8601 date string
 * @returns Formatted date and time (e.g., "Nov 22, 2025 3:45 PM")
 *
 * @example
 * ```typescript
 * formatDateTime("2025-11-22T15:30:00Z") // "Nov 22, 2025 3:30 PM"
 * ```
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Calculates the number of days remaining until a deadline
 *
 * @param deadline - ISO 8601 date string or date string
 * @returns Number of days remaining (negative if past deadline)
 *
 * @example
 * ```typescript
 * getDaysRemaining("2025-12-31") // e.g., 38 (if today is Nov 23, 2025)
 * getDaysRemaining("2025-11-20") // -3 (deadline passed)
 * ```
 */
export function getDaysRemaining(deadline: string): number {
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();

    // Reset time to midnight for accurate day calculation
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch {
    return 0;
  }
}

/**
 * Formats days remaining into a human-readable string
 *
 * @param days - Number of days (can be negative)
 * @returns Formatted string (e.g., "3 days left", "Due today", "2 days overdue")
 *
 * @example
 * ```typescript
 * formatDaysRemaining(5) // "5 days left"
 * formatDaysRemaining(1) // "1 day left"
 * formatDaysRemaining(0) // "Due today"
 * formatDaysRemaining(-2) // "2 days overdue"
 * ```
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days > 1) return `${days} days left`;
  if (days === -1) return '1 day overdue';
  return `${Math.abs(days)} days overdue`;
}

// ============================================================================
// Scoring and Status Utilities
// ============================================================================

/**
 * Gets a Tailwind color class for a fit score
 *
 * @param score - Fit score from 0-100
 * @returns Tailwind color name (without prefix)
 *
 * @example
 * ```typescript
 * getFitScoreColor(85) // "green"
 * getFitScoreColor(70) // "yellow"
 * getFitScoreColor(45) // "red"
 * ```
 */
export function getFitScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

/**
 * Gets a Tailwind background color class for a confidence level
 *
 * @param confidence - Confidence level
 * @returns Tailwind bg color class
 *
 * @example
 * ```typescript
 * getConfidenceBadgeColor('high') // "bg-green-100"
 * getConfidenceBadgeColor('medium') // "bg-yellow-100"
 * getConfidenceBadgeColor('low') // "bg-red-100"
 * ```
 */
export function getConfidenceBadgeColor(confidence: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: 'bg-green-100',
    medium: 'bg-yellow-100',
    low: 'bg-red-100',
  };
  return colors[confidence];
}

/**
 * Gets a Tailwind text color class for a confidence level
 *
 * @param confidence - Confidence level
 * @returns Tailwind text color class
 *
 * @example
 * ```typescript
 * getConfidenceTextColor('high') // "text-green-800"
 * ```
 */
export function getConfidenceTextColor(confidence: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: 'text-green-800',
    medium: 'text-yellow-800',
    low: 'text-red-800',
  };
  return colors[confidence];
}

/**
 * Gets an icon/emoji for a processing status
 *
 * @param status - Current processing status
 * @returns Emoji or icon name representing the status
 *
 * @example
 * ```typescript
 * getStatusIcon('pending') // "⏳"
 * getStatusIcon('completed') // "✅"
 * getStatusIcon('failed') // "❌"
 * ```
 */
export function getStatusIcon(status: ProcessingStatus): string {
  const icons: Record<ProcessingStatus, string> = {
    pending: '⏳',
    ocr_processing: '📄',
    ocr_completed: '📝',
    ai_processing: '🤖',
    completed: '✅',
    failed: '❌',
  };
  return icons[status];
}

/**
 * Gets a human-readable label for a processing status
 *
 * @param status - Current processing status
 * @returns Human-readable status label
 *
 * @example
 * ```typescript
 * getStatusLabel('ocr_processing') // "Extracting text..."
 * getStatusLabel('ai_processing') // "Analyzing document..."
 * ```
 */
export function getStatusLabel(status: ProcessingStatus): string {
  const labels: Record<ProcessingStatus, string> = {
    pending: 'Queued',
    ocr_processing: 'Extracting text...',
    ocr_completed: 'Text extracted',
    ai_processing: 'Analyzing document...',
    completed: 'Complete',
    failed: 'Failed',
  };
  return labels[status];
}

// ============================================================================
// Time Estimation Utilities
// ============================================================================

/**
 * Calculates estimated processing time based on page count
 *
 * @param pageCount - Number of pages in the document
 * @returns Estimated processing time in seconds
 *
 * @example
 * ```typescript
 * calculateEstimatedTime(50) // 160 (100s for OCR + 60s for AI)
 * calculateEstimatedTime(10) // 80 (20s for OCR + 60s for AI)
 * ```
 */
export function calculateEstimatedTime(pageCount: number): number {
  const ocrTime = pageCount * OCR_TIME_PER_PAGE;
  return ocrTime + AI_ANALYSIS_TIME;
}

/**
 * Formats seconds into a human-readable duration
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration (e.g., "2m 30s", "45s", "1h 15m")
 *
 * @example
 * ```typescript
 * formatDuration(45) // "45s"
 * formatDuration(150) // "2m 30s"
 * formatDuration(3665) // "1h 1m"
 * ```
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Combines class names conditionally (similar to clsx/classnames)
 *
 * @param classes - Class names or conditional expressions
 * @returns Combined class name string
 *
 * @example
 * ```typescript
 * cn('base', 'text-red-500') // "base text-red-500"
 * cn('base', isActive && 'active', 'end') // "base active end" (if isActive is true)
 * cn('base', false && 'hidden', 'end') // "base end"
 * cn('base', null, undefined, 'end') // "base end"
 * ```
 */
export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes
    .filter((c): c is string => Boolean(c) && typeof c === 'string')
    .join(' ');
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates if a file is an allowed PDF type
 *
 * @param file - File object to validate
 * @returns True if file is valid PDF
 *
 * @example
 * ```typescript
 * isValidPdfFile(file) // true if PDF, false otherwise
 * ```
 */
export function isValidPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Validates if a file size is within limits
 *
 * @param file - File object to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if file size is valid
 *
 * @example
 * ```typescript
 * import { MAX_FILE_SIZE } from './constants'
 * isValidFileSize(file, MAX_FILE_SIZE) // true if under limit
 * ```
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// ============================================================================
// Number Formatting Utilities
// ============================================================================

/**
 * Formats a number as currency
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(50000) // "$50,000"
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1000000) // "$1,000,000"
 * ```
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a percentage
 *
 * @param value - Value from 0-100
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercentage(75) // "75%"
 * formatPercentage(33.333, 1) // "33.3%"
 * formatPercentage(100) // "100%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}
