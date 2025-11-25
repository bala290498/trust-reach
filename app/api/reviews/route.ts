import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json([], { status: 500 })
    }

    // Check if cache should be bypassed (via query parameter)
    const searchParams = request.nextUrl.searchParams
    const bypassCache = searchParams.get('t') !== null

    const { data, error } = await supabaseServer
      .from('company_reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json([], { status: 500 })
    }

    // If bypassing cache, use no-store, otherwise use cache headers
    const headers: HeadersInit = bypassCache
      ? { 'Cache-Control': 'no-store' }
      : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }

    return NextResponse.json(data || [], { headers })
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60 // Revalidate every 1 minute

