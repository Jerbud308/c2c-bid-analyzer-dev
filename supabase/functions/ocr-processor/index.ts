import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import {
  corsHeaders,
  type OCRProcessorRequest,
  type OCRProcessorResponse,
  type ErrorResponse,
  type GoogleCloudCredentials,
  type VisionAPIResponse,
} from '../_shared/types.ts';

// Helper: Base64 URL encode
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper: Convert PEM private key to ArrayBuffer
async function pemToArrayBuffer(pem: string): Promise<ArrayBuffer> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Create signed JWT for Google Cloud
async function createJWT(credentials: GoogleCloudCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-vision',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const keyData = await pemToArrayBuffer(credentials.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the token
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${unsignedToken}.${encodedSignature}`;
}

// Helper: Get Google Cloud access token
async function getAccessToken(credentials: GoogleCloudCredentials): Promise<string> {
  const jwt = await createJWT(credentials);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { documentId, opportunityId, filePath }: OCRProcessorRequest = await req.json();

    if (!documentId || !opportunityId || !filePath) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Missing required fields: documentId, opportunityId, filePath',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to ocr_processing
    await supabase
      .from('bid_documents')
      .update({
        processing_status: 'ocr_processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('bid-documents')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = base64Encode(new Uint8Array(arrayBuffer));

    // Get Google Cloud credentials
    const credentialsJson = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    if (!credentialsJson) {
      throw new Error('GOOGLE_CLOUD_CREDENTIALS not configured');
    }
    const credentials: GoogleCloudCredentials = JSON.parse(credentialsJson);

    // Get access token
    const accessToken = await getAccessToken(credentials);

    // Call Google Cloud Vision API
    const visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
    const visionRequest = {
      requests: [
        {
          image: {
            content: base64Content,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
            },
          ],
        },
      ],
    };

    const visionResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest),
    });

    if (!visionResponse.ok) {
      const error = await visionResponse.text();
      throw new Error(`Vision API error: ${error}`);
    }

    const visionData: VisionAPIResponse = await visionResponse.json();

    // Extract text from response
    const firstResponse = visionData.responses[0];
    if (firstResponse.error) {
      throw new Error(`Vision API error: ${firstResponse.error.message}`);
    }

    const extractedText = firstResponse.fullTextAnnotation?.text || '';
    const pageCount = firstResponse.fullTextAnnotation?.pages?.length || 1;

    if (!extractedText) {
      throw new Error('No text extracted from PDF');
    }

    // Store raw OCR text in bid_analysis table (upsert)
    const { error: analysisError } = await supabase
      .from('bid_analysis')
      .upsert({
        opportunity_id: opportunityId,
        document_id: documentId,
        raw_ocr_text: extractedText,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'document_id',
      });

    if (analysisError) {
      throw new Error(`Failed to store OCR text: ${analysisError.message}`);
    }

    // Update bid_documents status
    await supabase
      .from('bid_documents')
      .update({
        processing_status: 'ocr_completed',
        ocr_completed_at: new Date().toISOString(),
        page_count: pageCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Trigger AI analyzer asynchronously
    const aiUrl = `${supabaseUrl}/functions/v1/ai-analyzer`;
    fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        documentId,
        opportunityId,
      }),
    }).catch((error) => {
      console.error('Failed to trigger AI analyzer:', error);
    });

    const processingTime = (Date.now() - startTime) / 1000;

    const response: OCRProcessorResponse = {
      success: true,
      text_length: extractedText.length,
      page_count: pageCount,
      processing_time_seconds: processingTime,
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
