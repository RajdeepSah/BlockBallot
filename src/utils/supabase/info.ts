/**
 * @module utils/supabase/info
 * @category Configuration
 *
 * Supabase configuration values extracted from environment variables.
 *
 * This module provides the project ID and public anonymous key
 * for constructing Supabase API URLs and making authenticated requests.
 *
 * ## Exports
 *
 * - `projectId` - Supabase project ID extracted from URL
 * - `publicAnonKey` - Public anonymous key for client-side requests
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

/**
 * Extracts the project ID from the Supabase URL.
 * Supabase URLs follow the format: https://<project-id>.supabase.co
 *
 * @returns The project ID extracted from the Supabase URL
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL is not set or URL format is invalid
 */
function extractProjectId(): string {
  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }

  try {
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    const match = hostname.match(/^([^.]+)\.supabase\.co$/);

    if (!match || !match[1]) {
      throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
    }

    return match[1];
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid Supabase URL')) {
      throw error;
    }
    throw new Error(`Failed to parse Supabase URL: ${supabaseUrl}`);
  }
}

/**
 * Supabase project ID extracted from the URL.
 * Used to construct API endpoints like: https://<projectId>.supabase.co/functions/v1/...
 */
export const projectId = extractProjectId();

/**
 * Supabase public anonymous key.
 * Used for client-side API calls that don't require user authentication.
 */
export const publicAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!publicAnonKey) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY'
  );
}
