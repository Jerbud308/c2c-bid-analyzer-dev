// ============================================================================
// Supabase Edge Function: notify-processing-failed
// ============================================================================
// Triggered when document processing fails
// Sends email notification to relevant users
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { generateProcessingFailedEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  documentId: string
  opportunityId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, opportunityId } = await req.json() as NotificationRequest

    if (!documentId || !opportunityId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: documentId, opportunityId' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get document details
    console.log(`Fetching document ${documentId}`)
    const { data: document, error: docError } = await supabase
      .from('bid_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`)
    }

    // Get opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (oppError || !opportunity) {
      throw new Error(`Opportunity not found: ${oppError?.message || 'Unknown error'}`)
    }

    // Get users to notify
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('user_email, user_name')
      .eq('notify_processing_failed', true)

    if (usersError || !users || users.length === 0) {
      console.log('No users to notify about processing failure')
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending failure notifications to ${users.length} user(s)`)

    // Send email to each user
    const sendPromises = users.map(async (user) => {
      try {
        const html = generateProcessingFailedEmail({
          userName: user.user_name || 'there',
          opportunityTitle: opportunity.title,
          fileName: document.file_name,
          errorMessage: document.error_message || 'An unknown error occurred during processing',
          retryUrl: `https://c2cbidanalyzer.com/opportunities/${opportunityId}`
        })

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: user.user_email,
            subject: `❌ Processing Failed: ${opportunity.title}`,
            html: html,
            type: 'processing_failed',
            opportunityId: opportunityId,
            metadata: {
              document_id: documentId,
              file_name: document.file_name,
              error: document.error_message
            }
          })
        })

        const emailResult = await emailResponse.json()

        if (!emailResponse.ok) {
          console.error(`Failed to send email to ${user.user_email}:`, emailResult)
          return { email: user.user_email, success: false, error: emailResult.error }
        }

        console.log(`Email sent successfully to ${user.user_email}`)
        return { email: user.user_email, success: true }
      } catch (error) {
        console.error(`Error sending email to ${user.user_email}:`, error)
        return { email: user.user_email, success: false, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`Failure notification complete: ${successCount}/${results.length} emails sent`)

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: successCount,
        total_count: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
