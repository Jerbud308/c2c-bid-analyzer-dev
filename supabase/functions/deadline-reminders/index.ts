// ============================================================================
// Supabase Edge Function: deadline-reminders
// ============================================================================
// Scheduled function (runs daily via cron)
// Sends deadline reminder emails based on user preferences
// Default: 7 days, 3 days, 1 day before deadline
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { generateDeadlineReminderEmail } from '../_shared/email-templates.ts'

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

    // Get users with deadline reminder preferences
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('notify_deadline_reminders', true)

    if (usersError || !users || users.length === 0) {
      console.log('No users with deadline reminders enabled')
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing deadline reminders for ${users.length} user(s)`)

    let totalSent = 0
    const results: Array<{ user: string; sent: number; errors: number }> = []

    // Process each user
    for (const user of users) {
      const reminderDays = user.deadline_reminder_days || [7, 3, 1]
      let userSentCount = 0
      let userErrorCount = 0

      console.log(`Checking reminders for ${user.user_email}, days: ${reminderDays.join(', ')}`)

      // Check each reminder day
      for (const days of reminderDays) {
        try {
          // Calculate target date (days from now)
          const targetDate = new Date()
          targetDate.setDate(targetDate.getDate() + days)
          targetDate.setHours(0, 0, 0, 0) // Start of day

          const nextDate = new Date(targetDate)
          nextDate.setDate(nextDate.getDate() + 1) // End of day range

          const targetDateStr = targetDate.toISOString().split('T')[0]

          console.log(`Looking for deadlines on ${targetDateStr} (${days} days away)`)

          // Find opportunities with deadline matching this reminder day
          // Only active opportunities (not won, lost, or passed)
          const { data: opportunities, error: oppError } = await supabase
            .from('opportunities')
            .select(`
              id,
              title,
              solicitation_number,
              deadline_date,
              bid_analysis (
                fit_score,
                confidence_level
              )
            `)
            .eq('deadline_date', targetDateStr)
            .in('status', ['new', 'analyzing', 'reviewed', 'bidding'])

          if (oppError) {
            console.error(`Error fetching opportunities:`, oppError)
            userErrorCount++
            continue
          }

          if (!opportunities || opportunities.length === 0) {
            console.log(`No opportunities with deadline on ${targetDateStr}`)
            continue
          }

          console.log(`Found ${opportunities.length} opportunities with deadline on ${targetDateStr}`)

          // Send reminder for each opportunity
          for (const opp of opportunities) {
            // Check if we already sent a reminder for this opportunity today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: existingLog } = await supabase
              .from('notification_log')
              .select('id')
              .eq('user_email', user.user_email)
              .eq('opportunity_id', opp.id)
              .eq('notification_type', 'deadline_reminder')
              .gte('sent_at', today.toISOString())
              .single()

            if (existingLog) {
              console.log(`Already sent reminder for opportunity ${opp.id} today`)
              continue
            }

            // Send reminder email
            const html = generateDeadlineReminderEmail({
              userName: user.user_name || 'there',
              opportunityTitle: opp.title,
              solicitationNumber: opp.solicitation_number,
              deadline: opp.deadline_date!,
              daysRemaining: days,
              fitScore: opp.bid_analysis?.[0]?.fit_score,
              viewUrl: `https://c2cbidanalyzer.com/opportunities/${opp.id}`
            })

            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: user.user_email,
                subject: `⏰ Deadline in ${days} day${days !== 1 ? 's' : ''}: ${opp.title}`,
                html: html,
                type: 'deadline_reminder',
                opportunityId: opp.id,
                metadata: {
                  days_remaining: days,
                  deadline_date: opp.deadline_date
                }
              })
            })

            const emailResult = await emailResponse.json()

            if (!emailResponse.ok) {
              console.error(`Failed to send reminder to ${user.user_email}:`, emailResult)
              userErrorCount++
            } else {
              console.log(`Sent ${days}-day reminder to ${user.user_email} for ${opp.title}`)
              userSentCount++
              totalSent++
            }
          }
        } catch (error) {
          console.error(`Error processing ${days}-day reminders for ${user.user_email}:`, error)
          userErrorCount++
        }
      }

      results.push({
        user: user.user_email,
        sent: userSentCount,
        errors: userErrorCount
      })
    }

    console.log(`Deadline reminders complete: ${totalSent} total emails sent`)

    return new Response(
      JSON.stringify({
        success: true,
        total_sent: totalSent,
        users_processed: users.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Deadline reminder error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
