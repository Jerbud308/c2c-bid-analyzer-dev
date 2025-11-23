// ============================================================================
// Component: OpportunityTable
// ============================================================================
// Table view for displaying opportunities
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { OpportunityWithAnalysis } from '../lib/types';

interface OpportunityTableProps {
  opportunities: OpportunityWithAnalysis[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export function OpportunityTable({
  opportunities,
  selectedIds,
  onSelect,
  onSort,
  sortField,
  sortOrder,
}: OpportunityTableProps) {
  const navigate = useNavigate();

  // Select/deselect all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelect(opportunities.map(opp => opp.id));
    } else {
      onSelect([]);
    }
  };

  // Select/deselect individual
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelect([...selectedIds, id]);
    } else {
      onSelect(selectedIds.filter(existingId => existingId !== id));
    }
  };

  // Navigate to analysis page
  const handleRowClick = (opportunityId: string) => {
    navigate(`/analysis/${opportunityId}`);
  };

  // Get deadline urgency color
  const getDeadlineColor = (deadline: string | null): string => {
    if (!deadline) return 'text-gray-500';

    const daysUntil = Math.floor(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return 'text-gray-400'; // Past
    if (daysUntil < 7) return 'text-red-600'; // Urgent (< 7 days)
    if (daysUntil < 30) return 'text-yellow-600'; // Warning (< 30 days)
    return 'text-gray-700'; // Normal
  };

  // Format deadline
  const formatDeadline = (deadline: string | null): string => {
    if (!deadline) return 'N/A';

    const date = new Date(deadline);
    const daysUntil = Math.floor(
      (date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (daysUntil < 0) return `${dateStr} (Past)`;
    if (daysUntil === 0) return `${dateStr} (Today)`;
    if (daysUntil === 1) return `${dateStr} (Tomorrow)`;
    if (daysUntil < 30) return `${dateStr} (${daysUntil} days)`;
    return dateStr;
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

  // Sortable header
  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      onClick={() => onSort(field)}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={opportunities.length > 0 && selectedIds.length === opportunities.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <SortableHeader field="solicitation_number">Solicitation #</SortableHeader>
              <SortableHeader field="title">Title</SortableHeader>
              <SortableHeader field="agency">Agency</SortableHeader>
              <SortableHeader field="deadline_date">Deadline</SortableHeader>
              <SortableHeader field="fit_score">Fit Score</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No opportunities found
                </td>
              </tr>
            ) : (
              opportunities.map((opp) => (
                <tr
                  key={opp.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(opp.id)}
                >
                  <td
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(opp.id)}
                      onChange={(e) => handleSelectOne(opp.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {opp.solicitation_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={opp.title}>
                    <span className="font-semibold">{opp.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate" title={opp.agency || ''}>
                    {opp.agency || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getDeadlineColor(opp.deadline_date)}`}>
                    {formatDeadline(opp.deadline_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {opp.fit_score !== null && opp.fit_score !== undefined ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFitScoreBadgeClass(opp.fit_score)}`}>
                        {opp.fit_score}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(opp.status)}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/analysis/${opp.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
