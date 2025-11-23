/**
 * TemplateEditor Component
 * Create or edit template with rich text editor and variable insertion
 */

import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Template,
  TemplateCategory,
  TEMPLATE_CATEGORY_LABELS,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '../lib/types';
import {
  extractVariables,
  getSuggestedVariables,
} from '../lib/templateHelpers';
import { api } from '../lib/api';

interface TemplateEditorProps {
  templateId?: string;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

/**
 * TemplateEditor - Rich text editor for creating/editing templates
 */
export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templateId,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('company_info');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [changeNotes, setChangeNotes] = useState('');

  // Editor state
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [showVariableHelper, setShowVariableHelper] = useState(false);

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  // Update detected variables when content changes
  useEffect(() => {
    const variables = extractVariables(content);
    setDetectedVariables(variables);
  }, [content]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const template = await api.getTemplate(templateId!);
      setTitle(template.title);
      setCategory(template.category);
      setContent(template.content);
      setTags(template.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!content.trim()) {
        throw new Error('Content is required');
      }

      let savedTemplate: Template;

      if (templateId) {
        // Update existing template
        const updates: UpdateTemplateInput = {
          title: title.trim(),
          category,
          content: content.trim(),
          tags,
          change_notes: changeNotes || 'Updated template',
        };
        savedTemplate = await api.updateTemplate(templateId, updates);
      } else {
        // Create new template
        const input: CreateTemplateInput = {
          title: title.trim(),
          category,
          content: content.trim(),
          tags,
          status: 'draft',
        };
        savedTemplate = await api.createTemplate(input);
      }

      onSave(savedTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setContent(prev => prev + `{${variable}}`);
  };

  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const suggestedVariables = getSuggestedVariables(category);

  if (loading) {
    return <div className="template-editor-loading">Loading template...</div>;
  }

  return (
    <div className="template-editor">
      <div className="template-editor-header">
        <h2>{templateId ? 'Edit Template' : 'Create New Template'}</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="template-editor-form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Company Overview (Short)"
            required
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as TemplateCategory)}
            required
          >
            {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <div className="tags-input-wrapper">
            <div className="tags-list">
              {tags.map((tag) => (
                <span key={tag} className="tag tag-removable">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tags-input-group">
              <input
                id="tags"
                type="text"
                className="form-input form-input-sm"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags (e.g., roofing, federal, Florida)"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-secondary btn-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="form-group">
          <div className="editor-header">
            <label>Content *</label>
            <button
              type="button"
              onClick={() => setShowVariableHelper(!showVariableHelper)}
              className="btn btn-secondary btn-sm"
            >
              {showVariableHelper ? 'Hide' : 'Show'} Variable Helper
            </button>
          </div>

          <div className="editor-container">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Enter template content here... Use {VARIABLE_NAME} for placeholders."
            />
          </div>

          {/* Detected Variables */}
          {detectedVariables.length > 0 && (
            <div className="detected-variables">
              <strong>Detected Variables:</strong>
              {detectedVariables.map((variable) => (
                <code key={variable} className="variable-tag">
                  {'{' + variable + '}'}
                </code>
              ))}
            </div>
          )}
        </div>

        {/* Variable Helper */}
        {showVariableHelper && (
          <div className="variable-helper">
            <h4>Suggested Variables for {TEMPLATE_CATEGORY_LABELS[category]}</h4>
            <p className="helper-text">Click to insert into content</p>
            <div className="variable-buttons">
              {suggestedVariables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="btn btn-outline btn-sm"
                >
                  {'{' + variable + '}'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Change Notes (for updates only) */}
        {templateId && (
          <div className="form-group">
            <label htmlFor="changeNotes">Change Notes</label>
            <input
              id="changeNotes"
              type="text"
              className="form-input"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="What changed in this version?"
            />
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Quill editor configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
];

/**
 * CSS Styles for TemplateEditor
 */
export const templateEditorStyles = `
.template-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.template-editor-header h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 600;
}

.template-editor-loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

.template-editor-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input-sm {
  padding: 6px 10px;
  font-size: 13px;
}

.tags-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
}

.tag-removable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 12px;
  font-size: 12px;
}

.tag-remove {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.tag-remove:hover {
  color: #ef4444;
}

.tags-input-group {
  display: flex;
  gap: 8px;
}

.tags-input-group .form-input {
  flex: 1;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.editor-container {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.editor-container .quill {
  min-height: 300px;
}

.detected-variables {
  margin-top: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.detected-variables strong {
  display: block;
  margin-bottom: 8px;
  color: #374151;
}

.variable-tag {
  display: inline-block;
  margin: 0 6px 6px 0;
  padding: 3px 6px;
  background: #fef3c7;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  color: #92400e;
}

.variable-helper {
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
}

.variable-helper h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #075985;
}

.helper-text {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #0369a1;
}

.variable-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-outline {
  background: white;
  border: 1px solid #3b82f6;
  color: #3b82f6;
}

.btn-outline:hover {
  background: #eff6ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
`;
