/**
 * TemplateLibrary Component
 * Main template management interface with search, filter, and CRUD operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Template,
  TemplateCategory,
  TemplateStatus,
  TemplateFilters,
  TEMPLATE_CATEGORY_LABELS,
} from '../lib/types';
import { api } from '../lib/api';
import { TemplateCard } from './TemplateCard';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';

/**
 * TemplateLibrary - Main template management page
 */
export const TemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<Set<TemplateCategory>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<TemplateStatus | 'all'>('approved');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Current user (in production, get from auth context)
  const currentUser = 'Phil'; // TODO: Get from auth

  // All available tags (extracted from templates)
  const [allTags, setAllTags] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load templates when filters change
  useEffect(() => {
    loadTemplates();
  }, [selectedCategories, selectedStatus, selectedTags, debouncedSearchTerm]);

  // Extract all unique tags from templates
  useEffect(() => {
    const tags = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tags.add(tag));
    });
    setAllTags(Array.from(tags).sort());
  }, [templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: TemplateFilters = {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: debouncedSearchTerm || undefined,
      };

      // Only apply category filter if categories are selected
      if (selectedCategories.size === 1) {
        filters.category = Array.from(selectedCategories)[0];
      }

      // Only apply tags filter if tags are selected
      if (selectedTags.size > 0) {
        filters.tags = Array.from(selectedTags);
      }

      const data = await api.getTemplates(filters);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: TemplateCategory) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSelectedStatus('approved');
    setSelectedTags(new Set());
    setSearchTerm('');
  };

  const handleCreateNew = () => {
    setEditingTemplateId(undefined);
    setShowEditor(true);
  };

  const handleEdit = (templateId: string) => {
    setEditingTemplateId(templateId);
    setShowEditor(true);
  };

  const handlePreview = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setPreviewTemplate(template);
    }
  };

  const handleArchive = async (templateId: string) => {
    if (!confirm('Are you sure you want to archive this template?')) {
      return;
    }

    try {
      await api.archiveTemplate(templateId);
      loadTemplates(); // Reload list
    } catch (err) {
      alert('Failed to archive template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleApprove = async (templateId: string) => {
    try {
      await api.approveTemplate(templateId, currentUser);
      loadTemplates(); // Reload list
    } catch (err) {
      alert('Failed to approve template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSaveTemplate = (template: Template) => {
    setShowEditor(false);
    setEditingTemplateId(undefined);
    loadTemplates(); // Reload list
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setEditingTemplateId(undefined);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const activeFilterCount =
    selectedCategories.size +
    selectedTags.size +
    (selectedStatus !== 'approved' ? 1 : 0) +
    (searchTerm ? 1 : 0);

  return (
    <div className="template-library">
      {/* Header */}
      <div className="library-header">
        <div>
          <h1>Template Library</h1>
          <p className="library-description">
            Manage reusable content templates for bid responses
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + Create New Template
        </button>
      </div>

      <div className="library-content">
        {/* Sidebar Filters */}
        <aside className="library-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>Filters</h3>
              {activeFilterCount > 0 && (
                <button className="btn-link" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Search */}
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label>Status</label>
              <div className="filter-options">
                {(['all', 'draft', 'approved', 'archived'] as const).map((status) => (
                  <label key={status} className="filter-option">
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === status}
                      onChange={() => setSelectedStatus(status)}
                    />
                    <span>{status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <label>Category</label>
              <div className="filter-options">
                {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
                  <label key={value} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(value as TemplateCategory)}
                      onChange={() => toggleCategory(value as TemplateCategory)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tag Cloud */}
            {allTags.length > 0 && (
              <div className="filter-group">
                <label>Tags</label>
                <div className="tag-cloud">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-cloud-item ${selectedTags.has(tag) ? 'active' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="library-main">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <h3>No templates found</h3>
              <p>
                {activeFilterCount > 0
                  ? 'Try adjusting your filters or search term'
                  : 'Create your first template to get started'}
              </p>
              <button className="btn btn-primary" onClick={handleCreateNew}>
                Create Template
              </button>
            </div>
          ) : (
            <>
              <div className="results-header">
                <p className="results-count">
                  {templates.length} template{templates.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="templates-grid">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onApprove={handleApprove}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <TemplateEditor
              templateId={editingTemplateId}
              onSave={handleSaveTemplate}
              onCancel={handleCancelEditor}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={handleClosePreview}
          onUse={(template) => {
            console.log('Using template:', template.id);
            // TODO: Implement template insertion into bid response
          }}
        />
      )}
    </div>
  );
};

/**
 * CSS Styles for TemplateLibrary
 */
export const templateLibraryStyles = `
.template-library {
  min-height: 100vh;
  background: #f9fafb;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.library-header h1 {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.library-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.library-content {
  display: flex;
  min-height: calc(100vh - 100px);
}

.library-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 24px;
  overflow-y: auto;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.btn-link {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group > label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
}

.filter-option input {
  cursor: pointer;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-cloud-item {
  background: #f3f4f6;
  border: 1px solid transparent;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-cloud-item:hover {
  background: #e5e7eb;
}

.tag-cloud-item.active {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.library-main {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.results-header {
  margin-bottom: 16px;
}

.results-count {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #111827;
}

.empty-state p {
  margin: 0 0 20px 0;
  color: #6b7280;
}

.modal-large {
  max-width: 1000px;
}

@media (max-width: 1024px) {
  .library-content {
    flex-direction: column;
  }

  .library-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }
}
`;
