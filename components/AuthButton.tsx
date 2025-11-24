'use client'

import { useState, useEffect } from 'react'
import { supabaseAuth, signInWithGoogle, signOut } from '@/lib/supabase-auth'
import type { User } from '@supabase/supabase-js'
import { LogOut, User as UserIcon } from 'lucide-react'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabaseAuth.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.email || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden md:block">
            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-all"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSignIn}
        className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-all duration-200 whitespace-nowrap"
      >
        Sign In
      </button>
      <button
        onClick={handleSignIn}
        className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all duration-200 whitespace-nowrap"
      >
        Sign Up
      </button>
    </div>
  )
}

