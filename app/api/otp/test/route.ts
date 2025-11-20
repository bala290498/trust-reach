import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const brevoApiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME

  return NextResponse.json({
    brevoConfigured: !!brevoApiKey,
    apiKeyPresent: !!brevoApiKey,
    apiKeyLength: brevoApiKey?.length || 0,
    apiKeyPrefix: brevoApiKey?.substring(0, 10) || 'N/A',
    senderEmail: senderEmail || 'Not set',
    senderName: senderName || 'Not set',
    nodeEnv: process.env.NODE_ENV,
  })
}

