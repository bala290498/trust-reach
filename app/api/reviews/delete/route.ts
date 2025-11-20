import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id } = await request.json()

    console.log('🗑️ Delete Review Request:', { id, userId })

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
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

    // Verify that the review belongs to this user
    const { data: existingReview, error: fetchError } = await client
      .from('company_reviews')
      .select('user_id')
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

    // Verify ownership
    if (existingReview.user_id !== userId) {
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

