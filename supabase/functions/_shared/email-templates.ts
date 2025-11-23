// ============================================================================
// Email Templates for C2C Bid Analyzer Notifications
// ============================================================================
// Reusable HTML email templates for all notification types
// ============================================================================

/**
 * Base email wrapper with C2C branding
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p><strong>C2C Restoration - Bid Analyzer</strong></p>
      <p><a href="https://c2cbidanalyzer.com/preferences">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Analysis Complete Email Template
 */
export function generateAnalysisCompleteEmail(data: {
  userName: string
  opportunityTitle: string
  solicitationNumber?: string
  fitScore: number
  confidenceLevel: string
  deadline?: string
  viewUrl: string
}): string {
  const { userName, opportunityTitle, solicitationNumber, fitScore, confidenceLevel, deadline, viewUrl } = data

  const fitScoreColor = fitScore >= 80 ? '#10b981' : fitScore >= 60 ? '#f59e0b' : '#ef4444'
  const confidenceBadge = confidenceLevel === 'high' ? '🟢' : confidenceLevel === 'medium' ? '🟡' : '🔴'

  const content = `
    <div class="header">
      <h1>✅ Analysis Complete</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Great news! The AI analysis for <strong>${opportunityTitle}</strong> is complete and ready for your review.</p>

      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; text-align: center; margin: 25px 0; border: 3px solid ${fitScoreColor};">
        <div style="font-size: 64px; font-weight: bold; color: ${fitScoreColor}; line-height: 1;">${fitScore}</div>
        <div style="font-size: 18px; color: #6b7280; margin-top: 10px;">Fit Score</div>
        <div style="margin-top: 15px; font-size: 16px;">${confidenceBadge} <strong>${confidenceLevel.toUpperCase()}</strong> CONFIDENCE</div>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${solicitationNumber ? `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Solicitation Number:</span>
          <span style="font-weight: 600;">${solicitationNumber}</span>
        </div>
        ` : ''}
        ${deadline ? `
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #6b7280;">Deadline:</span>
          <span style="font-weight: 600; color: #ef4444;">${new Date(deadline).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        ` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${viewUrl}" class="button">View Full Analysis</a>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">Analysis Includes:</p>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
          <li>Extracted requirements and specifications</li>
          <li>Qualification matching against C2C's capabilities</li>
          <li>Compliance checklist</li>
          <li>Questions flagged for clarification</li>
        </ul>
      </div>
    </div>
  `

  return emailWrapper(content)
}

/**
 * Processing Failed Email Template
 */
export function generateProcessingFailedEmail(data: {
  userName: string
  opportunityTitle: string
  fileName: string
  errorMessage: string
  retryUrl: string
}): string {
  const { userName, opportunityTitle, fileName, errorMessage, retryUrl } = data

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>❌ Processing Failed</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Unfortunately, we encountered an issue processing your bid document:</p>

      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0 0 10px 0;"><strong>Opportunity:</strong> ${opportunityTitle}</p>
        <p style="margin: 0 0 10px 0;"><strong>Document:</strong> ${fileName}</p>
        <p style="margin: 0;"><strong>Error:</strong> ${errorMessage}</p>
      </div>

      <p>Please check the document and try again. Common issues include:</p>
      <ul style="color: #6b7280;">
        <li>Scanned PDFs with poor image quality</li>
        <li>Password-protected or encrypted files</li>
        <li>Corrupted or incomplete uploads</li>
        <li>Extremely large files (>50MB)</li>
      </ul>

      <div style="text-align: center;">
        <a href="${retryUrl}" class="button" style="background: #ef4444;">Retry Upload</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
        If the problem persists, please contact support with the error details above.
      </p>
    </div>
  `

  return emailWrapper(content)
}

/**
 * Deadline Reminder Email Template
 */
export function generateDeadlineReminderEmail(data: {
  userName: string
  opportunityTitle: string
  solicitationNumber?: string
  deadline: string
  daysRemaining: number
  fitScore?: number
  viewUrl: string
}): string {
  const { userName, opportunityTitle, solicitationNumber, deadline, daysRemaining, fitScore, viewUrl } = data

  const urgencyColor = daysRemaining === 1 ? '#ef4444' : daysRemaining <= 3 ? '#f59e0b' : '#3b82f6'
  const urgencyGradient = daysRemaining === 1
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : daysRemaining <= 3
    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'

  const content = `
    <div class="header" style="background: ${urgencyGradient};">
      <h1>⏰ Deadline Reminder</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>This is a ${daysRemaining === 1 ? '<strong style="color: #ef4444;">URGENT</strong>' : ''} reminder that a bid deadline is approaching:</p>

      <div style="background: white; padding: 40px; border-radius: 8px; text-align: center; margin: 25px 0; border: 4px solid ${urgencyColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="font-size: 80px; font-weight: bold; color: ${urgencyColor}; line-height: 1;">${daysRemaining}</div>
        <div style="font-size: 28px; color: #6b7280; margin-top: 10px;">day${daysRemaining !== 1 ? 's' : ''} remaining</div>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">${opportunityTitle}</h3>
        ${solicitationNumber ? `<p style="margin: 5px 0; color: #6b7280;">📄 ${solicitationNumber}</p>` : ''}
        <p style="margin: 5px 0; color: #6b7280;">📅 Deadline: <strong style="color: ${urgencyColor};">${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
        ${fitScore ? `<p style="margin: 5px 0;">⭐ Fit Score: <span style="font-weight: bold; font-size: 20px; color: ${fitScore >= 80 ? '#10b981' : '#f59e0b'};">${fitScore}</span></p>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${viewUrl}" class="button">Review Bid Details</a>
      </div>

      <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Pre-Submission Checklist:</p>
        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
          <li>Completed compliance checklist</li>
          <li>Gathered all required documentation</li>
          <li>Obtained necessary approvals</li>
          <li>Prepared pricing structure</li>
          <li>Reviewed submission requirements</li>
        </ul>
      </div>
    </div>
  `

  return emailWrapper(content)
}

/**
 * Daily Digest Email Template
 */
export function generateDailyDigestEmail(data: {
  userName: string
  opportunities: Array<{
    id: string
    title: string
    agency?: string
    solicitation_number?: string
    deadline_date?: string
    bid_analysis?: Array<{ fit_score?: number; confidence_level?: string }>
  }>
  dashboardUrl: string
}): string {
  const { userName, opportunities, dashboardUrl } = data

  const opportunitiesHtml = opportunities.map((opp) => {
    const fitScore = opp.bid_analysis?.[0]?.fit_score || 0
    const fitColor = fitScore >= 80 ? '#10b981' : fitScore >= 60 ? '#f59e0b' : '#ef4444'
    const hasAnalysis = opp.bid_analysis && opp.bid_analysis.length > 0

    return `
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 5px solid ${fitColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1; min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${opp.title}</h3>
            ${opp.agency || opp.solicitation_number ? `
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
              ${opp.agency || 'Agency not specified'}
              ${opp.solicitation_number ? ` • ${opp.solicitation_number}` : ''}
            </p>
            ` : ''}
            ${opp.deadline_date ? `
            <p style="margin: 8px 0 0 0; color: #ef4444; font-size: 14px; font-weight: 600;">
              📅 Due: ${new Date(opp.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            ` : ''}
          </div>
          ${hasAnalysis ? `
          <div style="text-align: center; padding: 10px; background: ${fitColor}15; border-radius: 8px; min-width: 80px;">
            <div style="font-size: 32px; font-weight: bold; color: ${fitColor}; line-height: 1;">${fitScore}</div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Fit Score</div>
          </div>
          ` : `
          <div style="text-align: center; padding: 10px; background: #f3f4f6; border-radius: 8px; min-width: 80px;">
            <div style="font-size: 14px; color: #6b7280;">Analyzing...</div>
          </div>
          `}
        </div>
        <a href="https://c2cbidanalyzer.com/analysis/${opp.id}" style="display: inline-block; margin-top: 12px; color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 600;">View Details →</a>
      </div>
    `
  }).join('')

  const content = `
    <div class="header">
      <h1>📊 Daily Digest</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div class="content">
      <p>Good morning ${userName},</p>
      <p>Here's what's new in your bid pipeline:</p>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <div style="font-size: 48px; font-weight: bold; color: #2563eb; line-height: 1;">${opportunities.length}</div>
        <div style="color: #1e40af; font-size: 18px; margin-top: 5px;">New Opportunit${opportunities.length !== 1 ? 'ies' : 'y'} Added</div>
      </div>

      ${opportunitiesHtml}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${dashboardUrl}" class="button">View Full Dashboard</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        💡 <strong>Tip:</strong> High-scoring opportunities (80+) are excellent matches for C2C's capabilities. Review them first!
      </p>
    </div>
  `

  return emailWrapper(content)
}

/**
 * Status Change Email Template
 */
export function generateStatusChangeEmail(data: {
  userName: string
  opportunityTitle: string
  oldStatus: string
  newStatus: string
  changedBy?: string
  viewUrl: string
}): string {
  const { userName, opportunityTitle, oldStatus, newStatus, changedBy, viewUrl } = data

  const statusColors: Record<string, string> = {
    'new': '#6b7280',
    'analyzing': '#3b82f6',
    'reviewed': '#8b5cf6',
    'bidding': '#f59e0b',
    'submitted': '#3b82f6',
    'won': '#10b981',
    'lost': '#ef4444',
    'pass': '#6b7280'
  }

  const statusEmojis: Record<string, string> = {
    'new': '🆕',
    'analyzing': '🔍',
    'reviewed': '✅',
    'bidding': '📝',
    'submitted': '📤',
    'won': '🎉',
    'lost': '❌',
    'pass': '⏭️'
  }

  const content = `
    <div class="header">
      <h1>📋 Status Update</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>The status for <strong>${opportunityTitle}</strong> has been updated:</p>

      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin: 25px 0; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
          <div style="padding: 15px 25px; background: white; border-radius: 8px; border: 2px solid ${statusColors[oldStatus] || '#6b7280'};">
            <div style="font-size: 32px;">${statusEmojis[oldStatus] || '📄'}</div>
            <div style="margin-top: 8px; color: #6b7280; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">From</div>
            <div style="margin-top: 4px; font-weight: 600; color: ${statusColors[oldStatus] || '#6b7280'};">${oldStatus.toUpperCase()}</div>
          </div>

          <div style="font-size: 32px; color: #6b7280;">→</div>

          <div style="padding: 15px 25px; background: white; border-radius: 8px; border: 3px solid ${statusColors[newStatus] || '#6b7280'}; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size: 32px;">${statusEmojis[newStatus] || '📄'}</div>
            <div style="margin-top: 8px; color: #6b7280; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">To</div>
            <div style="margin-top: 4px; font-weight: 600; color: ${statusColors[newStatus] || '#6b7280'}; font-size: 18px;">${newStatus.toUpperCase()}</div>
          </div>
        </div>

        ${changedBy ? `
        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
          Updated by ${changedBy}
        </p>
        ` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${viewUrl}" class="button">View Opportunity</a>
      </div>
    </div>
  `

  return emailWrapper(content)
}
