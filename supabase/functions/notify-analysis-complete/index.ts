// ============================================================================
// Supabase Edge Function: notify-analysis-complete
// ============================================================================
// Triggered when bid analysis completes
// Sends email notification to relevant users
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { generateAnalysisCompleteEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  opportunityId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { opportunityId } = await req.json() as NotificationRequest

    if (!opportunityId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: opportunityId' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get opportunity details with analysis
    console.log(`Fetching opportunity ${opportunityId}`)
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        *,
        bid_analysis (
          fit_score,
          confidence_level,
          analysis_timestamp
        )
      `)
      .eq('id', opportunityId)
      .single()

    if (oppError || !opportunity) {
      throw new Error(`Opportunity not found: ${oppError?.message || 'Unknown error'}`)
    }

    // Check if analysis exists
    if (!opportunity.bid_analysis || opportunity.bid_analysis.length === 0) {
      console.log('No analysis found for opportunity, skipping notification')
      return new Response(
        JSON.stringify({ success: true, message: 'No analysis available yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const analysis = opportunity.bid_analysis[0]

    // Get users to notify
    // In a real implementation, you might want to notify only assigned users
    // For now, we'll notify all users with analysis_complete notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('user_email, user_name')
      .eq('notify_analysis_complete', true)

    if (usersError || !users || users.length === 0) {
      console.log('No users to notify')
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending notifications to ${users.length} user(s)`)

    // Send email to each user
    const sendPromises = users.map(async (user) => {
      try {
        const html = generateAnalysisCompleteEmail({
          userName: user.user_name || 'there',
          opportunityTitle: opportunity.title,
          solicitationNumber: opportunity.solicitation_number,
          fitScore: analysis.fit_score || 0,
          confidenceLevel: analysis.confidence_level || 'medium',
          deadline: opportunity.deadline_date,
          viewUrl: `https://c2cbidanalyzer.com/opportunities/${opportunityId}`
        })

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: user.user_email,
            subject: `✅ Analysis Complete: ${opportunity.title}`,
            html: html,
            type: 'analysis_complete',
            opportunityId: opportunityId,
            metadata: {
              fit_score: analysis.fit_score,
              confidence_level: analysis.confidence_level
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

    console.log(`Notification complete: ${successCount}/${results.length} emails sent`)

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
