import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id, email, phone, company_name, website_url, category, rating, review } = await request.json()

    console.log('📝 Update Review Request:', { id, email, phone })

    if (!id || !email || !phone || !company_name || !category || !rating || !review) {
      return NextResponse.json(
        { error: 'ID, email, phone, company name, category, rating, and review are required' },
        { status: 400 }
      )
    }

    // Use server-side client to bypass RLS for update operation
    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
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

    // Verify that the review belongs to this email/phone
    const { data: existingReview, error: fetchError } = await client
      .from('company_reviews')
      .select('email, phone')
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

    // Normalize for comparison
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phone.replace(/\s/g, '').trim()
    const existingEmail = existingReview.email.toLowerCase().trim()
    const existingPhone = existingReview.phone.replace(/\s/g, '').trim()

    if (normalizedEmail !== existingEmail || normalizedPhone !== existingPhone) {
      return NextResponse.json(
        { error: 'You can only modify your own reviews' },
        { status: 403 }
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

    // Update the review
    const { error: updateError } = await client
      .from('company_reviews')
      .update({
        company_name,
        website_url: website_url || null,
        category,
        rating,
        review,
      })
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

