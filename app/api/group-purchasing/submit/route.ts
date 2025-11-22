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

    const { email, phone } = await request.json()

    console.log('📦 Bulk Order Interest Request:', { userId, email, phone })

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone are required' },
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

    // Insert bulk order interest - only store email and phone
    const { error: insertError } = await client
      .from('bulk_order_interests')
      .insert([{
        email: email.trim(),
        phone: phone.trim(),
      }])

    if (insertError) {
      console.error('❌ Error submitting bulk order interest:', insertError)
      console.error('Error details:', JSON.stringify(insertError, null, 2))
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to submit interest', 
          message: insertError.message,
          details: insertError.details,
          code: insertError.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Bulk order interest saved successfully')

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

