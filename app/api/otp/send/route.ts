import { NextRequest, NextResponse } from 'next/server'
import * as brevo from '@getbrevo/brevo'
import { generateOTP, storeOTP } from '@/lib/otp'

const brevoApiKey = process.env.BREVO_API_KEY

if (!brevoApiKey) {
  console.error('❌ BREVO_API_KEY is not set in environment variables')
  console.error('💡 Make sure you have copied env.example to .env.local and restarted the server')
}

// Note: We'll create API instances per request to ensure API key is set correctly

export async function POST(request: NextRequest) {
  console.log('📨 OTP Send Request Received')
  console.log('🔑 BREVO_API_KEY present:', !!brevoApiKey)
  console.log('📧 Sender Email:', process.env.BREVO_SENDER_EMAIL || 'Not set')
  
  try {
    const { email, phone } = await request.json()
    console.log('📬 Request data - Email:', email, 'Phone:', phone)

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone format' },
        { status: 400 }
      )
    }

    // Normalize email and phone before storing
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phone.replace(/\s/g, '').trim()
    
    // Generate OTP
    const otp = generateOTP()
    const storedKey = storeOTP(normalizedEmail, normalizedPhone, otp)
    
    console.log('✅ OTP stored successfully with key:', storedKey)
    console.log('📧 Normalized email:', normalizedEmail)
    console.log('📱 Normalized phone:', normalizedPhone)
    console.log('🔑 Generated OTP:', otp)
    
    console.log('📧 Sending OTP to normalized email:', normalizedEmail)

    // Send OTP via Brevo
    if (!brevoApiKey) {
      // Development mode - return OTP in response (remove in production)
      console.log('⚠️ BREVO_API_KEY not found - Running in dev mode')
      console.log('📧 OTP for', email, ':', otp)
      return NextResponse.json({
        success: true,
        message: 'OTP generated (Dev Mode - Brevo not configured)',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Only in dev
      })
    }

    try {
      // Create API instance and set API key
      const requestApiInstance = new brevo.TransactionalEmailsApi()
      // Set API key using the correct enum
      requestApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey)
      
      console.log('🔑 API key set for request')
      
      const sendSmtpEmail = new brevo.SendSmtpEmail()
      sendSmtpEmail.subject = 'Your TrustReach OTP Verification Code'
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .otp-box { background: #f4f4f4; border: 2px solid #007dff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007dff; letter-spacing: 5px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>OTP Verification Code</h2>
            <p>Hello,</p>
            <p>Your OTP verification code for TrustReach.in is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>Best regards,<br>TrustReach.in Team</p>
            </div>
          </div>
        </body>
        </html>
      `
      sendSmtpEmail.textContent = `Your TrustReach OTP verification code is: ${otp}. This code will expire in 10 minutes.`
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@trustreach.in'
      const senderName = process.env.BREVO_SENDER_NAME || 'TrustReach'
      
      console.log('📤 Sending email from:', senderEmail, 'to:', email)
      
      sendSmtpEmail.sender = {
        name: senderName,
        email: senderEmail,
      }
      sendSmtpEmail.to = [{ email }]
      
      // Add replyTo (optional but recommended)
      sendSmtpEmail.replyTo = {
        email: senderEmail,
        name: senderName,
      }

      const result = await requestApiInstance.sendTransacEmail(sendSmtpEmail)
      
      console.log('✅ OTP email sent successfully via Brevo')
      console.log('📧 Email sent to:', email)
      console.log('📝 Brevo response:', JSON.stringify(result, null, 2))

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully to your email',
      })
    } catch (brevoError: any) {
      console.error('❌ Brevo API Error:', brevoError)
      
      // Extract error message from response
      let errorMessage = 'Failed to send OTP email'
      let errorCode = null
      
      if (brevoError.response?.data) {
        errorMessage = brevoError.response.data.message || errorMessage
        errorCode = brevoError.response.data.code
        console.error('Brevo error message:', errorMessage)
        console.error('Brevo error code:', errorCode)
      } else if (brevoError.message) {
        errorMessage = brevoError.message
      }
      
      // Check if it's an authentication error
      if (errorCode === 'unauthorized' || errorMessage.includes('authentication')) {
        errorMessage = 'API key authentication failed. Please check your BREVO_API_KEY in .env.local'
        console.error('🔑 Authentication issue - API key may be invalid or not set correctly')
      }
      
      return NextResponse.json(
        {
          error: 'Failed to send OTP email',
          message: errorMessage,
          code: errorCode,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

