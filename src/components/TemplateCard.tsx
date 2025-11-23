/**
 * TemplateCard Component
 * Displays a template in card format with actions
 */

import React from 'react';
import { Template, TEMPLATE_CATEGORY_LABELS, TEMPLATE_STATUS_COLORS } from '../lib/types';

interface TemplateCardProps {
  template: Template;
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onApprove?: (id: string) => void;
  currentUser?: string; // For determining if user can approve
}

/**
 * TemplateCard - Displays template summary with action buttons
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onEdit,
  onArchive,
  onApprove,
  currentUser,
}) => {
  const statusColor = TEMPLATE_STATUS_COLORS[template.status];
  const canApprove = template.status === 'draft' && onApprove && currentUser === 'Phil';

  // Truncate content for preview
  const contentPreview = template.content
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .substring(0, 150);

  return (
    <div className="template-card">
      <div className="template-card-header">
        <h3 className="template-card-title">{template.title}</h3>
        <div className="template-card-badges">
          <span className={`badge badge-${statusColor}`}>
            {template.status}
          </span>
          <span className="badge badge-category">
            {TEMPLATE_CATEGORY_LABELS[template.category]}
          </span>
        </div>
      </div>

      <div className="template-card-content">
        <p className="template-card-preview">
          {contentPreview}
          {template.content.length > 150 && '...'}
        </p>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="template-card-variables">
            <span className="template-card-label">Variables:</span>
            <div className="template-card-variable-list">
              {template.variables.slice(0, 3).map((variable) => (
                <code key={variable} className="template-variable-tag">
                  {'{' + variable + '}'}
                </code>
              ))}
              {template.variables.length > 3 && (
                <span className="template-variable-more">
                  +{template.variables.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="template-card-tags">
            {template.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="template-card-footer">
        <div className="template-card-meta">
          <span className="template-usage-count">
            Used {template.usage_count} times
          </span>
          <span className="template-version">
            v{template.version}
          </span>
        </div>

        <div className="template-card-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onPreview(template.id)}
            title="Preview template"
          >
            Preview
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(template.id)}
            title="Edit template"
          >
            Edit
          </button>

          {canApprove && (
            <button
              className="btn btn-success btn-sm"
              onClick={() => onApprove(template.id)}
              title="Approve template"
            >
              Approve
            </button>
          )}

          {template.status !== 'archived' && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onArchive(template.id)}
              title="Archive template"
            >
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * CSS Styles for TemplateCard
 * These can be moved to a separate CSS file
 */
export const templateCardStyles = `
.template-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.template-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.template-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.template-card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.template-card-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.badge-yellow {
  background: #fef3c7;
  color: #92400e;
}

.badge-green {
  background: #d1fae5;
  color: #065f46;
}

.badge-gray {
  background: #e5e7eb;
  color: #374151;
}

.badge-category {
  background: #dbeafe;
  color: #1e40af;
}

.template-card-content {
  margin-bottom: 16px;
}

.template-card-preview {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.template-card-variables {
  margin-bottom: 8px;
}

.template-card-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-right: 8px;
}

.template-card-variable-list {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.template-variable-tag {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'Monaco', 'Courier New', monospace;
  color: #dc2626;
}

.template-variable-more {
  font-size: 11px;
  color: #6b7280;
}

.template-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: #f3f4f6;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #4b5563;
}

.template-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.template-card-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.template-card-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}
`;
