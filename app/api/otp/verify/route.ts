import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const { email, phone, otp } = await request.json()

    console.log('🔐 OTP Verification Request:', { email, phone, otpLength: otp?.length })

    if (!email || !phone || !otp) {
      return NextResponse.json(
        { error: 'Email, phone, and OTP are required' },
        { status: 400 }
      )
    }

    const result = verifyOTP(email, phone, otp)
    
    console.log('✅ Verification result:', result.valid ? 'SUCCESS' : 'FAILED', result.message)

    if (result.valid) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

