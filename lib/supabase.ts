import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a safe Supabase client that handles missing credentials
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Types
export interface CompanyReview {
  id?: string
  user_id?: string
  email: string
  phone: string
  company_name: string
  website_url?: string
  category: string
  rating: number
  review: string
  created_at?: string
}

export interface ProductListing {
  id?: string
  email: string
  phone: string
  platform_name: string
  product_name: string
  category: string
  url: string
  rating: number
  review: string
  created_at?: string
}

