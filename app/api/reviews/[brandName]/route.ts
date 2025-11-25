import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { brandName: string } }
) {
  try {
    if (!supabaseServer) {
      return NextResponse.json([], { status: 500 })
    }

    const { brandName } = params
    const decodedBrandName = decodeURIComponent(brandName)

    // Check if cache should be bypassed (via query parameter)
    const searchParams = request.nextUrl.searchParams
    const bypassCache = searchParams.get('t') !== null

    // Use case-insensitive exact match
    // Fetch all reviews and filter client-side to handle exact matching
    // This ensures reviews match the exact brand name regardless of case/whitespace
    const { data, error } = await supabaseServer
      .from('company_reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brand reviews:', error)
      return NextResponse.json([], { status: 500 })
    }

    // Use exact match (case-insensitive, trimmed) - must match brand name from markdown file exactly
    const normalizedBrandName = decodedBrandName.trim().toLowerCase()
    const filteredReviews = (data || []).filter((review: any) => {
      const reviewCompanyName = review.company_name?.trim().toLowerCase() || ''
      const matches = reviewCompanyName === normalizedBrandName
      if (!matches && data.length > 0) {
        console.log(`Review mismatch - Brand: "${normalizedBrandName}", Review company_name: "${reviewCompanyName}"`)
      }
      return matches
    })
    
    console.log(`Found ${filteredReviews.length} reviews for brand "${decodedBrandName}" (normalized: "${normalizedBrandName}")`)

    // If bypassing cache, use no-store, otherwise use cache headers
    const headers: HeadersInit = bypassCache
      ? { 'Cache-Control': 'no-store' }
      : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }

    return NextResponse.json(filteredReviews, { headers })
  } catch (error) {
    console.error('Error in brand reviews API:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60 // Revalidate every 1 minute

