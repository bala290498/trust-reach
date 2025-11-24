import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { cache } from 'react'

// Cache the reviews fetch function
const getReviews = cache(async () => {
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

export async function GET() {
  try {
    const reviews = await getReviews()

    // Add caching headers - cache for 1 minute, revalidate in background
    // Reviews change more frequently, so shorter cache time
    return NextResponse.json(reviews, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60 // Revalidate every 1 minute

