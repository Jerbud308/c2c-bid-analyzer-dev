import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileText,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  Wrench,
  CheckSquare,
  Award,
  Clock,
  Shield,
  DollarSign,
  MapPinned,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle as AlertCircleIcon,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import { getAnalysis } from '@/lib/api'
import type { AnalysisResponse } from '@/types'
import { CollapsibleSection } from './CollapsibleSection'

export function AnalysisResults() {
  const { opportunityId } = useParams<{ opportunityId: string }>()

  const [data, setData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!opportunityId) return

    const fetchData = async () => {
      try {
        const result = await getAnalysis(opportunityId)
        setData(result)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis')
        setLoading(false)
      }
    }

    fetchData()
  }, [opportunityId])

  const getFitScoreColor = (score: number | null): string => {
    if (score === null) return 'bg-gray-100 text-gray-800'
    if (score >= 80) return 'bg-success-100 text-success-800'
    if (score >= 60) return 'bg-warning-100 text-warning-800'
    return 'bg-danger-100 text-danger-800'
  }

  const getConfidenceBadgeColor = (confidence: string | null): string => {
    if (confidence === 'high') return 'bg-success-100 text-success-800'
    if (confidence === 'medium') return 'bg-warning-100 text-warning-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getQualificationIcon = (status: string) => {
    if (status === 'met') return <CheckCircle className="w-5 h-5 text-success-600" />
    if (status === 'not_met') return <XCircle className="w-5 h-5 text-danger-600" />
    return <AlertCircleIcon className="w-5 h-5 text-warning-600" />
  }

  const getQualificationBgColor = (status: string): string => {
    if (status === 'met') return 'bg-success-50 border-success-200'
    if (status === 'not_met') return 'bg-danger-50 border-danger-200'
    return 'bg-warning-50 border-warning-200'
  }

  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return 'Not specified'
    try {
      const date = new Date(deadline)
      const daysAway = formatDistanceToNow(date, { addSuffix: true })
      const formatted = format(date, 'MMM d, yyyy')
      return `${formatted} (${daysAway})`
    } catch {
      return deadline
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-title h-12 w-2/3"></div>
        <div className="skeleton h-32"></div>
        <div className="skeleton h-64"></div>
        <div className="skeleton h-64"></div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analysis</h2>
          <p className="text-gray-600">{error || 'Failed to load analysis results'}</p>
        </div>
      </div>
    )
  }

  const { opportunity, analysis } = data

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {opportunity.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {opportunity.solicitation_number && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
                    {opportunity.solicitation_number}
                  </span>
                </div>
              )}
              {opportunity.agency && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{opportunity.agency}</span>
                </div>
              )}
              {opportunity.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{opportunity.location}</span>
                </div>
              )}
              {opportunity.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{formatDeadline(opportunity.deadline)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fit Score Badge */}
          {analysis?.fit_score !== null && analysis?.fit_score !== undefined && (
            <div className="flex flex-col items-center lg:items-end">
              <div
                className={clsx(
                  'w-32 h-32 rounded-full flex items-center justify-center border-4',
                  getFitScoreColor(analysis.fit_score)
                )}
              >
                <div className="text-center">
                  <div className="text-4xl font-bold">{analysis.fit_score}</div>
                  <div className="text-xs font-semibold uppercase">Fit Score</div>
                </div>
              </div>
              {analysis.fit_score_confidence && (
                <span
                  className={clsx(
                    'mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    getConfidenceBadgeColor(analysis.fit_score_confidence)
                  )}
                >
                  {analysis.fit_score_confidence} confidence
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Red Flags Alert */}
      {analysis?.red_flags && analysis.red_flags.length > 0 && (
        <div className="bg-danger-50 border-2 border-danger-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-danger-900 mb-3">Red Flags Identified</h3>
              <ul className="space-y-2">
                {analysis.red_flags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-danger-600 font-bold">•</span>
                    <span className="text-danger-800">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Scope Summary */}
      {analysis?.scope_summary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Project Scope</h2>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{analysis.scope_summary}</p>
          </div>
        </div>
      )}

      {/* Technical Requirements */}
      {data.technical_requirements.length > 0 && (
        <CollapsibleSection
          title="Technical Requirements"
          icon={<Wrench className="w-6 h-6" />}
          count={data.technical_requirements.length}
        >
          <div className="space-y-3">
            {data.technical_requirements.map((req) => (
              <div key={req.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-100 text-primary-800">
                    {req.category}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900">{req.requirement}</p>
                    {req.reference_section && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reference: {req.reference_section}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Submission Requirements */}
      {data.submission_requirements.length > 0 && (
        <CollapsibleSection
          title="Submission Requirements"
          icon={<CheckSquare className="w-6 h-6" />}
          count={data.submission_requirements.length}
        >
          <div className="space-y-3">
            {data.submission_requirements.map((req) => (
              <div key={req.id} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{req.item_name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    {req.format && <span>Format: {req.format}</span>}
                    {req.due_date && <span>Due: {format(new Date(req.due_date), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Qualifications Required */}
      {data.qualifications.length > 0 && (
        <CollapsibleSection
          title="Qualifications Required"
          icon={<Award className="w-6 h-6" />}
          count={data.qualifications.length}
          defaultExpanded={true}
        >
          <div className="space-y-3">
            {data.qualifications.map((qual) => (
              <div
                key={qual.id}
                className={clsx(
                  'rounded-lg p-4 border',
                  getQualificationBgColor(qual.status)
                )}
              >
                <div className="flex items-start gap-3">
                  {getQualificationIcon(qual.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-300">
                        {qual.type}
                      </span>
                    </div>
                    <p className="text-gray-900">{qual.requirement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Timeline & Schedule */}
      {data.timeline && (
        <CollapsibleSection
          title="Timeline & Schedule"
          icon={<Clock className="w-6 h-6" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.timeline.start_date && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Start Date</p>
                  <p className="text-gray-900">
                    {format(new Date(data.timeline.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              {data.timeline.duration && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                  <p className="text-gray-900">{data.timeline.duration}</p>
                </div>
              )}
            </div>
            {data.timeline.milestones && data.timeline.milestones.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Milestones</p>
                <ul className="list-disc list-inside space-y-1">
                  {data.timeline.milestones.map((milestone, index) => (
                    <li key={index} className="text-gray-700">
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Insurance & Bonding */}
      {data.insurance && (
        <CollapsibleSection
          title="Insurance & Bonding"
          icon={<Shield className="w-6 h-6" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.insurance.general_liability && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">General Liability</p>
                <p className="text-gray-900">{data.insurance.general_liability}</p>
              </div>
            )}
            {data.insurance.workers_comp && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Workers Compensation</p>
                <p className="text-gray-900">{data.insurance.workers_comp}</p>
              </div>
            )}
            {data.insurance.professional_liability && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Professional Liability</p>
                <p className="text-gray-900">{data.insurance.professional_liability}</p>
              </div>
            )}
            {data.insurance.bonding_required && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Bonding Required</p>
                <p className="text-gray-900">
                  {data.insurance.bond_amount || 'Yes'}
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Pricing Structure */}
      {data.pricing && (
        <CollapsibleSection
          title="Pricing Structure"
          icon={<DollarSign className="w-6 h-6" />}
        >
          <div className="space-y-4">
            {data.pricing.structure_type && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Structure Type</p>
                <p className="text-gray-900">{data.pricing.structure_type}</p>
              </div>
            )}
            {data.pricing.line_items && data.pricing.line_items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Line Items</p>
                <ul className="list-disc list-inside space-y-1">
                  {data.pricing.line_items.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.pricing.payment_terms && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Payment Terms</p>
                <p className="text-gray-900">{data.pricing.payment_terms}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Site Conditions */}
      {data.site_conditions.length > 0 && (
        <CollapsibleSection
          title="Site Conditions"
          icon={<MapPinned className="w-6 h-6" />}
          count={data.site_conditions.length}
        >
          <div className="space-y-3">
            {data.site_conditions.map((condition) => (
              <div key={condition.id} className="text-gray-700">
                {condition.description}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Questions Flagged */}
      {data.questions.length > 0 && (
        <CollapsibleSection
          title="Questions Flagged for Clarification"
          icon={<HelpCircle className="w-6 h-6" />}
          count={data.questions.length}
          defaultExpanded={true}
        >
          <div className="space-y-3">
            {data.questions.map((question, index) => (
              <div key={question.id} className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warning-600 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-gray-900">{question.question}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-success text-white font-medium rounded-lg hover:bg-success-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success">
            <ThumbsUp className="w-5 h-5" />
            Mark as: Pursue
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-400 text-white font-medium rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
            <ThumbsDown className="w-5 h-5" />
            Mark as: Pass
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        {opportunity.page_count && (
          <span>Processed {opportunity.page_count} pages</span>
        )}
        {opportunity.created_at && (
          <span className="ml-2">
            • Analyzed on {format(new Date(opportunity.created_at), 'MMM d, yyyy')}
          </span>
        )}
      </div>
    </div>
  )
}
