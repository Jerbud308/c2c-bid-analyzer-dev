import React, { useState } from 'react'
import type { ChecklistItem, ChecklistStatus, ResponsibleParty } from '../lib/types'

interface ChecklistItemRowProps {
  item: ChecklistItem
  onUpdate: (itemId: string, updates: Partial<ChecklistItem>) => void
  onDelete?: (itemId: string) => void
  readOnly?: boolean
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  item,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const handleStatusChange = (status: ChecklistStatus) => {
    onUpdate(item.id, { status })
  }

  const handleResponsiblePartyChange = (responsible_party: ResponsibleParty) => {
    onUpdate(item.id, { responsible_party })
  }

  const handleNotesBlur = () => {
    setIsEditingNotes(false)
    if (notes !== item.notes) {
      onUpdate(item.id, { notes })
    }
  }

  const getStatusIcon = () => {
    switch (item.status) {
      case 'complete':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'in_progress':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
          </svg>
        )
    }
  }

  const isCustomItem = item.source === 'custom'

  return (
    <div
      className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
        item.status === 'complete'
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-300 hover:border-blue-400'
      }`}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>

      {/* Main Content */}
      <div className="flex-grow min-w-0">
        {/* Description */}
        <div
          className={`text-sm font-medium ${
            item.status === 'complete' ? 'line-through text-gray-500' : 'text-gray-900'
          }`}
        >
          {item.description}
        </div>

        {/* Reference Section Badge */}
        {item.reference_section && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
            {item.reference_section}
          </span>
        )}

        {/* Notes Section */}
        {(isEditingNotes || item.notes) && (
          <div className="mt-2">
            {isEditingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                disabled={readOnly}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Add notes..."
                autoFocus
              />
            ) : (
              <div
                onClick={() => !readOnly && setIsEditingNotes(true)}
                className="text-sm text-gray-600 cursor-text hover:bg-gray-50 rounded px-2 py-1"
              >
                {item.notes || 'Click to add notes...'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex flex-col gap-2" style={{ minWidth: '180px' }}>
        {/* Status Dropdown */}
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(e.target.value as ChecklistStatus)}
          disabled={readOnly}
          className={`text-xs border rounded px-2 py-1 ${
            item.status === 'complete'
              ? 'bg-green-50 border-green-300 text-green-800'
              : item.status === 'in_progress'
              ? 'bg-orange-50 border-orange-300 text-orange-800'
              : 'bg-white border-gray-300 text-gray-700'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>

        {/* Assigned To Dropdown */}
        <select
          value={item.responsible_party || ''}
          onChange={(e) =>
            handleResponsiblePartyChange(
              (e.target.value || null) as ResponsibleParty
            )
          }
          disabled={readOnly}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Unassigned</option>
          <option value="Blake">Blake</option>
          <option value="Phil">Phil</option>
        </select>

        {/* Action Buttons */}
        <div className="flex gap-1">
          {!isEditingNotes && !readOnly && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="flex-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              title="Add/Edit Notes"
            >
              Notes
            </button>
          )}

          {isCustomItem && onDelete && !readOnly && (
            <button
              onClick={() => onDelete(item.id)}
              className="flex-1 text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
              title="Delete Custom Item"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChecklistItemRow
