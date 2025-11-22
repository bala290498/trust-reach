'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import StarRating from './StarRating'
import { X, Edit, Trash2 } from 'lucide-react'

interface YourReviewsSliderProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (review: CompanyReview) => void
  onDelete: (review: CompanyReview) => void
}

export default function YourReviewsSlider({ isOpen, onClose, onEdit, onDelete }: YourReviewsSliderProps) {
  const { user, isLoaded } = useUser()
  const [userReviews, setUserReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUserReviews = useCallback(async () => {
    if (!user?.id || !isLoaded) {
      setUserReviews([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserReviews(data || [])
    } catch (error) {
      console.error('Error fetching user reviews:', error)
      setUserReviews([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, isLoaded])

  useEffect(() => {
    if (isOpen && isLoaded && user) {
      fetchUserReviews()
    }
  }, [isOpen, isLoaded, user, fetchUserReviews])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getEmailName = (email: string) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const getEmailDisplayName = (email: string) => {
    if (!email) return 'User'
    const namePart = email.split('@')[0]
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
  }

  if (!isLoaded || !user) {
    return null
  }

  return (
    <React.Fragment>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slider */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900">Your Reviews</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your reviews...</p>
              </div>
            ) : userReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven&apos;t submitted any reviews yet. Start sharing your experiences!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-lg hover:border-primary-400 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={review.company_name}>
                          {review.company_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {review.created_at && (
                            <p className="text-sm text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {getEmailName(review.email)}
                      </div>
                      <p className="text-sm text-gray-600 font-medium truncate" title={review.email}>
                        {getEmailDisplayName(review.email)}
                      </p>
                    </div>

                    <p className="text-gray-700 leading-relaxed text-sm line-clamp-3 mb-4" title={review.review}>
                      {review.review}
                    </p>

                    {/* Edit/Delete buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          onEdit(review)
                          onClose()
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(review)
                          onClose()
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
