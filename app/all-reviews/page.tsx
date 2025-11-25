'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabaseAuth } from '@/lib/supabase-auth'
import type { User } from '@supabase/supabase-js'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { ArrowLeft, ChevronRight, ArrowRight } from 'lucide-react'

export default function AllReviewsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoaded(true)
    })

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoaded(true)
    })

    return () => subscription.unsubscribe()
  }, [])
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null)
  const [brandCards, setBrandCards] = useState<Array<{ id: string; brand_name: string }>>([])

  const fetchReviews = useCallback(async (bypassCache = false) => {
    try {
      // Use cached API route instead of direct Supabase call
      // The API route handles caching with headers
      // After creating a review, bypass cache to get fresh data
      const cacheOption = bypassCache ? 'no-store' : 'force-cache'
      const url = bypassCache ? `/api/reviews?t=${Date.now()}` : '/api/reviews'
      
      const response = await fetch(url, {
        cache: cacheOption,
      })
      
      if (response.ok) {
        const data = await response.json()
        // Limit to 30 reviews on client side
        setReviews(data.slice(0, 30) || [])
      } else {
        throw new Error('Failed to fetch reviews')
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch brands to get brand IDs for consistent slugs
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands')
        if (response.ok) {
          const data = await response.json()
          setBrandCards(data || [])
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
    }
    fetchBrands()
  }, [])

  useEffect(() => {
    // Fetch reviews on mount with cache bypass to ensure fresh data
    // This ensures new reviews appear immediately
    fetchReviews(true)
  }, [fetchReviews])

  // Helper function to get brand ID from brand name
  const getBrandId = useCallback((brandName: string): string => {
    const brand = brandCards.find(
      (b) => b.brand_name.trim().toLowerCase() === brandName.trim().toLowerCase()
    )
    return brand ? brand.id : generateSlug(brandName)
  }, [brandCards])

  // Add a refresh function that can be called manually
  const refreshReviews = useCallback(() => {
    fetchReviews(true)
  }, [fetchReviews])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getEmailName = (email: string) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const getEmailDisplayName = (email: string) => {
    if (!email) return 'User'
    return email.substring(0, 5)
  }

  const getEmailColor = (email: string) => {
    if (!email) return '#6B7280'
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ]
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 md:py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            All Reviews
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl">
            Browse through the latest 30 reviews from our community.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to share your experience!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                <span>Go to Home</span>
                <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                onClick={() => {
                  setSelectedReview(review)
                }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate break-words" title={review.company_name}>
                      {review.company_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.created_at && (
                      <p className="text-sm text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                    )}
                    <Link
                      href={`/brands/${getBrandId(review.company_name)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
                
                <div className="mb-3">
                  <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                </div>
                
                <div className="mb-3 flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-semibold text-sm flex-shrink-0" 
                    style={{ backgroundColor: getEmailColor(review.email) }}
                  >
                    {getEmailName(review.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate" title={getEmailDisplayName(review.email)}>
                      {getEmailDisplayName(review.email)}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed text-base line-clamp-3 break-words" title={review.review}>
                  {review.review}
                </p>
                
                <div 
                  className="mt-4 pt-4 border-t border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedReview(review)
                  }}
                >
                  <p className="text-sm font-medium text-primary-600 text-center hover:text-primary-700 transition-colors cursor-pointer">
                    Read More →
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 break-words">{selectedReview.company_name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedReview.created_at && (
                      <React.Fragment>
                        <span className="text-gray-300">•</span>
                        <p className="text-base text-gray-500">{formatDate(selectedReview.created_at)}</p>
                      </React.Fragment>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <StarRating rating={selectedReview.rating} onRatingChange={() => {}} readonly />
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-semibold text-lg flex-shrink-0" style={{ backgroundColor: getEmailColor(selectedReview.email) }}>
                  {getEmailName(selectedReview.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{getEmailDisplayName(selectedReview.email)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Review</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{selectedReview.review}</p>
              </div>

              <div className="pt-6 border-t border-gray-200 flex justify-end items-center gap-4">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

