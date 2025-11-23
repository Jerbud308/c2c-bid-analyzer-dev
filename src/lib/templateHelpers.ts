/**
 * Template utility functions for variable extraction and replacement
 */

import { TemplateVariableValues, Opportunity } from './types';

/**
 * Extracts variable names from template content
 * Finds all {VARIABLE_NAME} patterns and returns unique variable names
 *
 * @param content - Template content with variable placeholders
 * @returns Array of unique variable names (without braces)
 *
 * @example
 * extractVariables("Project: {PROJECT_NAME} for {AGENCY}")
 * // Returns: ["PROJECT_NAME", "AGENCY"]
 */
export function extractVariables(content: string): string[] {
  const variableRegex = /\{([A-Z_][A-Z0-9_]*)\}/g;
  const matches = content.matchAll(variableRegex);
  const variables = new Set<string>();

  for (const match of matches) {
    variables.add(match[1]);
  }

  return Array.from(variables).sort();
}

/**
 * Replaces variable placeholders with provided values
 *
 * @param content - Template content with {VARIABLE} placeholders
 * @param values - Object mapping variable names to their values
 * @param options - Replacement options
 * @returns Content with variables replaced
 *
 * @example
 * replaceVariables(
 *   "Project: {PROJECT_NAME} for {AGENCY}",
 *   { PROJECT_NAME: "Roof Repair", AGENCY: "VA" }
 * )
 * // Returns: "Project: Roof Repair for VA"
 */
export function replaceVariables(
  content: string,
  values: TemplateVariableValues,
  options: {
    /** What to show for missing variables (default: original placeholder) */
    missingVariablePlaceholder?: 'keep' | 'empty' | 'error';
  } = {}
): string {
  const { missingVariablePlaceholder = 'keep' } = options;

  return content.replace(/\{([A-Z_][A-Z0-9_]*)\}/g, (match, varName) => {
    if (values[varName] !== undefined && values[varName] !== null) {
      return values[varName];
    }

    switch (missingVariablePlaceholder) {
      case 'empty':
        return '';
      case 'error':
        return `[MISSING: ${varName}]`;
      case 'keep':
      default:
        return match; // Keep original {VARIABLE}
    }
  });
}

/**
 * Gets default variable values for common placeholders
 * Combines standard company defaults with opportunity-specific data
 *
 * @param opportunity - Optional opportunity to extract values from
 * @returns Object with default variable values
 */
export function getDefaultVariableValues(
  opportunity?: Opportunity
): TemplateVariableValues {
  const defaults: TemplateVariableValues = {
    // Company information
    COMPANY_NAME: 'C2C Restoration LLC',
    COMPANY_FULL_NAME: 'C2C Restoration LLC',
    CERTIFICATIONS: 'Service-Disabled Veteran-Owned Small Business (SDVOSB), Veteran Business Enterprise (VBE)',
    PHONE: '(XXX) XXX-XXXX',
    EMAIL: 'contact@c2crestoration.com',
    WEBSITE: 'www.c2crestoration.com',

    // Key personnel
    OWNER_NAME: 'Phil Wright',
    ESTIMATOR_NAME: 'Blake Harkcom',

    // Standard text snippets
    YEAR_ESTABLISHED: '20XX',
    YEARS_EXPERIENCE: 'XX',

    // Placeholders that should come from opportunity
    PROJECT_NAME: opportunity?.title || '[Project Name]',
    AGENCY: opportunity?.agency || '[Agency Name]',
    SOLICITATION_NUMBER: opportunity?.solicitation_number || '[Solicitation Number]',
    LOCATION: opportunity?.location || '[Location]',
    CONTRACT_VALUE: opportunity?.estimated_value
      ? `$${opportunity.estimated_value.toLocaleString()}`
      : '[Contract Value]',
    DEADLINE: opportunity?.deadline_date || '[Deadline Date]',
    POSTED_DATE: opportunity?.posted_date || '[Posted Date]',
    NAICS_CODE: opportunity?.naics_code || '[NAICS Code]',
    SET_ASIDE: opportunity?.set_aside_type || '[Set-Aside Type]',
  };

  return defaults;
}

/**
 * Validates that all required variables in content have values
 *
 * @param content - Template content
 * @param values - Variable values to check
 * @returns Array of missing variable names
 */
export function getMissingVariables(
  content: string,
  values: TemplateVariableValues
): string[] {
  const requiredVariables = extractVariables(content);
  return requiredVariables.filter(
    varName => !values[varName] || values[varName].trim() === ''
  );
}

/**
 * Highlights variables in content for display in editor
 * Wraps {VARIABLE} patterns in <mark> tags for HTML rendering
 *
 * @param content - Template content
 * @returns HTML string with highlighted variables
 */
export function highlightVariables(content: string): string {
  return content.replace(
    /\{([A-Z_][A-Z0-9_]*)\}/g,
    '<mark class="variable-highlight">{$1}</mark>'
  );
}

/**
 * Suggests relevant variables based on template category
 *
 * @param category - Template category
 * @returns Array of suggested variable names for that category
 */
export function getSuggestedVariables(category: string): string[] {
  const suggestions: Record<string, string[]> = {
    company_info: [
      'COMPANY_NAME',
      'YEAR_ESTABLISHED',
      'YEARS_EXPERIENCE',
      'CERTIFICATIONS',
      'OWNER_NAME',
      'PHONE',
      'EMAIL',
    ],
    personnel: [
      'OWNER_NAME',
      'ESTIMATOR_NAME',
      'PROJECT_NAME',
      'AGENCY',
    ],
    past_projects: [
      'PROJECT_NAME',
      'AGENCY',
      'LOCATION',
      'CONTRACT_VALUE',
      'COMPLETION_DATE',
    ],
    safety: [
      'COMPANY_NAME',
      'OWNER_NAME',
      'PROJECT_NAME',
    ],
    quality: [
      'COMPANY_NAME',
      'PROJECT_NAME',
    ],
    capabilities: [
      'COMPANY_NAME',
      'YEARS_EXPERIENCE',
    ],
    certifications: [
      'COMPANY_NAME',
      'CERTIFICATIONS',
      'OWNER_NAME',
    ],
  };

  return suggestions[category] || [
    'COMPANY_NAME',
    'PROJECT_NAME',
    'AGENCY',
  ];
}

/**
 * Strips HTML tags from rich text content
 * Useful for preview and plain text export
 *
 * @param html - HTML content
 * @returns Plain text content
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Converts plain text to basic HTML paragraphs
 *
 * @param text - Plain text
 * @returns HTML with <p> tags
 */
export function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n');
}
