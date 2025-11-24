import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client with auth for browser/client-side
export const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabaseAuth.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper to get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabaseAuth.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

// Sign in with Google
export async function signInWithGoogle() {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Server-side helper to get user from request
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  
  if (error) {
    console.error('Error getting user from token:', error)
    return null
  }
  return user
}

