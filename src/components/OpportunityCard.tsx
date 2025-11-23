// ============================================================================
// Component: OpportunityCard
// ============================================================================
// Card view for displaying a single opportunity
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { OpportunityWithAnalysis } from '../lib/types';

interface OpportunityCardProps {
  opportunity: OpportunityWithAnalysis;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

export function OpportunityCard({ opportunity, selected, onSelect }: OpportunityCardProps) {
  const navigate = useNavigate();

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline: string | null): number | null => {
    if (!deadline) return null;
    return Math.floor(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Get deadline display text
  const getDeadlineText = (deadline: string | null): string => {
    const days = getDaysUntilDeadline(deadline);
    if (days === null) return 'No deadline';
    if (days < 0) return 'Past due';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  // Get deadline color
  const getDeadlineColor = (deadline: string | null): string => {
    const days = getDaysUntilDeadline(deadline);
    if (days === null || days < 0) return 'text-gray-500';
    if (days < 7) return 'text-red-600';
    if (days < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get fit score badge color
  const getFitScoreBadgeClass = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string): string => {
    const classes: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      analyzing: 'bg-purple-100 text-purple-800',
      reviewed: 'bg-cyan-100 text-cyan-800',
      bidding: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-indigo-100 text-indigo-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      pass: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCardClick = () => {
    navigate(`/analysis/${opportunity.id}`);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-4 right-4" onClick={handleCheckboxClick}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(opportunity.id, e.target.checked)}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 pr-8 line-clamp-2">
        {opportunity.title}
      </h3>

      {/* Agency and Location */}
      <div className="text-sm text-gray-600 mb-4">
        <p className="truncate">{opportunity.agency || 'Unknown Agency'}</p>
        {opportunity.location && (
          <p className="truncate">{opportunity.location}</p>
        )}
      </div>

      {/* Deadline */}
      <div className={`mb-4 ${getDeadlineColor(opportunity.deadline_date)}`}>
        <p className="text-sm font-medium">
          ⏰ {getDeadlineText(opportunity.deadline_date)}
        </p>
        {opportunity.deadline_date && (
          <p className="text-xs mt-1">
            {new Date(opportunity.deadline_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Fit Score and Status */}
      <div className="flex items-center gap-2">
        {opportunity.fit_score !== null && opportunity.fit_score !== undefined ? (
          <span className={`px-3 py-1 text-sm font-bold rounded-full ${getFitScoreBadgeClass(opportunity.fit_score)}`}>
            Fit: {opportunity.fit_score}
          </span>
        ) : (
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            Not analyzed
          </span>
        )}
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(opportunity.status)}`}>
          {opportunity.status}
        </span>
      </div>

      {/* Additional Info */}
      {opportunity.estimated_value && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Est. Value:{' '}
            <span className="font-semibold">
              ${opportunity.estimated_value.toLocaleString('en-US')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Card Grid Container
// ----------------------------------------------------------------------------

interface OpportunityCardGridProps {
  opportunities: OpportunityWithAnalysis[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
}

export function OpportunityCardGrid({
  opportunities,
  selectedIds,
  onSelect,
}: OpportunityCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {opportunities.length === 0 ? (
        <div className="col-span-full py-12 text-center text-gray-500">
          No opportunities found
        </div>
      ) : (
        opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            selected={selectedIds.includes(opp.id)}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
