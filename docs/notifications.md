# Email Notification System

The C2C Bid Analyzer includes a comprehensive email notification system that keeps users informed about important events without requiring them to constantly monitor the application.

## Overview

The notification system uses **Resend** as the email service provider and consists of:

- **5 notification types** covering different events
- **User preference management** for granular control
- **Scheduled functions** for daily digests and deadline reminders
- **Event-triggered notifications** for immediate alerts
- **Audit logging** of all sent notifications

## Notification Types

### 1. Analysis Complete ✅

**Trigger:** When AI analysis of a bid document finishes processing

**Contains:**
- Opportunity title and solicitation number
- Fit score and confidence level
- Deadline date
- Link to view full analysis
- Summary of analysis components

**Default:** Enabled

**Use Case:** Blake uploads a bid and wants to know when it's ready to review without refreshing the processing page.

---

### 2. Processing Failed ❌

**Trigger:** When document processing encounters an error (OCR failure, invalid PDF, etc.)

**Contains:**
- Opportunity title
- Document filename
- Error message with troubleshooting tips
- Link to retry upload

**Default:** Enabled

**Use Case:** Phil uploads a scanned PDF with poor quality. The system notifies him immediately so he can re-scan and re-upload rather than waiting indefinitely.

---

### 3. Deadline Reminders ⏰

**Trigger:** Configurable days before bid deadline (default: 7, 3, and 1 day before)

**Contains:**
- Days remaining countdown
- Opportunity title and solicitation number
- Deadline date prominently displayed
- Fit score for prioritization
- Pre-submission checklist

**Default:** Enabled (7, 3, 1 day reminders)

**Schedule:** Runs daily at midnight EST, checks for upcoming deadlines

**Use Case:** Phil wants reminders for "Government Building Renovation" bid. He gets emails 7 days out (time to plan), 3 days out (finalize pricing), and 1 day out (final review).

---

### 4. Daily Digest 📊

**Trigger:** Scheduled delivery at user-configured time (default: 8:00 AM EST)

**Contains:**
- Total count of new opportunities in last 24 hours
- List of opportunities sorted by fit score (highest first)
- Each opportunity shows:
  - Title, agency, solicitation number
  - Deadline date
  - Fit score with color coding
  - Analysis status (analyzing vs. ready)
- Link to dashboard

**Default:** Enabled at 8:00 AM EST

**Schedule:** Runs daily via cron at configured time

**Use Case:** Blake wants a morning email with "5 new opportunities today" showing highest-priority bids first, without logging into the app.

---

### 5. Status Change 📋

**Trigger:** When opportunity status changes (e.g., new → bidding, bidding → submitted, submitted → won)

**Contains:**
- Visual "from → to" status display
- Opportunity title
- Who made the change (if tracked)
- Link to opportunity

**Default:** Disabled (to avoid email overload)

**Use Case:** Team wants to be notified when status changes to "won" or "lost" to celebrate wins or learn from losses.

## Architecture

### Database Schema

**user_preferences table:**
```sql
- user_email (unique)
- user_name
- notify_analysis_complete (boolean)
- notify_processing_failed (boolean)
- notify_deadline_reminders (boolean)
- notify_daily_digest (boolean)
- notify_status_change (boolean)
- digest_time (time)
- deadline_reminder_days (integer array)
```

**notification_log table:**
```sql
- id (UUID)
- user_email
- notification_type
- opportunity_id (optional)
- sent_at (timestamp)
- status (sent|failed|bounced)
- error_message
- email_metadata (JSONB)
```

### Supabase Edge Functions

#### Core Functions

**`send-email`**
- Central email sending function
- Checks user preferences before sending
- Calls Resend API
- Logs all notifications to database
- Handles failures gracefully

**Location:** `/supabase/functions/send-email/index.ts`

#### Event-Triggered Functions

**`notify-analysis-complete`**
- Triggered when analysis completes
- Fetches opportunity and analysis data
- Gets users with analysis notifications enabled
- Sends personalized email to each user

**Location:** `/supabase/functions/notify-analysis-complete/index.ts`

**How to trigger:**
```typescript
// From your analysis completion code:
await fetch(`${SUPABASE_URL}/functions/v1/notify-analysis-complete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ opportunityId: 'uuid-here' })
})
```

**`notify-processing-failed`**
- Triggered when document processing fails
- Includes error details and troubleshooting tips
- Helps users quickly identify and fix issues

**Location:** `/supabase/functions/notify-processing-failed/index.ts`

#### Scheduled Functions

**`daily-digest`**
- Runs daily via cron
- Fetches opportunities created in last 24 hours
- Sorts by fit score
- Sends digest to subscribed users
- Skips email if no new opportunities

**Location:** `/supabase/functions/daily-digest/index.ts`

**Cron Schedule:** `0 8 * * *` (8:00 AM EST daily)

**`deadline-reminders`**
- Runs daily via cron
- Checks each user's reminder preferences
- Finds opportunities with matching deadlines
- Prevents duplicate reminders (checks log)
- Sends personalized reminders

**Location:** `/supabase/functions/deadline-reminders/index.ts`

**Cron Schedule:** `0 0 * * *` (midnight EST daily)

### Email Templates

All email templates use a consistent design with:
- C2C branding and colors
- Mobile-responsive layout
- Clear call-to-action buttons
- Professional styling
- Preference management link in footer

**Location:** `/supabase/functions/_shared/email-templates.ts`

**Templates:**
- `generateAnalysisCompleteEmail()`
- `generateProcessingFailedEmail()`
- `generateDeadlineReminderEmail()`
- `generateDailyDigestEmail()`
- `generateStatusChangeEmail()`

## Frontend Integration

### API Client Methods

```typescript
import { api } from '@/lib/api'

// Get user preferences
const prefs = await api.getNotificationPreferences('user@example.com')

// Update preferences
const updated = await api.updateNotificationPreferences('user@example.com', {
  notify_daily_digest: false,
  deadline_reminder_days: [7, 3, 1]
})

// Get notification history
const history = await api.getNotificationHistory('user@example.com', 20)

// Send test email
await api.sendTestNotification('user@example.com', 'analysis_complete')
```

### React Component

The `NotificationPreferences` component provides a full UI for managing settings:

```tsx
import { NotificationPreferences } from '@/components/NotificationPreferences'

function SettingsPage() {
  return (
    <NotificationPreferences
      userEmail="user@example.com"
      onSave={(prefs) => console.log('Saved:', prefs)}
    />
  )
}
```

**Features:**
- Toggle each notification type on/off
- Configure daily digest delivery time
- Select deadline reminder days (7, 5, 3, 2, 1 days before)
- Send test emails
- View notification history with status
- Real-time save feedback

## Setup Instructions

### 1. Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain (e.g., `c2cbidanalyzer.com`)
3. Generate an API key
4. Add to Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=re_abc123...
```

### 2. Deploy Edge Functions

```bash
# Deploy all notification functions
supabase functions deploy send-email
supabase functions deploy notify-analysis-complete
supabase functions deploy notify-processing-failed
supabase functions deploy daily-digest
supabase functions deploy deadline-reminders
```

### 3. Set Up Cron Jobs

In Supabase Dashboard → Database → Cron Jobs:

**Daily Digest:**
```sql
SELECT cron.schedule(
  'daily-digest',
  '0 8 * * *',  -- 8 AM EST
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/daily-digest',
      headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

**Deadline Reminders:**
```sql
SELECT cron.schedule(
  'deadline-reminders',
  '0 0 * * *',  -- Midnight EST
  $$
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/deadline-reminders',
      headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### 4. Initialize User Preferences

Default preferences are seeded in the schema for Phil and Blake:

```sql
INSERT INTO user_preferences (user_email, user_name)
VALUES
  ('phil@c2crestoration.com', 'Phil Wright'),
  ('blake@c2crestoration.com', 'Blake Harkcom')
ON CONFLICT (user_email) DO NOTHING;
```

Add more users as needed.

### 5. Trigger Notifications from Code

**When analysis completes:**
```typescript
// After AI analysis finishes
await fetch(`${SUPABASE_URL}/functions/v1/notify-analysis-complete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ opportunityId: opportunity.id })
})
```

**When processing fails:**
```typescript
// When document processing fails
await fetch(`${SUPABASE_URL}/functions/v1/notify-processing-failed`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: document.id,
    opportunityId: opportunity.id
  })
})
```

## Testing

### Test Individual Notification

```bash
# Test analysis complete notification
curl -X POST \
  https://your-project.supabase.co/functions/v1/notify-analysis-complete \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"opportunityId": "uuid-here"}'

# Test daily digest
curl -X POST \
  https://your-project.supabase.co/functions/v1/daily-digest \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Test Email Templates

Use the "Send Test Email" button in the NotificationPreferences component, or:

```typescript
await api.sendTestNotification('your-email@example.com', 'analysis_complete')
```

### View Logs

Check notification history in the database:

```sql
SELECT * FROM notification_log
ORDER BY sent_at DESC
LIMIT 20;
```

Or via the NotificationPreferences component's History tab.

## Monitoring

### Delivery Metrics

Query notification success rate:

```sql
SELECT
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type;
```

### User Engagement

See which notifications users disable most:

```sql
SELECT
  COUNT(*) as total_users,
  SUM(CASE WHEN notify_analysis_complete THEN 1 ELSE 0 END) as analysis_complete,
  SUM(CASE WHEN notify_processing_failed THEN 1 ELSE 0 END) as processing_failed,
  SUM(CASE WHEN notify_deadline_reminders THEN 1 ELSE 0 END) as deadline_reminders,
  SUM(CASE WHEN notify_daily_digest THEN 1 ELSE 0 END) as daily_digest,
  SUM(CASE WHEN notify_status_change THEN 1 ELSE 0 END) as status_change
FROM user_preferences;
```

## Troubleshooting

### Emails Not Sending

1. **Check Resend API key:**
   ```bash
   supabase secrets list
   ```

2. **Verify domain in Resend:**
   - Must be verified before sending
   - Check DNS records are configured

3. **Check Edge Function logs:**
   ```bash
   supabase functions logs send-email
   ```

4. **Look for errors in notification_log:**
   ```sql
   SELECT * FROM notification_log
   WHERE status = 'failed'
   ORDER BY sent_at DESC;
   ```

### Scheduled Functions Not Running

1. **Verify cron jobs are active:**
   ```sql
   SELECT * FROM cron.job;
   ```

2. **Check cron job history:**
   ```sql
   SELECT * FROM cron.job_run_details
   ORDER BY start_time DESC
   LIMIT 10;
   ```

3. **Manually trigger to test:**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/daily-digest \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

### Users Not Receiving Certain Notifications

1. **Check user preferences:**
   ```sql
   SELECT * FROM user_preferences
   WHERE user_email = 'user@example.com';
   ```

2. **Verify notification type is enabled**

3. **Check spam folder** - especially for daily digest

### Duplicate Notifications

The deadline-reminders function prevents duplicates by checking the log:

```typescript
const { data: existingLog } = await supabase
  .from('notification_log')
  .select('id')
  .eq('user_email', user.user_email)
  .eq('opportunity_id', opp.id)
  .eq('notification_type', 'deadline_reminder')
  .gte('sent_at', today.toISOString())
  .single()

if (existingLog) continue // Skip
```

## Future Enhancements

### Possible Additions

1. **SMS notifications** via Twilio for urgent deadlines
2. **Slack integration** for team notifications
3. **Weekly summary** in addition to daily digest
4. **Custom notification rules** (e.g., only notify for bids >$100k)
5. **Email templates editor** for customizing content
6. **Unsubscribe links** (compliance requirement for some use cases)
7. **Rich notifications** with embedded charts/graphs
8. **Notification grouping** to reduce email volume
9. **Mobile push notifications** via PWA
10. **Webhook support** for external integrations

## Best Practices

1. **Respect user preferences** - Always check before sending
2. **Log everything** - Helps with debugging and compliance
3. **Handle failures gracefully** - Don't crash if email fails
4. **Use templates** - Maintain consistent branding
5. **Test thoroughly** - Use test emails before going live
6. **Monitor delivery** - Track success/failure rates
7. **Optimize send times** - Avoid midnight emails unless requested
8. **Provide value** - Each email should be actionable
9. **Allow customization** - Let users control what they receive
10. **Keep it simple** - Don't overwhelm with too many notification types

## Support

For issues or questions about the notification system:

1. Check this documentation
2. Review Edge Function logs
3. Check notification_log table for errors
4. Contact Resend support for delivery issues
5. Review Supabase docs for Edge Function troubleshooting
