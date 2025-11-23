/**
 * Supabase client initialization
 *
 * This file initializes and exports a configured Supabase client for use
 * throughout the application. It uses environment variables for configuration.
 *
 * Note: For full type safety, generate database types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase project URL
 * Set via VITE_SUPABASE_URL environment variable
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/**
 * Supabase anonymous key
 * Set via VITE_SUPABASE_ANON_KEY environment variable
 * This is safe to use in client-side code
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validates that required environment variables are set
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable: VITE_SUPABASE_URL\n' +
      'Please add it to your .env file'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing environment variable: VITE_SUPABASE_ANON_KEY\n' +
      'Please add it to your .env file'
    );
  }

  // Basic URL validation
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      `Invalid VITE_SUPABASE_URL: ${supabaseUrl}\n` +
      'Must be a valid URL (e.g., https://your-project.supabase.co)'
    );
  }
}

// Validate environment on module load
validateEnvironment();

/**
 * Configured Supabase client instance
 *
 * This client is configured with the project URL and anonymous key from
 * environment variables. For enhanced type safety, generate and import
 * database types using the Supabase CLI.
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase'
 *
 * const { data, error } = await supabase
 *   .from('opportunities')
 *   .select('*')
 * ```
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Disable auto-refresh for anonymous users
      autoRefreshToken: false,
      // Don't persist session in localStorage
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'c2c-bid-analyzer',
      },
    },
  }
);

/**
 * Type-safe database client
 * Provides direct access to typed database operations
 */
export const db = supabase;
