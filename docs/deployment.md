# C2C Bid Analyzer - Deployment Guide

Complete guide for deploying the C2C Government Bid Analyzer to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Storage Setup](#storage-setup)
- [Edge Functions Deployment](#edge-functions-deployment)
- [Cron Jobs Setup](#cron-jobs-setup)
- [Email Service Setup](#email-service-setup)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

1. **Supabase Account** (free tier works for development)
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project

2. **Anthropic Account** (for Claude API)
   - Sign up at [console.anthropic.com](https://console.anthropic.com)
   - Get API key from API Keys section

3. **Resend Account** (for email notifications)
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain
   - Get API key

### Required Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

## Environment Setup

### 1. Get Supabase Credentials

From your Supabase project dashboard:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:** Never commit `SERVICE_ROLE_KEY` to version control!

### 2. Set Environment Variables for Edge Functions

```bash
# Set secrets for Edge Functions
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Verify secrets are set
supabase secrets list
```

### 3. Create Local .env File

```bash
# Copy example
cp .env.example .env

# Edit .env with your credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Setup

### 1. Initialize Database Schema

```bash
# Run schema.sql to create all tables
supabase db push
```

Or manually in Supabase Dashboard → SQL Editor:

```sql
-- Copy and run contents of supabase/schema.sql
```

### 2. Verify Tables Created

Check that these tables exist:
- ✅ opportunities
- ✅ bid_documents
- ✅ bid_analysis
- ✅ user_preferences
- ✅ notification_log

### 3. Seed Initial Data (Optional)

Default user preferences are seeded automatically:
- phil@c2crestoration.com
- blake@c2crestoration.com

To add more users:

```sql
INSERT INTO user_preferences (user_email, user_name)
VALUES ('your-email@company.com', 'Your Name')
ON CONFLICT (user_email) DO NOTHING;
```

## Storage Setup

### 1. Create Storage Bucket

**Option A: Via Dashboard (Recommended)**
1. Go to Storage → "New bucket"
2. Name: `bid-documents`
3. Public: **No** (keep private)
4. Click "Create bucket"

**Option B: Via SQL**
```sql
-- Run contents of supabase/storage.sql
```

### 2. Verify Storage Policies

Check that these policies exist for `storage.objects`:
- ✅ Allow authenticated users to upload
- ✅ Allow authenticated users to read
- ✅ Allow service role full access

## Edge Functions Deployment

### 1. Deploy Core Functions

Deploy all 4 core functions:

```bash
# Upload handler
supabase functions deploy upload-bid-package

# Document processor (AI analysis)
supabase functions deploy process-document

# Status checker
supabase functions deploy check-status

# Analysis retriever
supabase functions deploy get-analysis
```

### 2. Deploy Notification Functions

```bash
# Core email sender
supabase functions deploy send-email

# Event-triggered notifications
supabase functions deploy notify-analysis-complete
supabase functions deploy notify-processing-failed

# Scheduled notifications
supabase functions deploy daily-digest
supabase functions deploy deadline-reminders
```

### 3. Verify Deployments

```bash
# List all deployed functions
supabase functions list

# Test a function
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/check-status?opportunity_id=test \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Cron Jobs Setup

Set up scheduled notifications via Supabase Dashboard → Database → Cron Jobs.

### 1. Daily Digest (8am EST)

```sql
SELECT cron.schedule(
  'daily-digest-8am',
  '0 13 * * *',  -- 1pm UTC = 8am EST
  $$
  SELECT
    net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/daily-digest',
      headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

### 2. Deadline Reminders (Midnight EST)

```sql
SELECT cron.schedule(
  'deadline-reminders-midnight',
  '0 5 * * *',  -- 5am UTC = midnight EST
  $$
  SELECT
    net.http_post(
      url:='https://your-project-ref.supabase.co/functions/v1/deadline-reminders',
      headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

### 3. Verify Cron Jobs

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

## Email Service Setup

### 1. Configure Resend

1. Go to [resend.com](https://resend.com) → Domains
2. Add your domain (e.g., `c2cbidanalyzer.com`)
3. Add DNS records shown by Resend:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
4. Verify domain (may take up to 48 hours)

### 2. Update Email Templates

Edit the `FROM_EMAIL` in `/supabase/functions/send-email/index.ts`:

```typescript
const FROM_EMAIL = 'C2C Bid Analyzer <notifications@yourdomain.com>'
```

Redeploy after changes:

```bash
supabase functions deploy send-email
```

### 3. Test Email Delivery

```bash
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>This is a test email from C2C Bid Analyzer</p>",
    "type": "analysis_complete"
  }'
```

## Testing

### End-to-End Test

Test the complete workflow:

#### 1. Upload a Bid

```bash
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/upload-bid-package \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@sample-bid.pdf" \
  -F "title=Test Roofing Project" \
  -F "agency=GSA"
```

Save the `opportunity_id` from the response.

#### 2. Poll Status

```bash
# Check status every 5 seconds
watch -n 5 "curl -s \
  'https://your-project-ref.supabase.co/functions/v1/check-status?opportunity_id=YOUR_OPPORTUNITY_ID' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' | jq"
```

Wait for `ready_for_review: true`.

#### 3. Get Analysis

```bash
curl -X GET \
  "https://your-project-ref.supabase.co/functions/v1/get-analysis?opportunity_id=YOUR_OPPORTUNITY_ID" \
  -H "Authorization: Bearer YOUR_ANON_KEY" | jq
```

#### 4. Verify Notification

Check your email for the "Analysis Complete" notification.

### Test Individual Functions

**Test status check:**
```bash
curl "https://your-project-ref.supabase.co/functions/v1/check-status?opportunity_id=test" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Test analysis retrieval:**
```bash
curl "https://your-project-ref.supabase.co/functions/v1/get-analysis?opportunity_id=test" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Test daily digest:**
```bash
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/daily-digest \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Monitoring

### 1. Function Logs

View logs in Supabase Dashboard → Edge Functions → Select function → Logs

Or via CLI:

```bash
# View logs for a specific function
supabase functions logs upload-bid-package --tail

# View logs for all functions
supabase functions logs
```

### 2. Database Monitoring

Check processing status:

```sql
-- Recent uploads
SELECT
  o.title,
  d.processing_status,
  d.upload_date,
  d.error_message
FROM bid_documents d
JOIN opportunities o ON o.id = d.opportunity_id
ORDER BY d.upload_date DESC
LIMIT 10;

-- Failed processing
SELECT * FROM bid_documents
WHERE processing_status = 'failed'
ORDER BY upload_date DESC;
```

### 3. Notification Monitoring

Check email delivery:

```sql
-- Recent notifications
SELECT
  notification_type,
  user_email,
  status,
  sent_at,
  error_message
FROM notification_log
ORDER BY sent_at DESC
LIMIT 20;

-- Failed emails
SELECT * FROM notification_log
WHERE status = 'failed'
ORDER BY sent_at DESC;
```

### 4. Set Up Alerts

**Recommended alerts:**
- Storage usage > 80%
- Edge Function errors > 10/hour
- Failed email notifications
- Processing failures
- Database connection issues

## Troubleshooting

### Common Issues

#### 1. "Missing environment variable" Error

**Solution:**
```bash
# Verify secrets are set
supabase secrets list

# Set missing secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

#### 2. Storage Upload Fails

**Check:**
- Bucket exists and is named `bid-documents`
- Storage policies are configured
- File is under 50MB
- File is a valid PDF

**Solution:**
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'bid-documents';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'bid-documents';
```

#### 3. Processing Stuck at "pending"

**Possible causes:**
- process-document function not deployed
- ANTHROPIC_API_KEY not set
- PDF is corrupted

**Solution:**
```bash
# Check function logs
supabase functions logs process-document

# Manually trigger processing
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/process-document \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_id": "YOUR_DOC_ID", "opportunity_id": "YOUR_OPP_ID"}'
```

#### 4. Emails Not Sending

**Check:**
- Resend domain is verified
- RESEND_API_KEY is set correctly
- User preferences allow this notification type
- Check notification_log for errors

**Solution:**
```bash
# Test email directly
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>",
    "type": "analysis_complete"
  }'
```

#### 5. Cron Jobs Not Running

**Check:**
```sql
-- View cron job status
SELECT * FROM cron.job WHERE jobname LIKE '%digest%';

-- View recent executions
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 5;
```

**Solution:**
- Verify cron job was created correctly
- Check that the URL and auth header are correct
- Manually trigger the function to test

## Production Checklist

Before going live:

- [ ] Database schema deployed
- [ ] Storage bucket created with policies
- [ ] All Edge Functions deployed
- [ ] Environment variables set
- [ ] Cron jobs scheduled
- [ ] Email domain verified
- [ ] Test upload completed successfully
- [ ] Notifications working
- [ ] Monitoring/logging configured
- [ ] Backups enabled
- [ ] Rate limiting configured (if needed)
- [ ] CORS properly configured for your domain
- [ ] SSL certificate valid
- [ ] Error tracking (e.g., Sentry) integrated
- [ ] Documentation updated with production URLs

## Next Steps

After deployment:

1. **Build the Frontend**
   - Upload component
   - Status tracking
   - Analysis viewer
   - Dashboard

2. **Add Authentication**
   - User sign-up/login
   - Role-based access control
   - Team management

3. **Enhance Features**
   - Bulk upload
   - Export to Word/PDF
   - Analytics dashboard
   - Search and filtering

4. **Optimize Performance**
   - Add database indexes
   - Implement caching
   - Optimize Edge Functions
   - CDN for static assets

## Support

For issues or questions:

1. Check function logs in Supabase Dashboard
2. Review notification_log for email issues
3. Check bid_documents table for processing errors
4. Review this documentation
5. Contact Supabase support for platform issues
6. Contact Anthropic support for Claude API issues

## Useful Commands Reference

```bash
# Deploy all functions
for fn in upload-bid-package process-document check-status get-analysis send-email notify-analysis-complete notify-processing-failed daily-digest deadline-reminders; do
  supabase functions deploy $fn
done

# View all logs
supabase functions logs --tail

# Update a secret
supabase secrets set KEY=value

# List all functions
supabase functions list

# Delete a function
supabase functions delete function-name
```
