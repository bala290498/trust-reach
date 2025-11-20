import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id, email, phone } = await request.json()

    console.log('🗑️ Delete Review Request:', { id, email, phone })

    if (!id || !email || !phone) {
      return NextResponse.json(
        { error: 'ID, email, and phone are required' },
        { status: 400 }
      )
    }

    // Use server-side client to bypass RLS for delete operation
    // If not available, fall back to regular client (RLS policies should allow it)
    const client = supabaseServer || supabase
    
    if (!client) {
      console.error('❌ No Supabase client available')
      return NextResponse.json(
        { error: 'Server configuration error - Supabase not configured' },
        { status: 500 }
      )
    }
    
    console.log('✅ Using Supabase client:', supabaseServer ? 'server-side' : 'client-side')

    // Verify that the review belongs to this email/phone
    const { data: existingReview, error: fetchError } = await client
      .from('company_reviews')
      .select('email, phone')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching review:', fetchError)
      console.error('Fetch error details:', JSON.stringify(fetchError, null, 2))
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

    console.log('🔍 Email comparison:', { normalizedEmail, existingEmail, match: normalizedEmail === existingEmail })
    console.log('🔍 Phone comparison:', { normalizedPhone, existingPhone, match: normalizedPhone === existingPhone })

    if (normalizedEmail !== existingEmail || normalizedPhone !== existingPhone) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      )
    }

    // Delete the review
    console.log('🗑️ Attempting to delete review:', id)
    const { error: deleteError, data: deleteData } = await client
      .from('company_reviews')
      .delete()
      .eq('id', id)
      .select()

    console.log('🗑️ Delete result:', { deleteError, deleteData })

    if (deleteError) {
      console.error('❌ Error deleting review:', deleteError)
      console.error('Delete error code:', deleteError.code)
      console.error('Delete error message:', deleteError.message)
      console.error('Delete error details:', deleteError.details)
      console.error('Delete error hint:', deleteError.hint)
      
      return NextResponse.json(
        { 
          error: 'Failed to delete review', 
          message: deleteError.message || 'Database error',
          code: deleteError.code,
          details: process.env.NODE_ENV === 'development' ? deleteError.details : undefined,
        },
        { status: 500 }
      )
    }

    console.log('✅ Review deleted successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

