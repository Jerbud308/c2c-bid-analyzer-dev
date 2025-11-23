import { supabase } from './supabase'
import type { UploadResponse, StatusResponse, AnalysisResponse } from '@/types'

const STORAGE_BUCKET = 'bid-documents'

/**
 * Upload a bid document PDF and create opportunity record
 */
export async function uploadBid(
  file: File,
  metadata: {
    solicitation_number?: string
    title: string
    agency?: string
  }
): Promise<UploadResponse> {
  try {
    // Validate file
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed')
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      throw new Error('File size must be less than 50MB')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path)

    // Create opportunity record
    const { data: opportunity, error: dbError } = await supabase
      .from('opportunities')
      .insert({
        solicitation_number: metadata.solicitation_number || null,
        title: metadata.title,
        agency: metadata.agency || null,
        status: 'uploaded',
        processing_status: 'uploaded',
        processing_substatus: 'Document uploaded successfully',
        completion_percent: 0,
        ready_for_review: false,
        pdf_url: publicUrl,
      })
      .select('id')
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadData.path])
      throw new Error(`Database error: ${dbError.message}`)
    }

    return {
      opportunityId: opportunity.id,
      message: 'Upload successful',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred during upload')
  }
}

/**
 * Check processing status of an opportunity
 */
export async function checkStatus(
  opportunityId: string
): Promise<StatusResponse> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch status: ${error.message}`)
    }

    if (!data) {
      throw new Error('Opportunity not found')
    }

    return data as StatusResponse
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while checking status')
  }
}

/**
 * Get complete analysis results for an opportunity
 */
export async function getAnalysis(
  opportunityId: string
): Promise<AnalysisResponse> {
  try {
    // Fetch opportunity
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (opportunityError) {
      throw new Error(`Failed to fetch opportunity: ${opportunityError.message}`)
    }

    if (!opportunity) {
      throw new Error('Opportunity not found')
    }

    // Fetch analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single()

    if (analysisError && analysisError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Failed to fetch analysis: ${analysisError.message}`)
    }

    if (!analysis) {
      // No analysis yet
      return {
        opportunity,
        analysis: null,
        technical_requirements: [],
        submission_requirements: [],
        qualifications: [],
        timeline: null,
        insurance: null,
        pricing: null,
        site_conditions: [],
        questions: [],
      }
    }

    // Fetch all related data in parallel
    const [
      technicalReqs,
      submissionReqs,
      qualifications,
      timeline,
      insurance,
      pricing,
      siteConditions,
      questions,
    ] = await Promise.all([
      supabase
        .from('technical_requirements')
        .select('*')
        .eq('analysis_id', analysis.id)
        .order('created_at'),
      supabase
        .from('submission_requirements')
        .select('*')
        .eq('analysis_id', analysis.id)
        .order('created_at'),
      supabase
        .from('qualifications')
        .select('*')
        .eq('analysis_id', analysis.id)
        .order('created_at'),
      supabase
        .from('timeline')
        .select('*')
        .eq('analysis_id', analysis.id)
        .single(),
      supabase
        .from('insurance')
        .select('*')
        .eq('analysis_id', analysis.id)
        .single(),
      supabase
        .from('pricing')
        .select('*')
        .eq('analysis_id', analysis.id)
        .single(),
      supabase
        .from('site_conditions')
        .select('*')
        .eq('analysis_id', analysis.id)
        .order('created_at'),
      supabase
        .from('questions')
        .select('*')
        .eq('analysis_id', analysis.id)
        .order('priority', { ascending: false })
        .order('created_at'),
    ])

    return {
      opportunity,
      analysis,
      technical_requirements: technicalReqs.data || [],
      submission_requirements: submissionReqs.data || [],
      qualifications: qualifications.data || [],
      timeline: timeline.data || null,
      insurance: insurance.data || null,
      pricing: pricing.data || null,
      site_conditions: siteConditions.data || [],
      questions: questions.data || [],
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching analysis')
  }
}

/**
 * Update opportunity status (e.g., mark as pursue or pass)
 */
export async function updateOpportunityStatus(
  opportunityId: string,
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('opportunities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', opportunityId)

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating status')
  }
}
