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

    const { orderId, email, phone, quantity, message } = await request.json()

    console.log('📦 Bulk Order Interest Request:', { orderId, userId, email, phone, quantity })

    if (!orderId || !email || !phone || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Order ID, email, phone, and valid quantity are required' },
        { status: 400 }
      )
    }

    // Use server-side client to bypass RLS for insert operation
    const client = supabaseServer || supabase

    if (!client) {
      console.error('❌ No Supabase client available')
      return NextResponse.json(
        { error: 'Server configuration error - Supabase not configured' },
        { status: 500 }
      )
    }

    // Insert bulk order interest
    const { error: insertError } = await client
      .from('bulk_order_interests')
      .insert([{
        order_id: orderId,
        user_id: userId,
        email,
        phone,
        quantity,
        message: message || null,
      }])

    if (insertError) {
      console.error('Error submitting bulk order interest:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit interest', message: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your interest has been submitted successfully. Team will reach you shortly.',
    })
  } catch (error: any) {
    console.error('Error submitting bulk order interest:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

