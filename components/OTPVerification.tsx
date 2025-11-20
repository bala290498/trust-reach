'use client'

import { useState, useEffect } from 'react'
import { Loader2, Mail, Phone } from 'lucide-react'

interface OTPVerificationProps {
  email: string
  phone: string
  onVerified: (otp?: string) => void
  onCancel: () => void
  autoSend?: boolean // New prop to auto-send OTP on mount
}

export default function OTPVerification({ email, phone, onVerified, onCancel, autoSend = false }: OTPVerificationProps) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const sendOTP = async () => {
    setSending(true)
    setError('')
    
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setResendCooldown(60) // 60 seconds cooldown
        
        // Countdown timer
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        // Show OTP in development mode
        if (data.otp) {
          alert(`OTP sent! (Dev Mode - OTP: ${data.otp})\n\nNote: In production, check your email inbox.`)
        } else {
          alert('OTP sent successfully! Please check your email inbox.')
        }
      } else {
        const errorMsg = data.error || data.message || 'Failed to send OTP'
        const errorDetails = data.details ? `\n\nDetails: ${JSON.stringify(data.details, null, 2)}` : ''
        setError(errorMsg)
        alert(`Error: ${errorMsg}${errorDetails}\n\nPlease check:\n1. Sender email is verified in Brevo\n2. Domain authentication is set up\n3. Check terminal logs for more details`)
        console.error('OTP Send Error:', data)
      }
    } catch (error: any) {
      setError('Failed to send OTP. Please try again.')
      console.error('Error sending OTP:', error)
    } finally {
      setSending(false)
    }
  }

  // Auto-send OTP on mount if autoSend is true
  useEffect(() => {
    if (autoSend && !otpSent && !sending && email && phone) {
      // Use a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        sendOTP()
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend])

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Normalize email and phone before sending (same as backend)
      const normalizedEmail = email.toLowerCase().trim()
      const normalizedPhone = phone.replace(/\s/g, '').trim()
      
      console.log('📤 Sending verification request:', { 
        email: normalizedEmail, 
        phone: normalizedPhone, 
        otp,
        originalEmail: email,
        originalPhone: phone
      })
      
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, phone: normalizedPhone, otp }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onVerified(otp)
      } else {
        setError(data.error || data.message || 'Invalid OTP')
        setOtp('')
      }
    } catch (error: any) {
      setError('Failed to verify OTP. Please try again.')
      console.error('Error verifying OTP:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">OTP Verification Required</h3>
        <p className="text-sm text-gray-600 mb-4">
          To ensure only verified users can submit reviews, please verify your email and phone number.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-gray-500" />
            <span className="text-gray-700">{email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-gray-500" />
            <span className="text-gray-700">{phone}</span>
          </div>
        </div>
      </div>

      {!otpSent ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={sendOTP}
            disabled={sending}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <Mail size={20} />
                <span>Send OTP to Email</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Enter OTP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify OTP</span>
              )}
            </button>
            <button
              type="button"
              onClick={sendOTP}
              disabled={sending || resendCooldown > 0}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

