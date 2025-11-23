/**
 * TemplatePreview Component
 * Modal for previewing template with variable substitution
 */

import React, { useState, useEffect } from 'react';
import { Template, TemplateVariableValues, Opportunity } from '../lib/types';
import { getDefaultVariableValues, replaceVariables } from '../lib/templateHelpers';
import { api } from '../lib/api';

interface TemplatePreviewProps {
  template: Template;
  opportunity?: Opportunity;
  onClose: () => void;
  onUse?: (template: Template) => void;
}

/**
 * TemplatePreview - Modal for previewing and testing templates
 */
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  opportunity,
  onClose,
  onUse,
}) => {
  const [variableValues, setVariableValues] = useState<TemplateVariableValues>({});
  const [previewContent, setPreviewContent] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Initialize variable values with defaults
  useEffect(() => {
    const defaults = getDefaultVariableValues(opportunity);
    setVariableValues(defaults);
  }, [opportunity]);

  // Update preview when variables change
  useEffect(() => {
    const processed = replaceVariables(template.content, variableValues, {
      missingVariablePlaceholder: 'keep',
    });
    setPreviewContent(processed);
  }, [template.content, variableValues]);

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues({
      ...variableValues,
      [varName]: value,
    });
  };

  const loadVersionHistory = async () => {
    try {
      setLoadingVersions(true);
      const response = await api.getTemplateVersions(template.id);
      setVersions(response.versions);
      setShowVersions(true);
    } catch (error) {
      console.error('Failed to load version history:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleUseTemplate = () => {
    // Increment usage count
    api.incrementTemplateUsage(template.id).catch(console.error);

    if (onUse) {
      onUse(template);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{template.title}</h2>
            <div className="template-meta">
              <span className="meta-item">Version {template.version}</span>
              <span className="meta-item">Used {template.usage_count} times</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Variable Input Form */}
          {template.variables.length > 0 && (
            <div className="variables-section">
              <h3>Variables</h3>
              <p className="section-description">
                Fill in values to see live preview below
              </p>
              <div className="variables-grid">
                {template.variables.map((varName) => (
                  <div key={varName} className="variable-input-group">
                    <label htmlFor={`var-${varName}`}>
                      {'{' + varName + '}'}
                    </label>
                    <input
                      id={`var-${varName}`}
                      type="text"
                      className="form-input"
                      value={variableValues[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      placeholder={`Enter ${varName.toLowerCase().replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="preview-section">
            <h3>Preview</h3>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>

          {/* Version History */}
          <div className="versions-section">
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadVersionHistory}
              disabled={loadingVersions}
            >
              {showVersions ? 'Hide' : 'Show'} Version History
            </button>

            {showVersions && (
              <div className="versions-list">
                {versions.length === 0 ? (
                  <p className="no-versions">No previous versions</p>
                ) : (
                  versions.map((version) => (
                    <div key={version.id} className="version-item">
                      <div className="version-header">
                        <strong>Version {version.version}</strong>
                        <span className="version-date">
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {version.change_notes && (
                        <p className="version-notes">{version.change_notes}</p>
                      )}
                      {version.created_by && (
                        <p className="version-author">By: {version.created_by}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {onUse && (
            <button className="btn btn-primary" onClick={handleUseTemplate}>
              Use This Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * CSS Styles for TemplatePreview
 */
export const templatePreviewStyles = `
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow: auto;
  width: 100%;
}

.template-preview-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.template-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
}

.meta-item {
  display: flex;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-close:hover {
  color: #4b5563;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.variables-section h3,
.preview-section h3,
.versions-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.section-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #6b7280;
}

.variables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.variable-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variable-input-group label {
  font-size: 13px;
  font-weight: 600;
  font-family: 'Monaco', 'Courier New', monospace;
  color: #dc2626;
}

.preview-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 20px;
  min-height: 200px;
  line-height: 1.6;
}

.preview-content p {
  margin: 0 0 12px 0;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  margin: 20px 0 12px 0;
  font-weight: 600;
}

.preview-content h1 {
  font-size: 24px;
}

.preview-content h2 {
  font-size: 20px;
}

.preview-content h3 {
  font-size: 18px;
}

.preview-content ul,
.preview-content ol {
  margin: 0 0 12px 0;
  padding-left: 24px;
}

.preview-content li {
  margin-bottom: 6px;
}

.versions-section {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.versions-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.version-header strong {
  color: #111827;
  font-size: 14px;
}

.version-date {
  font-size: 13px;
  color: #6b7280;
}

.version-notes {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #4b5563;
}

.version-author {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.no-versions {
  margin: 0;
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}
`;
