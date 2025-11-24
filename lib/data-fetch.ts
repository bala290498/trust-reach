import { cache } from 'react'
import { supabaseServer } from './supabase-server'
import type { CompanyReview } from './supabase'

/**
 * Server-side data fetching utilities with React cache
 * These functions are cached per request, reducing duplicate Supabase calls
 */

// Cache reviews fetch - shared across all components in the same request
export const getReviews = cache(async (): Promise<CompanyReview[]> => {
  if (!supabaseServer) {
    return []
  }

  try {
    const { data, error } = await supabaseServer
      .from('company_reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
})

// Cache reviews by brand name
export const getReviewsByBrand = cache(async (brandName: string): Promise<CompanyReview[]> => {
  if (!supabaseServer || !brandName) {
    return []
  }

  try {
    const { data, error } = await supabaseServer
      .from('company_reviews')
      .select('*')
      .ilike('company_name', brandName)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews by brand:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching reviews by brand:', error)
    return []
  }
})

// Cache user reviews
export const getUserReviews = cache(async (userId: string): Promise<CompanyReview[]> => {
  if (!supabaseServer || !userId) {
    return []
  }

  try {
    const { data, error } = await supabaseServer
      .from('company_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user reviews:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching user reviews:', error)
    return []
  }
})

