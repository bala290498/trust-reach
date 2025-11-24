import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  try {
    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userId = user.id

    const { id, company_name, rating, review } = await request.json()

    console.log('📝 Update Review Request:', { id, userId })

    if (!id || !company_name || !rating || !review) {
      return NextResponse.json(
        { error: 'ID, company name, rating, and review are required' },
        { status: 400 }
      )
    }

    // Use server-side client to bypass RLS for update operation
    // If not available, fall back to regular client (RLS policies should allow it)
    const client = supabaseServer || supabase

    if (!client) {
      console.error('❌ No Supabase client available')
      return NextResponse.json(
        { error: 'Server configuration error - Supabase not configured' },
        { status: 500 }
      )
    }

    // Verify that the review belongs to this user
    const { data: existingReview, error: fetchError } = await client
      .from('company_reviews')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching review for update:', fetchError)
      return NextResponse.json(
        { error: 'Review not found', details: fetchError.message },
        { status: 404 }
      )
    }

    if (!existingReview) {
      console.error('❌ Review not found for ID:', id)
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingReview.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only modify your own reviews' },
        { status: 403 }
      )
    }

    // Update the review
    const updateData = {
      company_name,
      rating,
      review,
    }
    
    const { error: updateError } = await client
      .from('company_reviews')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json(
        { error: 'Failed to update review', message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

