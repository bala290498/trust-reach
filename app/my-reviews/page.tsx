'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import StarRating from '@/components/StarRating'
import { ExternalLink, Edit, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MyReviewsPage() {
  const { user, isLoaded } = useUser()
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingReview, setEditingReview] = useState<CompanyReview | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingReview, setDeletingReview] = useState<CompanyReview | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    company_name: '',
    website_url: '',
    category: '',
    rating: 0,
    review: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchMyReviews = useCallback(async () => {
    if (!user?.id) {
      setReviews([])
      setLoading(false)
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
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded) {
      fetchMyReviews()
    }
  }, [isLoaded, fetchMyReviews])

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

  const normalizeUrl = (url: string): string => {
    if (!url) return url
    url = url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  const handleEditClick = (review: CompanyReview) => {
    setEditingReview(review)
    setFormData({
      email: review.email || '',
      phone: review.phone || '',
      company_name: review.company_name || '',
      website_url: review.website_url || '',
      category: review.category || '',
      rating: review.rating || 0,
      review: review.review || '',
    })
    setShowEditForm(true)
  }

  const handleDeleteClick = (review: CompanyReview) => {
    setDeletingReview(review)
    setShowDeleteConfirm(true)
  }

  const handleEditSubmit = async () => {
    if (!editingReview || !user) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReview.id,
          company_name: formData.company_name,
          website_url: formData.website_url ? normalizeUrl(formData.website_url) : '',
          category: formData.category,
          rating: formData.rating,
          review: formData.review,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update review')
      }

      setShowEditForm(false)
      setEditingReview(null)
      fetchMyReviews()
      alert('Review updated successfully!')
    } catch (error: any) {
      console.error('Error updating review:', error)
      alert(error.message || 'Failed to update review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
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

      setShowDeleteConfirm(false)
      setDeletingReview(null)
      fetchMyReviews()
      alert('Review deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting review:', error)
      alert(error.message || 'Failed to delete review. Please try again.')
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
              <span>Back to Reviews</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to All Reviews</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Reviews</h1>
          <p className="text-gray-600">Manage and edit your company reviews</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-gray-600">Loading your reviews...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">You haven&apos;t submitted any reviews yet.</p>
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
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl border-2 border-gray-300 p-6 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={review.company_name}>
                      {review.company_name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-gray-500 font-medium truncate max-w-[140px]" title={review.category}>
                        {review.category}
                      </p>
                      {review.created_at && (
                        <>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {review.website_url && (
                    <a
                      href={review.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
                <div className="mb-3 flex-shrink-0">
                  <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                </div>
                <div className="mb-3 flex-shrink-0 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {getEmailName(review.email)}
                  </div>
                  <p className="text-sm text-gray-600 font-medium truncate" title={review.email}>
                    {getEmailDisplayName(review.email)}
                  </p>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm line-clamp-3 flex-1 overflow-hidden mb-4" title={review.review}>
                  {review.review}
                </p>
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditClick(review)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(review)}
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

        {/* Edit Review Form Modal */}
        {showEditForm && editingReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Edit Company Review</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={user?.primaryEmailAddress?.emailAddress || formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={user?.primaryPhoneNumber?.phoneNumber || formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Website URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select a category</option>
                    <option value="Hotels & Restaurants">Hotels & Restaurants</option>
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Travel & Vacation">Travel & Vacation</option>
                    <option value="Construction & Manufacturing">Construction & Manufacturing</option>
                    <option value="Home Services">Home Services</option>
                    <option value="Events & Entertainment">Events & Entertainment</option>
                    <option value="Beauty & Well-being">Beauty & Well-being</option>
                    <option value="Electronics & Technology">Electronics & Technology</option>
                    <option value="Vehicles & Transportation">Vehicles & Transportation</option>
                    <option value="Local Services">Local Services</option>
                    <option value="Education & Training">Education & Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={(rating) => setFormData({ ...formData, rating })}
                    readonly={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Write your review here..."
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
                      setShowEditForm(false)
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Review</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your review for <strong>{deletingReview.company_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
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

