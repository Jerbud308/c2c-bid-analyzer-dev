/**
 * NotificationPreferences Component
 *
 * Allows users to manage their email notification settings including:
 * - Toggle notifications on/off for different event types
 * - Configure daily digest time
 * - Set deadline reminder days
 * - Test notifications
 * - View notification history
 */

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { NotificationPreferences as NotificationPrefsType, NotificationLog } from '../lib/types';

interface NotificationPreferencesProps {
  /** User's email address */
  userEmail: string;
  /** Optional callback when preferences are saved */
  onSave?: (preferences: NotificationPrefsType) => void;
}

export function NotificationPreferences({ userEmail, onSave }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPrefsType | null>(null);
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preferences' | 'history'>('preferences');
  const [testingNotification, setTestingNotification] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
    loadHistory();
  }, [userEmail]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await api.getNotificationPreferences(userEmail);
      setPreferences(prefs);
    } catch (err: any) {
      console.error('Failed to load preferences:', err);
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const logs = await api.getNotificationHistory(userEmail, 20);
      setHistory(logs);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      // Don't show error for history - it's not critical
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await api.updateNotificationPreferences(userEmail, {
        user_name: preferences.user_name,
        notify_analysis_complete: preferences.notify_analysis_complete,
        notify_processing_failed: preferences.notify_processing_failed,
        notify_deadline_reminders: preferences.notify_deadline_reminders,
        notify_daily_digest: preferences.notify_daily_digest,
        notify_status_change: preferences.notify_status_change,
        digest_time: preferences.digest_time,
        deadline_reminder_days: preferences.deadline_reminder_days,
      });

      setPreferences(updated);
      setSuccessMessage('Preferences saved successfully!');
      onSave?.(updated);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTestingNotification(true);
      setError(null);
      setSuccessMessage(null);

      await api.sendTestNotification(userEmail, 'analysis_complete');
      setSuccessMessage(`Test email sent to ${userEmail}!`);

      // Refresh history to show the test email
      setTimeout(() => loadHistory(), 2000);
    } catch (err: any) {
      console.error('Failed to send test:', err);
      setError(err.message || 'Failed to send test notification');
    } finally {
      setTestingNotification(false);
    }
  };

  const togglePreference = (key: keyof NotificationPrefsType, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'analysis_complete': '✅',
      'processing_failed': '❌',
      'deadline_reminder': '⏰',
      'daily_digest': '📊',
      'status_change': '📋',
    };
    return icons[type] || '📧';
  };

  if (loading) {
    return (
      <div className="notification-preferences loading">
        <div className="spinner"></div>
        <p>Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="notification-preferences error">
        <p>{error || 'No preferences found for this user'}</p>
        <button onClick={loadPreferences}>Retry</button>
      </div>
    );
  }

  return (
    <div className="notification-preferences">
      <div className="header">
        <h2>Email Notifications</h2>
        <p className="subtitle">Manage how and when you receive email notifications</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Settings
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({history.length})
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="preferences-content">
          {/* User Info */}
          <div className="section">
            <label htmlFor="user_name">Display Name</label>
            <input
              id="user_name"
              type="text"
              value={preferences.user_name || ''}
              onChange={(e) => togglePreference('user_name', e.target.value)}
              placeholder="Enter your name"
            />
            <p className="help-text">Used in email greetings</p>
          </div>

          {/* Notification Types */}
          <div className="section">
            <h3>Notification Types</h3>
            <p className="section-description">Choose which events trigger email notifications</p>

            <div className="toggle-list">
              <div className="toggle-item">
                <div className="toggle-info">
                  <label>✅ Analysis Complete</label>
                  <p>Get notified when AI analysis finishes processing a bid document</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_analysis_complete}
                  onChange={(e) => togglePreference('notify_analysis_complete', e.target.checked)}
                  className="toggle"
                />
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <label>❌ Processing Failed</label>
                  <p>Get notified if document processing encounters an error</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_processing_failed}
                  onChange={(e) => togglePreference('notify_processing_failed', e.target.checked)}
                  className="toggle"
                />
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <label>⏰ Deadline Reminders</label>
                  <p>Get reminded before bid deadlines approach</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_deadline_reminders}
                  onChange={(e) => togglePreference('notify_deadline_reminders', e.target.checked)}
                  className="toggle"
                />
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <label>📊 Daily Digest</label>
                  <p>Receive a daily summary of new opportunities</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_daily_digest}
                  onChange={(e) => togglePreference('notify_daily_digest', e.target.checked)}
                  className="toggle"
                />
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <label>📋 Status Changes</label>
                  <p>Get notified when opportunity status changes (e.g., won, lost)</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_status_change}
                  onChange={(e) => togglePreference('notify_status_change', e.target.checked)}
                  className="toggle"
                />
              </div>
            </div>
          </div>

          {/* Daily Digest Settings */}
          {preferences.notify_daily_digest && (
            <div className="section">
              <h3>Daily Digest Settings</h3>
              <label htmlFor="digest_time">Delivery Time (EST)</label>
              <input
                id="digest_time"
                type="time"
                value={preferences.digest_time}
                onChange={(e) => togglePreference('digest_time', e.target.value)}
              />
              <p className="help-text">When should we send your daily digest?</p>
            </div>
          )}

          {/* Deadline Reminder Settings */}
          {preferences.notify_deadline_reminders && (
            <div className="section">
              <h3>Deadline Reminder Settings</h3>
              <label>Remind me this many days before the deadline:</label>
              <div className="reminder-days">
                {[7, 5, 3, 2, 1].map((day) => (
                  <label key={day} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.deadline_reminder_days.includes(day)}
                      onChange={(e) => {
                        const newDays = e.target.checked
                          ? [...preferences.deadline_reminder_days, day].sort((a, b) => b - a)
                          : preferences.deadline_reminder_days.filter((d) => d !== day);
                        togglePreference('deadline_reminder_days', newDays);
                      }}
                    />
                    {day} day{day !== 1 ? 's' : ''}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="actions">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>

            <button
              onClick={handleTestNotification}
              disabled={testingNotification}
              className="btn btn-secondary"
            >
              {testingNotification ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          <div className="section">
            <h3>Recent Notifications</h3>
            {history.length === 0 ? (
              <p className="empty-state">No notifications sent yet</p>
            ) : (
              <div className="notification-list">
                {history.map((log) => (
                  <div key={log.id} className={`notification-item status-${log.status}`}>
                    <div className="notification-icon">
                      {getNotificationIcon(log.notification_type)}
                    </div>
                    <div className="notification-details">
                      <div className="notification-type">{log.notification_type.replace(/_/g, ' ')}</div>
                      <div className="notification-meta">
                        {formatDate(log.sent_at)} • {log.status}
                      </div>
                      {log.error_message && (
                        <div className="notification-error">{log.error_message}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Styles - In production, move to a separate CSS file */}
      <style>{`
        .notification-preferences {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h2 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          color: #1f2937;
        }

        .subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .tab:hover {
          color: #2563eb;
        }

        .tab.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .section {
          margin-bottom: 32px;
        }

        .section h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .section-description {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .section label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .section input[type="text"],
        .section input[type="time"] {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
        }

        .help-text {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .toggle-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .toggle-info {
          flex: 1;
        }

        .toggle-info label {
          display: block;
          margin: 0 0 4px 0;
          font-weight: 500;
          font-size: 16px;
          color: #1f2937;
        }

        .toggle-info p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .toggle {
          width: 48px;
          height: 24px;
          cursor: pointer;
        }

        .reminder-days {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          background: #f3f4f6;
          border-color: #2563eb;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #d1d5db;
        }

        .notification-item.status-sent {
          border-left-color: #10b981;
        }

        .notification-item.status-failed {
          border-left-color: #ef4444;
        }

        .notification-icon {
          font-size: 24px;
        }

        .notification-details {
          flex: 1;
        }

        .notification-type {
          font-weight: 600;
          color: #1f2937;
          text-transform: capitalize;
        }

        .notification-meta {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .notification-error {
          font-size: 14px;
          color: #ef4444;
          margin-top: 4px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          border: 4px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default NotificationPreferences;
