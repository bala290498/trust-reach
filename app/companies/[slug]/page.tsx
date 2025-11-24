'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseAuth } from '@/lib/supabase-auth'
import type { User } from '@supabase/supabase-js'
import SignInModal from '@/components/SignInModal'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { ExternalLink, ArrowLeft, Edit, Trash2, Plus, Search, CheckCircle, XCircle } from 'lucide-react'

interface CompanyData {
  name: string
  averageRating: number
  reviewCount: number
  reviews: CompanyReview[]
}

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

export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
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
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingReview, setDeletingReview] = useState<CompanyReview | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingReview, setEditingReview] = useState<CompanyReview | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [pendingAddReview, setPendingAddReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  })
  const [formData, setFormData] = useState({
    rating: 0,
    review: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  const slug = params?.slug as string

  const fetchCompanyData = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      // Fetch all reviews
      const { data: reviews, error } = await supabase
        .from('company_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Find company by matching slug
      const companyMap = new Map<string, CompanyReview[]>()
      reviews?.forEach((review) => {
        const companyName = review.company_name
        if (!companyMap.has(companyName)) {
          companyMap.set(companyName, [])
        }
        companyMap.get(companyName)!.push(review)
      })

      // Find the company that matches the slug
      let foundCompany: CompanyData | null = null
      companyMap.forEach((reviews, companyName) => {
        const companySlug = generateSlug(companyName)
        if (companySlug === slug) {
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
          const averageRating = totalRating / reviews.length
          const firstReview = reviews[0]
          
          foundCompany = {
            name: companyName,
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length,
            reviews: reviews,
          }
        }
      })

      if (foundCompany) {
        setCompany(foundCompany)
      } else {
        // Company not found, redirect to home
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching company data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    fetchCompanyData()
  }, [fetchCompanyData])

  // Auto-close notification modal after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification.show])

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
    if (!email) return '?'
    const namePart = email.split('@')[0]
    return namePart.charAt(0).toUpperCase()
  }

  const getEmailDisplayName = (email: string) => {
    if (!email) return 'Anonymous'
    // Show only first 5 characters of email
    return email.substring(0, 5)
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleDeleteClick = (review: CompanyReview) => {
    setDeletingReview(review)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReview || !user) {
      setNotification({ show: true, message: 'Please sign in to delete reviews.', type: 'error' })
      return
    }

    try {
      const response = await fetch('/api/reviews/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingReview.id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setShowDeleteConfirm(false)
        setDeletingReview(null)
        fetchCompanyData() // Refresh data
        setNotification({ show: true, message: 'Review deleted successfully!', type: 'success' })
      } else {
        setNotification({ show: true, message: data.error || 'Failed to delete review', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      setNotification({ show: true, message: 'Failed to delete review. Please try again.', type: 'error' })
    }
  }

  const handleEditClick = (review: CompanyReview) => {
    if (!user) {
      setNotification({ show: true, message: 'Please sign in to edit reviews.', type: 'error' })
      return
    }
    setEditingReview(review)
    setFormData({
      rating: review.rating,
      review: review.review,
    })
    setShowEditForm(true)
  }

  // Handle opening add review form after sign-in
  useEffect(() => {
    if (isLoaded && user && pendingAddReview) {
      setShowAddForm(true)
      setPendingAddReview(false)
      setShowSignInModal(false)
    }
  }, [isLoaded, user, pendingAddReview])

  const handleAddReviewClick = () => {
    if (!isLoaded) return
    
    if (user) {
      // User is signed in, open form directly with pre-filled company info
      setFormData({
        rating: 0,
        review: '',
      })
      setShowAddForm(true)
    } else {
      // User is not signed in, show sign-in modal
      setPendingAddReview(true)
      setShowSignInModal(true)
    }
  }

  const normalizeUrl = (url: string): string => {
    if (!url) return url
    url = url.trim()
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url
    }
    return url
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return true // Optional field
    url = url.trim()
    const urlPattern = /^(https?:\/\/)?(www\.)?([\da-z\.-]+)\.([a-z\.]{2,})([\/\w \.-]*)*\/?$/i
    return urlPattern.test(url)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.review || formData.rating === 0) {
      setNotification({ show: true, message: 'Please fill in all required fields.', type: 'error' })
      return
    }

    if (!user || !company) {
      setNotification({ show: true, message: 'Please sign in to submit a review.', type: 'error' })
      return
    }

    setSubmitting(true)

    try {
      const normalizedFormData = {
        email: user.email || '',
        company_name: company.name,
        rating: formData.rating,
        review: formData.review,
        user_id: user.id,
      }
      
      const { error } = await supabase.from('company_reviews').insert([normalizedFormData])

      if (error) throw error

      // Reset form and close modal
      setFormData({
        rating: 0,
        review: '',
      })
      setShowAddForm(false)
      
      // Refresh company data to show new review
      fetchCompanyData()
      setNotification({ show: true, message: 'Review submitted successfully!', type: 'success' })
    } catch (error) {
      console.error('Error adding review:', error)
      setNotification({ show: true, message: 'Failed to add review. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingReview || !user) {
      setNotification({ show: true, message: 'Please sign in to edit reviews.', type: 'error' })
      return
    }

    // Validate required fields
    if (!formData.review || formData.rating === 0) {
      setNotification({ show: true, message: 'Please fill in all required fields.', type: 'error' })
      return
    }

    setSubmitting(true)

    try {
      const normalizedFormData = {
        rating: formData.rating,
        review: formData.review,
      }
      
      const { error } = await supabase
        .from('company_reviews')
        .update(normalizedFormData)
        .eq('id', editingReview.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Reset form and close modal
      setFormData({
        rating: 0,
        review: '',
      })
      setShowEditForm(false)
      setEditingReview(null)
      
      // Refresh company data to show updated review
      fetchCompanyData()
      setNotification({ show: true, message: 'Review updated successfully!', type: 'success' })
    } catch (error) {
      console.error('Error updating review:', error)
      setNotification({ show: true, message: 'Failed to update review. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company not found</h1>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Filter reviews by search query
  const filteredReviews = company.reviews.filter((review) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      review.review.toLowerCase().includes(query) ||
      review.email.toLowerCase().includes(query) ||
      getEmailDisplayName(review.email).toLowerCase().includes(query)
    )
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    } else {
      return sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating
    }
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Company Header Bar - Fixed below main nav */}
      <div className="fixed top-[5rem] left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-20 sm:h-24">
            {/* Left - Company name */}
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {company.name}
              </h2>
            </div>

            {/* Center - Rating value + stars (vertically centered) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
                {company.averageRating.toFixed(1)}
              </span>
              <div className="flex-shrink-0">
                <StarRating rating={company.averageRating} onRatingChange={() => {}} readonly />
              </div>
            </div>

            {/* Right - Add Review button (vertically aligned with rating) */}
            <div className="flex-shrink-0">
              <button
                onClick={handleAddReviewClick}
                className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 whitespace-nowrap"
                aria-label="Add review"
              >
                Add Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Divider after sticky header */}
      <div className="fixed top-[9rem] sm:top-[11rem] left-0 right-0 z-30 border-b border-gray-200"></div>

      {/* Main Content - Add top padding for company header (h-20 = 5rem on mobile, h-24 = 6rem on larger screens) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-8">
        {/* Spacing after divider */}
        <div className="pt-6 sm:pt-8">
          {/* Search bar and sort controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Search bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                aria-label="Search reviews"
              />
            </div>

            {/* Sort dropdowns */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
                className="px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white cursor-pointer"
                aria-label="Sort by"
              >
                <option value="date">Date</option>
                <option value="rating">Rating</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white cursor-pointer"
                aria-label="Sort order"
              >
                <option value="desc">{sortBy === 'date' ? 'Newest' : 'Highest'}</option>
                <option value="asc">{sortBy === 'date' ? 'Oldest' : 'Lowest'}</option>
              </select>
            </div>
          </div>

          {/* Second divider */}
          <div className="border-b border-gray-200 mb-6 sm:mb-8"></div>
        </div>

        {/* Reviews List - Flat, borderless feed style */}
        <div className="space-y-12">
          {sortedReviews.map((review) => (
            <div key={review.id} className="pb-12 border-b border-gray-100 last:border-b-0 last:pb-0">
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-base">
                    {getEmailName(review.email)}
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 min-w-0">
                  {/* User name and date */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-3 flex-wrap mb-2">
                      <p className="text-base font-semibold text-gray-900">{getEmailDisplayName(review.email)}</p>
                      {review.created_at && (
                        <p className="text-sm text-gray-500 ml-auto">{formatDate(review.created_at)}</p>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <div>
                      <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                    </div>
                  </div>

                  {/* Review text - larger, readable typography */}
                  <div className="mb-4">
                    <p className="text-base sm:text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">{review.review}</p>
                  </div>

                  {/* Edit/Delete buttons - only show for user's own reviews */}
                  {isLoaded && user && review.user_id === user.id && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleEditClick(review)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Edit size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(review)}
                        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign In Modal for Add Review */}
      {showSignInModal && !user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
          setShowSignInModal(false)
          setPendingAddReview(false)
        }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in or create an account to add a review.
            </p>
            <SignInModal
              isOpen={showSignInModal && !user}
              onClose={() => {
                setShowSignInModal(false)
                setPendingAddReview(false)
              }}
              title="Sign In Required"
              message="Please sign in or create an account to add a review."
            />
          </div>
        </div>
      )}

      {/* Add Review Form Modal */}
      {showAddForm && company && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">Add Review for {company.name}</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Reviewing as:</strong> {user.email || user.user_metadata?.full_name || 'User'}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.name}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
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
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="Share your experience with this company..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      rating: 0,
                      review: '',
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Form Modal */}
      {showEditForm && editingReview && company && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">Edit Review for {company.name}</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Editing as:</strong> {user.email || user.user_metadata?.full_name || 'User'}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.name}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
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
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="Share your experience with this company..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingReview(null)
                    setFormData({
                      rating: 0,
                      review: '',
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Edit size={18} />
                      <span>Update Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              {notification.type === 'success' ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            <p className="text-lg font-medium text-gray-900">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Review</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletingReview(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


