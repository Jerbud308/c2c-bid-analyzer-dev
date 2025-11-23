// ============================================================================
// Supabase Edge Function: daily-digest
// ============================================================================
// Scheduled function (runs daily via cron)
// Sends daily digest of new opportunities to subscribed users
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { generateDailyDigestEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get opportunities created in last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    console.log(`Fetching opportunities created since ${yesterday.toISOString()}`)

    const { data: newOpportunities, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        id,
        title,
        agency,
        solicitation_number,
        deadline_date,
        created_at,
        bid_analysis (
          fit_score,
          confidence_level
        )
      `)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (oppError) {
      throw new Error(`Failed to fetch opportunities: ${oppError.message}`)
    }

    if (!newOpportunities || newOpportunities.length === 0) {
      console.log('No new opportunities for digest')
      return new Response(
        JSON.stringify({ success: true, message: 'No new opportunities to digest' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${newOpportunities.length} new opportunities`)

    // Sort by fit score (highest first), with unanalyzed opportunities last
    const sortedOpportunities = [...newOpportunities].sort((a, b) => {
      const scoreA = a.bid_analysis?.[0]?.fit_score || -1
      const scoreB = b.bid_analysis?.[0]?.fit_score || -1
      return scoreB - scoreA
    })

    // Get users who want daily digest
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('user_email, user_name')
      .eq('notify_daily_digest', true)

    if (usersError || !users || users.length === 0) {
      console.log('No users subscribed to daily digest')
      return new Response(
        JSON.stringify({ success: true, message: 'No users subscribed to daily digest' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending digest to ${users.length} user(s)`)

    // Send digest to each user
    const sendPromises = users.map(async (user) => {
      try {
        const html = generateDailyDigestEmail({
          userName: user.user_name || 'there',
          opportunities: sortedOpportunities,
          dashboardUrl: 'https://c2cbidanalyzer.com/dashboard'
        })

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: user.user_email,
            subject: `📊 Daily Digest: ${newOpportunities.length} New Opportunit${newOpportunities.length !== 1 ? 'ies' : 'y'}`,
            html: html,
            type: 'daily_digest',
            metadata: {
              opportunity_count: newOpportunities.length,
              date: new Date().toISOString().split('T')[0]
            }
          })
        })

        const emailResult = await emailResponse.json()

        if (!emailResponse.ok) {
          console.error(`Failed to send digest to ${user.user_email}:`, emailResult)
          return { email: user.user_email, success: false, error: emailResult.error }
        }

        console.log(`Digest sent successfully to ${user.user_email}`)
        return { email: user.user_email, success: true }
      } catch (error) {
        console.error(`Error sending digest to ${user.user_email}:`, error)
        return { email: user.user_email, success: false, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`Daily digest complete: ${successCount}/${results.length} emails sent`)

    return new Response(
      JSON.stringify({
        success: true,
        opportunities_count: newOpportunities.length,
        sent_count: successCount,
        total_users: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Daily digest error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
