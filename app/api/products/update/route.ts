import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id, email, phone, platform_name, product_name, category, url, rating, review } = await request.json()

    console.log('📝 Update Product Request:', { id, email, phone })

    if (!id || !email || !phone || !platform_name || !product_name || !category || !url || !rating || !review) {
      return NextResponse.json(
        { error: 'ID, email, phone, platform name, product name, category, URL, rating, and review are required' },
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

    // Verify that the product belongs to this email/phone
    const { data: existingProduct, error: fetchError } = await client
      .from('product_listings')
      .select('email, phone')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching product for update:', fetchError)
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
        { error: 'You can only modify your own products' },
        { status: 403 }
      )
    }

    // Update the product listing
    const { error: updateError } = await client
      .from('product_listings')
      .update({
        platform_name,
        product_name,
        category,
        url,
        rating,
        review,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating product:', updateError)
      return NextResponse.json(
        { error: 'Failed to update product', message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

