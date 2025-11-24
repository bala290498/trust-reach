import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { cache } from 'react'

// Cache the reviews fetch function per brand
const getBrandReviews = cache(async (brandName: string) => {
  if (!supabaseServer) {
    return []
  }

  try {
    const { data, error } = await supabaseServer
      .from('company_reviews')
      .select('*')
      .ilike('company_name', brandName)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brand reviews:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching brand reviews:', error)
    return []
  }
})

export async function GET(
  request: NextRequest,
  { params }: { params: { brandName: string } }
) {
  try {
    const { brandName } = params
    const decodedBrandName = decodeURIComponent(brandName)
    const reviews = await getBrandReviews(decodedBrandName)

    // Add caching headers - cache for 1 minute, revalidate in background
    return NextResponse.json(reviews, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in brand reviews API:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60 // Revalidate every 1 minute

