import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id, email, phone } = await request.json()

    console.log('🗑️ Delete Product Request:', { id, email, phone })

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

    // Verify that the product belongs to this email/phone
    const { data: existingProduct, error: fetchError } = await client
      .from('product_listings')
      .select('email, phone')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching product:', fetchError)
      return NextResponse.json(
        { error: 'Product not found', details: fetchError.message },
        { status: 404 }
      )
    }

    if (!existingProduct) {
      console.error('❌ Product not found for ID:', id)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Normalize for comparison
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phone.replace(/\s/g, '').trim()
    const existingEmail = existingProduct.email.toLowerCase().trim()
    const existingPhone = existingProduct.phone.replace(/\s/g, '').trim()

    if (normalizedEmail !== existingEmail || normalizedPhone !== existingPhone) {
      return NextResponse.json(
        { error: 'You can only delete your own products' },
        { status: 403 }
      )
    }

    // Delete the product listing
    const { error: deleteError } = await client
      .from('product_listings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete product', message: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

