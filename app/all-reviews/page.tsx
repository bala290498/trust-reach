'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { ArrowLeft, ChevronRight } from 'lucide-react'

export default function AllReviewsPage() {
  const { user, isLoaded } = useUser()
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
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
            Browse through the latest 50 reviews from our community.
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
                  const companySlug = generateSlug(review.company_name)
                  window.location.href = `/companies/${companySlug}`
                }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate break-words" title={review.company_name}>
                      {review.company_name}
                    </h3>
                  </div>
                  {review.created_at && (
                    <p className="text-sm text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                  )}
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
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-primary-600 text-center hover:text-primary-700 transition-colors">
                    Read More →
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

