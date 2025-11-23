// ============================================================================
// Supabase Edge Function: send-email
// ============================================================================
// Core email sending function using Resend API
// Checks user preferences before sending and logs all notifications
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'C2C Bid Analyzer <notifications@c2cbidanalyzer.com>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  type: string
  opportunityId?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, type, opportunityId, metadata } = await req.json() as EmailRequest

    // Validate required fields
    if (!to || !subject || !html || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html, type' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_email', to)
      .single()

    // Check if user has this notification type enabled
    const notificationEnabled = checkNotificationEnabled(prefs, type)
    if (!notificationEnabled) {
      console.log(`Notification ${type} disabled for user ${to}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled by user preferences' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend
    console.log(`Sending ${type} email to ${to}`)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message || 'Unknown error'}`)
    }

    // Log successful notification
    await supabase
      .from('notification_log')
      .insert({
        user_email: to,
        notification_type: type,
        opportunity_id: opportunityId || null,
        status: 'sent',
        email_metadata: { ...metadata, resend_id: result.id }
      })

    console.log(`Email sent successfully. Resend ID: ${result.id}`)
    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)

    // Attempt to log failed notification
    try {
      const body = await req.clone().json()
      const { to, type, opportunityId } = body

      if (to && type) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        await supabase
          .from('notification_log')
          .insert({
            user_email: to,
            notification_type: type,
            opportunity_id: opportunityId || null,
            status: 'failed',
            error_message: error.message
          })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/**
 * Check if notification type is enabled for user
 */
function checkNotificationEnabled(prefs: any, type: string): boolean {
  if (!prefs) {
    console.log('No preferences found, defaulting to enabled')
    return true // Default: enabled if no preferences set
  }

  switch (type) {
    case 'analysis_complete':
      return prefs.notify_analysis_complete ?? true
    case 'processing_failed':
      return prefs.notify_processing_failed ?? true
    case 'deadline_reminder':
      return prefs.notify_deadline_reminders ?? true
    case 'daily_digest':
      return prefs.notify_daily_digest ?? true
    case 'status_change':
      return prefs.notify_status_change ?? false
    default:
      console.warn(`Unknown notification type: ${type}`)
      return true
  }
}
