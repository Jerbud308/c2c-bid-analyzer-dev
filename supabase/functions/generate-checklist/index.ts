import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChecklistItem {
  id: string
  category: 'Administrative' | 'Technical' | 'Qualifications' | 'Pricing' | 'Certifications' | 'Insurance'
  description: string
  reference_section: string | null
  status: 'not_started' | 'in_progress' | 'complete'
  responsible_party: 'Blake' | 'Phil' | null
  notes: string | null
  source: string
  created_at: string
  completed_at: string | null
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { opportunityId } = await req.json()

    if (!opportunityId) {
      return new Response(
        JSON.stringify({ error: 'opportunityId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch analysis data
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('bid_analysis')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single()

    if (analysisError || !analysis) {
      return new Response(
        JSON.stringify({ error: 'Analysis not found for this opportunity' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate checklist items
    const items: ChecklistItem[] = []
    const now = new Date().toISOString()

    // 1. Extract from submission_requirements → Category: Administrative
    if (Array.isArray(analysis.submission_requirements)) {
      analysis.submission_requirements.forEach((req: any) => {
        items.push({
          id: crypto.randomUUID(),
          category: 'Administrative',
          description: req.item || req.requirement || req.description || String(req),
          reference_section: req.reference_section || req.reference || null,
          status: 'not_started',
          responsible_party: null,
          notes: null,
          source: 'submission_requirements',
          created_at: now,
          completed_at: null,
        })
      })
    }

    // 2. Extract from qualifications_required → Category: Qualifications
    // Only include items with c2c_status='needs_verification' or 'not_met'
    if (Array.isArray(analysis.qualifications_required)) {
      analysis.qualifications_required
        .filter((qual: any) =>
          qual.c2c_status === 'needs_verification' || qual.c2c_status === 'not_met'
        )
        .forEach((qual: any) => {
          items.push({
            id: crypto.randomUUID(),
            category: 'Qualifications',
            description: qual.requirement || qual.description || String(qual),
            reference_section: qual.reference_section || qual.reference || null,
            status: 'not_started',
            responsible_party: null,
            notes: qual.c2c_status === 'not_met' ? 'C2C may not meet this requirement' : 'Needs verification',
            source: 'qualifications_required',
            created_at: now,
            completed_at: null,
          })
        })
    }

    // 3. Extract from technical_requirements (materials/certifications only) → Category: Technical
    if (Array.isArray(analysis.technical_requirements)) {
      analysis.technical_requirements
        .filter((tech: any) => {
          const desc = String(tech.requirement || tech.description || tech).toLowerCase()
          return desc.includes('material') ||
                 desc.includes('certification') ||
                 desc.includes('submit') ||
                 desc.includes('provide') ||
                 desc.includes('specification')
        })
        .slice(0, 5) // Top 5 critical ones
        .forEach((tech: any) => {
          items.push({
            id: crypto.randomUUID(),
            category: 'Technical',
            description: tech.requirement || tech.description || String(tech),
            reference_section: tech.reference_section || tech.reference || null,
            status: 'not_started',
            responsible_party: null,
            notes: null,
            source: 'technical_requirements',
            created_at: now,
            completed_at: null,
          })
        })
    }

    // 4. Extract from insurance_bonding → Category: Insurance/Certifications
    if (analysis.insurance_bonding && typeof analysis.insurance_bonding === 'object') {
      const insurance = analysis.insurance_bonding as any

      if (insurance.general_liability) {
        items.push({
          id: crypto.randomUUID(),
          category: 'Insurance',
          description: `Provide proof of General Liability Insurance: ${insurance.general_liability}`,
          reference_section: null,
          status: 'not_started',
          responsible_party: null,
          notes: null,
          source: 'insurance_bonding',
          created_at: now,
          completed_at: null,
        })
      }

      if (insurance.workers_comp) {
        items.push({
          id: crypto.randomUUID(),
          category: 'Insurance',
          description: `Provide proof of Workers' Compensation Insurance: ${insurance.workers_comp}`,
          reference_section: null,
          status: 'not_started',
          responsible_party: null,
          notes: null,
          source: 'insurance_bonding',
          created_at: now,
          completed_at: null,
        })
      }

      if (insurance.performance_bond) {
        items.push({
          id: crypto.randomUUID(),
          category: 'Certifications',
          description: `Obtain Performance Bond: ${insurance.performance_bond}`,
          reference_section: null,
          status: 'not_started',
          responsible_party: null,
          notes: null,
          source: 'insurance_bonding',
          created_at: now,
          completed_at: null,
        })
      }

      if (insurance.payment_bond) {
        items.push({
          id: crypto.randomUUID(),
          category: 'Certifications',
          description: `Obtain Payment Bond: ${insurance.payment_bond}`,
          reference_section: null,
          status: 'not_started',
          responsible_party: null,
          notes: null,
          source: 'insurance_bonding',
          created_at: now,
          completed_at: null,
        })
      }
    }

    // 5. Extract from pricing_structure → Category: Pricing
    if (analysis.pricing_structure && typeof analysis.pricing_structure === 'object') {
      const pricing = analysis.pricing_structure as any

      if (pricing.structure_type) {
        items.push({
          id: crypto.randomUUID(),
          category: 'Pricing',
          description: `Prepare pricing using ${pricing.structure_type} structure`,
          reference_section: null,
          status: 'not_started',
          responsible_party: null,
          notes: pricing.payment_terms ? `Payment terms: ${pricing.payment_terms}` : null,
          source: 'pricing_structure',
          created_at: now,
          completed_at: null,
        })
      }

      if (Array.isArray(pricing.line_items) && pricing.line_items.length > 0) {
        items.push({
          id: crypto.randomUUID(),
          category: 'Pricing',
          description: `Complete all pricing line items (${pricing.line_items.length} items)`,
          reference_section: null,
          status: 'not_started',
          responsible_party: null,
          notes: null,
          source: 'pricing_structure',
          created_at: now,
          completed_at: null,
        })
      }
    }

    // 6. Add standard items
    if (analysis.prevailing_wage) {
      items.push({
        id: crypto.randomUUID(),
        category: 'Administrative',
        description: 'Review and comply with Davis-Bacon prevailing wage requirements',
        reference_section: null,
        status: 'not_started',
        responsible_party: null,
        notes: 'Prevailing wage applies to this project',
        source: 'analysis_metadata',
        created_at: now,
        completed_at: null,
      })
    }

    // Always add bond quote item if not already added
    const hasBondItem = items.some(item =>
      item.description.toLowerCase().includes('performance bond')
    )
    if (!hasBondItem && analysis.insurance_bonding) {
      items.push({
        id: crypto.randomUUID(),
        category: 'Certifications',
        description: 'Obtain performance bond quote from surety',
        reference_section: null,
        status: 'not_started',
        responsible_party: null,
        notes: null,
        source: 'standard_items',
        created_at: now,
        completed_at: null,
      })
    }

    // Upsert to compliance_checklists table
    const { data: checklist, error: upsertError } = await supabaseClient
      .from('compliance_checklists')
      .upsert({
        opportunity_id: opportunityId,
        items: items,
        custom_items: [],
        completion_percentage: 0,
        generated_at: now,
        last_updated: now,
      }, {
        onConflict: 'opportunity_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create checklist', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        checklist_id: checklist.id,
        item_count: items.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
