import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using Service Role Secret Key
 * 
 * IMPORTANT: Only use this in server-side code (API routes, Server Components, etc.)
 * Never expose the service role secret key to the client!
 * 
 * Supabase has changed from SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SERVICE_ROLE_SECRET
 * Get your secret key from: Supabase Dashboard > Project Settings > API > Secret Keys
 * 
 * This client bypasses Row Level Security (RLS) policies.
 * Use it for:
 * - Server-side API routes
 * - Admin operations
 * - Background jobs
 * - Data migrations
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleSecret = process.env.SUPABASE_SERVICE_ROLE_SECRET || ''

// Create server-side Supabase client with service role secret
export const supabaseServer = supabaseUrl && serviceRoleSecret
  ? createClient(supabaseUrl, serviceRoleSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null

// Types (re-exported from supabase.ts for convenience)
export type { CompanyReview, ProductListing } from './supabase'

