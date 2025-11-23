import React, { useState, useEffect } from 'react'
import type {
  ChecklistItem,
  ChecklistCategory,
  ChecklistStatus,
  CustomChecklistItem,
  ExportFormat,
} from '../lib/types'
import { getChecklist, updateChecklistItem, addCustomItem, deleteCustomItem, exportChecklist } from '../lib/api'
import ChecklistItemRow from './ChecklistItemRow'
import AddCustomItemModal from './AddCustomItemModal'

interface ComplianceChecklistProps {
  opportunityId: string
}

type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'complete'

const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({ opportunityId }) => {
  const [checklistId, setChecklistId] = useState<string | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [customItems, setCustomItems] = useState<ChecklistItem[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ChecklistCategory>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Fetch checklist on mount
  useEffect(() => {
    loadChecklist()
  }, [opportunityId])

  const loadChecklist = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getChecklist(opportunityId)
      setChecklistId(data.checklist_id)
      setItems(data.items)
      setCustomItems(data.custom_items)
      setCompletionPercentage(data.completion_percentage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async (itemId: string, updates: Partial<ChecklistItem>) => {
    if (!checklistId) return

    // Optimistic update
    const updateItemInList = (list: ChecklistItem[]) =>
      list.map((item) => (item.id === itemId ? { ...item, ...updates } : item))

    const oldItems = items
    const oldCustomItems = customItems
    setItems(updateItemInList(items))
    setCustomItems(updateItemInList(customItems))

    try {
      await updateChecklistItem(checklistId, itemId, updates)
      // Reload to get updated completion percentage
      await loadChecklist()
    } catch (err) {
      // Revert on error
      setItems(oldItems)
      setCustomItems(oldCustomItems)
      console.error('Failed to update item:', err)
    }
  }

  const handleAddCustomItem = async (item: CustomChecklistItem) => {
    if (!checklistId) return

    await addCustomItem(checklistId, item)
    // Reload checklist
    await loadChecklist()
  }

  const handleDeleteCustomItem = async (itemId: string) => {
    if (!checklistId) return

    if (!confirm('Are you sure you want to delete this custom item?')) {
      return
    }

    // Optimistic update
    const oldCustomItems = customItems
    setCustomItems(customItems.filter((item) => item.id !== itemId))

    try {
      await deleteCustomItem(checklistId, itemId)
      // Reload to get updated completion percentage
      await loadChecklist()
    } catch (err) {
      // Revert on error
      setCustomItems(oldCustomItems)
      console.error('Failed to delete item:', err)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    if (!checklistId) return

    setExporting(true)

    try {
      const blob = await exportChecklist(checklistId, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-checklist-${opportunityId}.${format === 'pdf' ? 'html' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to export checklist:', err)
      alert('Failed to export checklist')
    } finally {
      setExporting(false)
    }
  }

  const toggleCategory = (category: ChecklistCategory) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  // Filter items
  const allItems = [...items, ...customItems]
  const filteredItems =
    filter === 'all'
      ? allItems
      : allItems.filter((item) => item.status === filter)

  // Group items by category
  const categories: ChecklistCategory[] = [
    'Administrative',
    'Technical',
    'Qualifications',
    'Pricing',
    'Certifications',
    'Insurance',
  ]

  const categoryColors: Record<ChecklistCategory, string> = {
    Administrative: 'border-blue-500',
    Technical: 'border-purple-500',
    Qualifications: 'border-green-500',
    Pricing: 'border-orange-500',
    Certifications: 'border-red-500',
    Insurance: 'border-pink-500',
  }

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = filteredItems.filter((item) => item.category === category)
    return acc
  }, {} as Record<ChecklistCategory, ChecklistItem[]>)

  const completedCount = allItems.filter((item) => item.status === 'complete').length
  const totalCount = allItems.length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading checklist...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Checklist</h2>
          <div className="flex items-center gap-4">
            {/* Completion Badge */}
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              {completedCount} of {totalCount} complete ({completionPercentage}%)
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between mt-6">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter('not_started')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'not_started'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Started ({allItems.filter((i) => i.status === 'not_started').length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({allItems.filter((i) => i.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('complete')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'complete'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complete ({completedCount})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              + Add Custom Item
            </button>

            {/* Export Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Items by Category */}
      {categories.map((category) => {
        const categoryItems = groupedItems[category]
        if (categoryItems.length === 0) return null

        const isCollapsed = collapsedCategories.has(category)

        return (
          <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className={`w-full flex items-center justify-between p-4 border-l-4 ${categoryColors[category]} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isCollapsed ? 'transform -rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              </div>
              <span className="text-sm text-gray-600">
                {categoryItems.filter((i) => i.status === 'complete').length} / {categoryItems.length}
              </span>
            </button>

            {/* Category Items */}
            {!isCollapsed && (
              <div className="p-4 space-y-3">
                {categoryItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={item.source === 'custom' ? handleDeleteCustomItem : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No items match the selected filter.</p>
        </div>
      )}

      {/* Add Custom Item Modal */}
      <AddCustomItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCustomItem}
      />
    </div>
  )
}

export default ComplianceChecklist
