'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabaseAuth } from '@/lib/supabase-auth'
import type { User } from '@supabase/supabase-js'
import { supabase, CompanyReview } from '@/lib/supabase'
import StarRating from '@/components/StarRating'
import { ExternalLink, Edit, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NotificationModal from '@/components/NotificationModal'

const categories = [
  'Hotels & Restaurants',
  'Health & Medical',
  'Travel & Vacation',
  'Construction & Manufacturing',
  'Home Services',
  'Events & Entertainment',
  'Beauty & Well-being',
  'Electronics & Technology',
  'Vehicles & Transportation',
  'Local Services',
  'Education & Training',
]

export default function MyActivityPage() {
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
  const [reviewsLoading, setReviewsLoading] = useState(true)
  
  // Review states
  const [showEditReviewForm, setShowEditReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<CompanyReview | null>(null)
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false)
  const [deletingReview, setDeletingReview] = useState<CompanyReview | null>(null)
  const [reviewFormData, setReviewFormData] = useState({
    email: '',
    company_name: '',
    rating: 0,
    review: '',
  })
  const [availableBrandNames, setAvailableBrandNames] = useState<string[]>([])
  const [brandSearchQuery, setBrandSearchQuery] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [brandSearchError, setBrandSearchError] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  })

  const fetchMyReviews = useCallback(async () => {
    if (!user?.id) {
      setReviews([])
      setReviewsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching my reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded) {
      fetchMyReviews()
    }
  }, [isLoaded, fetchMyReviews])

  // Fetch available brand names from markdown files
  useEffect(() => {
    const fetchBrandNames = async () => {
      try {
        const response = await fetch('/api/brands')
        if (response.ok) {
          const data = await response.json()
          const brandNames = data
            .map((brand: { brand_name: string }) => brand.brand_name)
            .filter((name: string) => name && name.trim())
            .sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
          setAvailableBrandNames(brandNames)
        }
      } catch (error) {
        console.error('Error fetching brand names:', error)
      }
    }
    fetchBrandNames()
  }, [])

  // Filter brands based on search query
  const getFilteredBrands = useCallback(() => {
    if (!brandSearchQuery.trim()) {
      return availableBrandNames
    }
    const query = brandSearchQuery.toLowerCase().trim()
    return availableBrandNames.filter((name) =>
      name.toLowerCase().includes(query)
    )
  }, [brandSearchQuery, availableBrandNames])

  // Validate if the current company_name exists in available brands
  const validateBrandName = useCallback(() => {
    if (!reviewFormData.company_name.trim()) {
      setBrandSearchError('')
      return true
    }
    const exists = availableBrandNames.some(
      (name) => name.toLowerCase() === reviewFormData.company_name.toLowerCase()
    )
    if (!exists) {
      setBrandSearchError('Brand name not registered. Please select from the list.')
      return false
    }
    setBrandSearchError('')
    return true
  }, [reviewFormData.company_name, availableBrandNames])

  // Update brand search query when reviewFormData.company_name changes
  useEffect(() => {
    setBrandSearchQuery(reviewFormData.company_name)
    if (reviewFormData.company_name) {
      validateBrandName()
    }
  }, [reviewFormData.company_name, validateBrandName])

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
    // Show only first 5 characters of email
    return email.substring(0, 5)
  }

  const normalizeUrl = (url: string): string => {
    if (!url) return url
    url = url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  // Review handlers
  const handleEditReviewClick = (review: CompanyReview) => {
    setEditingReview(review)
    setReviewFormData({
      email: review.email || '',
      company_name: review.company_name || '',
      rating: review.rating || 0,
      review: review.review || '',
    })
    setShowEditReviewForm(true)
  }

  const handleDeleteReviewClick = (review: CompanyReview) => {
    setDeletingReview(review)
    setShowDeleteReviewConfirm(true)
  }

  const handleEditReviewSubmit = async () => {
    if (!editingReview || !user) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReview.id,
          company_name: reviewFormData.company_name,
          rating: reviewFormData.rating,
          review: reviewFormData.review,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update review')
      }

      setShowEditReviewForm(false)
      setEditingReview(null)
      fetchMyReviews()
      setNotification({ isOpen: true, type: 'success', message: 'Review updated successfully!' })
    } catch (error: any) {
      console.error('Error updating review:', error)
      setNotification({ isOpen: true, type: 'error', message: error.message || 'Failed to update review. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReviewConfirm = async () => {
    if (!deletingReview || !user) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingReview.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      // Close delete confirmation modal first
      setShowDeleteReviewConfirm(false)
      setDeletingReview(null)
      
      fetchMyReviews()
      // Small delay to ensure delete modal closes before showing notification
      setTimeout(() => {
        setNotification({ isOpen: true, type: 'success', message: 'Review deleted successfully!' })
      }, 150)
    } catch (error: any) {
      // Close delete confirmation modal first
      setShowDeleteReviewConfirm(false)
      setDeletingReview(null)
      console.error('Error deleting review:', error)
      // Small delay to ensure delete modal closes before showing notification
      setTimeout(() => {
        setNotification({ isOpen: true, type: 'error', message: error.message || 'Failed to delete review. Please try again.' })
      }, 150)
    } finally {
      setSubmitting(false)
    }
  }


  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Reviews</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your reviews.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen && !!notification.message}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Reviews</h1>
          <p className="text-gray-600">Manage and edit your reviews</p>
        </div>

        {/* Loading State */}
        {reviewsLoading && (
          <div className="text-center py-16">
            <div className="text-gray-600">Loading your reviews...</div>
          </div>
        )}

        {/* Empty State */}
        {!reviewsLoading && reviews.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t submitted any reviews yet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Add Your First Review</span>
              </Link>
            </div>
          </div>
        )}

        {/* Reviews Grid */}
        {!reviewsLoading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border-2 border-gray-300 p-3 sm:p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-2 flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate" title={review.company_name}>
                      {review.company_name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {review.created_at && (
                        <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex-shrink-0">
                  <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                </div>
                <div className="mb-2 flex-shrink-0 flex items-center gap-1.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
                    {getEmailName(review.email)}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                    {getEmailDisplayName(review.email)}
                  </p>
                </div>
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm line-clamp-2 flex-1 overflow-hidden mb-2" title={review.review}>
                  {review.review}
                </p>
                <div className="flex gap-1.5 mt-auto pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleEditReviewClick(review)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs sm:text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteReviewClick(review)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Review Form Modal */}
        {showEditReviewForm && editingReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Edit Company Review</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleEditReviewSubmit(); }} className="space-y-4">
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Reviewing as:</strong> {user.email || user.user_metadata?.full_name || 'User'}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Company or Brand Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={brandSearchQuery}
                      onChange={(e) => {
                        setBrandSearchQuery(e.target.value)
                        setReviewFormData({ ...reviewFormData, company_name: e.target.value })
                        setBrandSearchError('')
                        setShowBrandDropdown(true)
                      }}
                      onFocus={() => {
                        if (brandSearchQuery.trim() && getFilteredBrands().length > 0) {
                          setShowBrandDropdown(true)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowBrandDropdown(false)
                          validateBrandName()
                        }, 200)
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        brandSearchError
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Type to search existing brands..."
                    />
                    {/* Brand Suggestions Dropdown */}
                    {showBrandDropdown && getFilteredBrands().length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-[15rem] overflow-y-auto">
                        {getFilteredBrands().map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setReviewFormData({ ...reviewFormData, company_name: name })
                              setBrandSearchQuery(name)
                              setShowBrandDropdown(false)
                              setBrandSearchError('')
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-semibold text-gray-900 truncate">{name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {brandSearchError && (
                    <p className="text-sm text-red-600 mt-1">{brandSearchError}</p>
                  )}
                  {availableBrandNames.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No brands available. Please add brands via markdown files.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <StarRating
                    rating={reviewFormData.rating}
                    onRatingChange={(rating) => setReviewFormData({ ...reviewFormData, rating })}
                    readonly={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={reviewFormData.review}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, review: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditReviewForm(false)
                      setEditingReview(null)
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Review Confirmation Modal */}
        {showDeleteReviewConfirm && deletingReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Review</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your review for <strong>{deletingReview.company_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteReviewConfirm}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteReviewConfirm(false)
                    setDeletingReview(null)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

