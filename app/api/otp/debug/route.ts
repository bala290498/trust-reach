import { NextRequest, NextResponse } from 'next/server'
import { getOTPData } from '@/lib/otp'

// Debug endpoint to check OTP store (remove in production)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')

    if (!email || !phone) {
      return NextResponse.json({
        error: 'Email and phone are required',
      }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phone.replace(/\s/g, '').trim()
    const key = `${normalizedEmail}:${normalizedPhone}`

    const data = getOTPData(normalizedEmail, normalizedPhone)

    return NextResponse.json({
      key,
      normalizedEmail,
      normalizedPhone,
      found: !!data,
      data: data ? {
        otp: data.otp,
        expiresAt: new Date(data.expiresAt).toISOString(),
        attempts: data.attempts,
        isExpired: data.expiresAt < Date.now(),
      } : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

