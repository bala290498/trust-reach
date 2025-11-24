import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseServer } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const errorCode = requestUrl.searchParams.get('error_code')
  const next = requestUrl.searchParams.get('next') || '/'

  // Handle OAuth errors from Supabase (can come from query params or hash)
  if (error) {
    console.error('OAuth error:', { error, errorCode, errorDescription })
    const errorMsg = errorDescription || errorCode || error
    return NextResponse.redirect(new URL(`/?error=auth_failed&details=${encodeURIComponent(errorMsg)}`, requestUrl.origin))
  }

  if (!code) {
    // Check if there's an error in the hash (Supabase sometimes puts errors in hash)
    const hash = requestUrl.hash
    if (hash && hash.includes('error')) {
      const hashParams = new URLSearchParams(hash.substring(1))
      const hashError = hashParams.get('error')
      const hashErrorDesc = hashParams.get('error_description')
      const hashErrorCode = hashParams.get('error_code')
      if (hashError) {
        console.error('OAuth error from hash:', { error: hashError, errorCode: hashErrorCode, description: hashErrorDesc })
        const errorMsg = hashErrorDesc || hashErrorCode || hashError
        return NextResponse.redirect(new URL(`/?error=auth_failed&details=${encodeURIComponent(errorMsg)}`, requestUrl.origin))
      }
    }
    return NextResponse.redirect(new URL('/?error=no_code', requestUrl.origin))
  }

  // Create response first, then create supabase client
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))
  
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set(name, value)
        response.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        request.cookies.delete(name)
        response.cookies.delete(name)
      },
    },
  })

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  
  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError)
    return NextResponse.redirect(new URL(`/?error=auth_failed&details=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin))
  }

  if (data.user && data.user.email && supabaseServer) {
    // Migrate existing reviews from Clerk user_id to Supabase user_id by email
    try {
      // Find all reviews with this email but different user_id
      const { data: reviewsToMigrate } = await supabaseServer
        .from('company_reviews')
        .select('id, user_id, email')
        .eq('email', data.user.email)
        .neq('user_id', data.user.id)

      if (reviewsToMigrate && reviewsToMigrate.length > 0) {
        // Update all reviews with this email to use the new Supabase user_id
        const { error: updateError } = await supabaseServer
          .from('company_reviews')
          .update({ user_id: data.user.id })
          .eq('email', data.user.email)
          .neq('user_id', data.user.id)

        if (updateError) {
          console.error('Error migrating reviews:', updateError)
        } else {
          console.log(`✅ Migrated ${reviewsToMigrate.length} reviews to Supabase user ${data.user.id}`)
        }
      }
    } catch (migrationError) {
      console.error('Error during review migration:', migrationError)
      // Don't fail the auth flow if migration fails
    }
  }

  // Redirect after successful session exchange
  return NextResponse.redirect(new URL(next, requestUrl.origin), {
    headers: response.headers,
  })
}

