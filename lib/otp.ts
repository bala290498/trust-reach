// OTP storage (in-memory - for production, consider using Redis)
interface OTPData {
  otp: string
  email: string
  phone: string
  expiresAt: number
  attempts: number
}

// Use global object to persist across hot reloads in Next.js dev mode
declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OTPData> | undefined
}

// Initialize OTP store - use global in dev to persist across hot reloads
const otpStore = global.__otpStore || new Map<string, OTPData>()

if (process.env.NODE_ENV !== 'production') {
  global.__otpStore = otpStore
}

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function generateOTP(): string {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeOTP(email: string, phone: string, otp: string): string {
  // Normalize email and phone to ensure consistent keys
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedPhone = phone.replace(/\s/g, '').trim()
  const key = `${normalizedEmail}:${normalizedPhone}`
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes expiry
  
  console.log('💾 Storing OTP:', { key, email: normalizedEmail, phone: normalizedPhone, otp })
  console.log('📦 Store size before:', otpStore.size)
  
  otpStore.set(key, {
    otp,
    email: normalizedEmail,
    phone: normalizedPhone,
    expiresAt,
    attempts: 0,
  })
  
  console.log('📦 Store size after:', otpStore.size)
  console.log('📦 All keys in store:', Array.from(otpStore.keys()))
  console.log('✅ OTP stored at key:', key)
  
  return key
}

export function verifyOTP(email: string, phone: string, inputOTP: string): { valid: boolean; message: string } {
  // Normalize email and phone to match storage format
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedPhone = phone.replace(/\s/g, '').trim()
  const key = `${normalizedEmail}:${normalizedPhone}`
  
  console.log('🔍 Verifying OTP:', { 
    key, 
    email: normalizedEmail, 
    phone: normalizedPhone, 
    inputOTP,
    originalEmail: email,
    originalPhone: phone
  })
  console.log('📦 OTP Store size:', otpStore.size)
  console.log('📦 OTP Store keys:', Array.from(otpStore.keys()))
  
  // Log all stored OTPs for debugging
  for (const [storeKey, storeData] of otpStore.entries()) {
    console.log(`  - Key: ${storeKey}, OTP: ${storeData.otp}, Expires: ${new Date(storeData.expiresAt).toISOString()}, Attempts: ${storeData.attempts}`)
  }
  
  const data = otpStore.get(key)
  
  if (!data) {
    console.log('❌ OTP not found for key:', key)
    console.log('🔍 Available keys in store:', Array.from(otpStore.keys()))
    // Try to find a close match
    for (const [storeKey, storeData] of otpStore.entries()) {
      if (storeKey.toLowerCase().includes(normalizedEmail.toLowerCase()) || 
          storeKey.includes(normalizedPhone)) {
        console.log('⚠️ Found similar key:', storeKey, 'but exact match failed')
      }
    }
    return { valid: false, message: 'OTP not found. Please request a new OTP.' }
  }
  
  if (data.expiresAt < Date.now()) {
    otpStore.delete(key)
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' }
  }
  
  if (data.attempts >= 5) {
    otpStore.delete(key)
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' }
  }
  
  if (data.otp !== inputOTP) {
    data.attempts++
    return { valid: false, message: 'Incorrect OTP. Please try again.' }
  }
  
  // OTP verified successfully
  otpStore.delete(key)
  return { valid: true, message: 'OTP verified successfully.' }
}

export function getOTPData(email: string, phone: string): OTPData | null {
  // Normalize to match storage format
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedPhone = phone.replace(/\s/g, '').trim()
  const key = `${normalizedEmail}:${normalizedPhone}`
  return otpStore.get(key) || null
}

