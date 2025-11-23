import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  corsHeaders,
  type AIAnalyzerRequest,
  type AIAnalyzerResponse,
  type ErrorResponse,
  type AIAnalysisOutput,
} from '../_shared/types.ts';

const C2C_PROFILE = {
  certifications: ['SDVOSB'],
  licenses: ['Florida contractor'],
  services: [
    'roofing',
    'asbestos abatement',
    'remediation',
    'demolition',
    'drywall',
    'electrical',
    'flooring',
  ],
  naics_codes: ['238160', '238310', '236220', '236118', '238210', '562910'],
  geographic_focus: 'florida',
};

// Helper: Calculate fit score
function calculateFitScore(
  analysis: AIAnalysisOutput,
  rawText: string,
  location?: string
): { score: number; redFlags: string[] } {
  let score = 0;
  const redFlags: string[] = [];

  // Qualifications match (40 points max)
  const qualifications = analysis.qualifications_required || [];
  if (qualifications.length > 0) {
    const metCount = qualifications.filter((q) => q.c2c_status === 'met').length;
    const qualScore = (metCount / qualifications.length) * 40;
    score += qualScore;

    // Red flags for unmet qualifications
    qualifications.forEach((q) => {
      if (q.c2c_status === 'not_met') {
        redFlags.push(`Qualification not met: ${q.requirement}`);
      }
    });
  } else {
    // If no qualifications specified, assume we meet them
    score += 40;
  }

  // Prevailing wage (10 points if false)
  if (analysis.prevailing_wage === false) {
    score += 10;
  } else if (analysis.prevailing_wage === true) {
    redFlags.push('Prevailing wage requirements apply');
  }

  // Service keywords match (20 points max)
  const textLower = rawText.toLowerCase();
  const matchedServices = C2C_PROFILE.services.filter((service) =>
    textLower.includes(service)
  );
  const serviceScore = (matchedServices.length / C2C_PROFILE.services.length) * 20;
  score += serviceScore;

  // Location match (15 points if Florida)
  const locationLower = (location || '').toLowerCase();
  const siteConditionsLower = (analysis.site_conditions || '').toLowerCase();
  if (
    locationLower.includes('florida') ||
    locationLower.includes('fl') ||
    siteConditionsLower.includes('florida') ||
    siteConditionsLower.includes('fl')
  ) {
    score += 15;
  }

  // Bonding requirements (15 points if <$2M, red flag if >$2M)
  const bonding = analysis.insurance_bonding;
  if (bonding) {
    const performanceBond = bonding.performance_bond || '';
    const paymentBond = bonding.payment_bond || '';

    // Extract dollar amounts from bonds
    const bondAmountRegex = /\$?([\d,]+(?:\.\d+)?)\s*(?:million|m)?/i;
    let maxBondAmount = 0;

    [performanceBond, paymentBond].forEach((bond) => {
      const match = bond.match(bondAmountRegex);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        if (bond.toLowerCase().includes('million') || bond.toLowerCase().includes('m')) {
          amount *= 1000000;
        }
        if (amount > maxBondAmount) {
          maxBondAmount = amount;
        }
      }
    });

    if (maxBondAmount > 0) {
      if (maxBondAmount > 2000000) {
        redFlags.push(`High bonding requirement: $${(maxBondAmount / 1000000).toFixed(1)}M`);
      } else {
        score += 15;
      }
    } else {
      // No bonding or couldn't parse - assume favorable
      score += 10;
    }
  } else {
    score += 10;
  }

  return {
    score: Math.min(100, Math.round(score)),
    redFlags,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { documentId, opportunityId }: AIAnalyzerRequest = await req.json();

    if (!documentId || !opportunityId) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Missing required fields: documentId, opportunityId',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to ai_processing
    await supabase
      .from('bid_documents')
      .update({
        processing_status: 'ai_processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Fetch raw OCR text and opportunity details
    const { data: analysisData, error: fetchError } = await supabase
      .from('bid_analysis')
      .select('raw_ocr_text')
      .eq('document_id', documentId)
      .single();

    if (fetchError || !analysisData) {
      throw new Error(`Failed to fetch OCR text: ${fetchError?.message}`);
    }

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('location')
      .eq('id', opportunityId)
      .single();

    const rawOcrText = analysisData.raw_ocr_text;

    if (!rawOcrText) {
      throw new Error('No OCR text available for analysis');
    }

    // Construct AI prompt
    const prompt = `You are analyzing a government contract bid package for C2C Restoration, a roofing and remediation contractor with SDVOSB certification.

C2C RESTORATION PROFILE:
- Certifications: SDVOSB (Service-Disabled Veteran-Owned Small Business)
- Licenses: Florida contractor licenses
- Primary Services: Roofing, asbestos abatement, remediation, demolition, drywall, electrical, flooring
- NAICS Codes: 238160 (Roofing), 238310 (Drywall), 236220 (Commercial Building), 236118 (Residential), 238210 (Electrical), 562910 (Remediation)
- Geographic Focus: Florida (will travel to nearby states)

Extract and structure the following information from this bid package. Compare requirements against C2C's capabilities and set c2c_status for qualifications.

Return ONLY valid JSON in this exact structure (no markdown, no code blocks):
{
  "scope_summary": "2-3 paragraph summary of the project scope and objectives",
  "technical_requirements": [{"category": "Materials|Installation|Standards", "requirement": "specific requirement text", "reference_section": "Section X.X"}],
  "submission_requirements": [{"item": "what document/item to submit", "format": "format requirements", "due": "due date or deadline"}],
  "qualifications_required": [{"type": "License|Certification|Experience", "requirement": "specific requirement", "c2c_status": "met|needs_verification|not_met"}],
  "timeline_schedule": {"start_date": "anticipated start date", "duration": "X days/months", "milestones": ["milestone 1", "milestone 2"]},
  "insurance_bonding": {"general_liability": "$X amount", "workers_comp": "$X amount", "performance_bond": "X% or $X", "payment_bond": "X% or $X"},
  "pricing_structure": {"structure_type": "lump sum|unit price|cost plus|other", "line_items": ["item 1", "item 2"], "payment_terms": "payment terms description"},
  "prevailing_wage": true/false,
  "site_conditions": "description of site location, access, and special conditions",
  "questions_flagged": ["question or concern 1", "question or concern 2"]
}

IMPORTANT INSTRUCTIONS:
1. For qualifications_required, evaluate each requirement against C2C's profile:
   - "met" if C2C clearly has this (e.g., Florida license for FL project, SDVOSB certification)
   - "needs_verification" if C2C might have it but needs to confirm (e.g., specific insurance amounts)
   - "not_met" if C2C clearly doesn't have it (e.g., out-of-state license, certification we don't have)

2. For prevailing_wage, return true if Davis-Bacon Act or prevailing wage is mentioned, false otherwise

3. Extract actual data from the document - don't make assumptions

4. Return raw JSON only - no markdown formatting, no \`\`\`json blocks

BID PACKAGE TEXT:
${rawOcrText}`;

    // Call Anthropic Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content[0].text;

    // Parse JSON response (handle markdown code blocks if present)
    let analysisOutput: AIAnalysisOutput;
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      analysisOutput = JSON.parse(jsonText.trim());
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }

    // Calculate fit score
    const { score: fitScore, redFlags } = calculateFitScore(
      analysisOutput,
      rawOcrText,
      opportunity?.location
    );

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    if (fitScore >= 70 && redFlags.length === 0) {
      confidenceLevel = 'high';
    } else if (fitScore >= 50) {
      confidenceLevel = 'medium';
    }

    // Update bid_analysis with all fields
    const { error: updateError } = await supabase
      .from('bid_analysis')
      .update({
        scope_summary: analysisOutput.scope_summary,
        technical_requirements: analysisOutput.technical_requirements,
        submission_requirements: analysisOutput.submission_requirements,
        qualifications_required: analysisOutput.qualifications_required,
        timeline_schedule: analysisOutput.timeline_schedule,
        insurance_bonding: analysisOutput.insurance_bonding,
        pricing_structure: analysisOutput.pricing_structure,
        prevailing_wage: analysisOutput.prevailing_wage,
        site_conditions: analysisOutput.site_conditions,
        questions_flagged: analysisOutput.questions_flagged,
        fit_score: fitScore,
        confidence_level: confidenceLevel,
        red_flags: redFlags,
        updated_at: new Date().toISOString(),
      })
      .eq('document_id', documentId);

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }

    // Update bid_documents status
    await supabase
      .from('bid_documents')
      .update({
        processing_status: 'completed',
        analysis_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Update opportunity status
    await supabase
      .from('opportunities')
      .update({
        status: 'reviewed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId);

    const processingTime = (Date.now() - startTime) / 1000;

    const response: AIAnalyzerResponse = {
      success: true,
      fit_score: fitScore,
      confidence: confidenceLevel,
      processing_time: processingTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Update document status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const body = await req.clone().json();
      const documentId = body.documentId;

      if (documentId) {
        await supabase
          .from('bid_documents')
          .update({
            processing_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
