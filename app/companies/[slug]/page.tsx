'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { ExternalLink, ArrowLeft, Edit, Trash2, Plus } from 'lucide-react'

interface CompanyData {
  name: string
  category: string
  website_url?: string
  averageRating: number
  reviewCount: number
  reviews: CompanyReview[]
}

const categories = [
  'Restaurants & Bars',
  'Health & Medical',
  'Travel & Vacation',
  'Construction & Manufacturing',
  'Home Services',
  'Events & Entertainment',
  'Beauty & Well-being',
  'Electronics & Technology',
  'Vehicles & Transportation',
  'Public & Local Services',
  'Education & Training',
]

export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingReview, setDeletingReview] = useState<CompanyReview | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [pendingAddReview, setPendingAddReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    website_url: '',
    rating: 0,
    review: '',
  })

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
            category: firstReview.category,
            website_url: firstReview.website_url,
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
    const namePart = email.split('@')[0]
    // Capitalize first letter of each word
    return namePart
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
      alert('Please sign in to delete reviews.')
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
        alert('Review deleted successfully!')
        setShowDeleteConfirm(false)
        setDeletingReview(null)
        fetchCompanyData() // Refresh data
      } else {
        alert(data.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
    }
  }

  const handleEditClick = (review: CompanyReview) => {
    router.push(`/review?id=${review.id}`)
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
        phone: '',
        website_url: company?.website_url || '',
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
    if (!formData.phone || !formData.review || formData.rating === 0) {
      alert('Please fill in all required fields.')
      return
    }

    if (!user || !company) {
      alert('Please sign in to submit a review.')
      return
    }

    // Validate URL format if provided
    if (formData.website_url && !isValidUrl(formData.website_url)) {
      alert('Please enter a valid website URL (e.g., example.com, www.example.in, https://example.com)')
      return
    }

    setSubmitting(true)

    try {
      // Normalize the URL before submitting
      const normalizedFormData = {
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: formData.phone,
        company_name: company.name,
        website_url: formData.website_url ? normalizeUrl(formData.website_url) : company.website_url || null,
        category: company.category,
        rating: formData.rating,
        review: formData.review,
        user_id: user.id,
      }
      
      const { error } = await supabase.from('company_reviews').insert([normalizedFormData])

      if (error) throw error

      // Reset form and close modal
      setFormData({
        phone: '',
        website_url: company.website_url || '',
        rating: 0,
        review: '',
      })
      setShowAddForm(false)
      
      // Refresh company data to show new review
      fetchCompanyData()
      alert('Review submitted successfully!')
    } catch (error) {
      console.error('Error adding review:', error)
      alert('Failed to add review. Please try again.')
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

  const sortedReviews = [...company.reviews].sort((a, b) => {
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
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 md:py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Reviews</span>
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{company.name}</h1>
              {company.category && (
                <p className="text-base md:text-lg text-gray-500 font-medium mb-4">{company.category}</p>
              )}
              {company.website_url && (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2 mb-4 transition-colors"
                >
                  <ExternalLink size={18} />
                  <span>Visit Website</span>
                </a>
              )}
              <div className="flex items-center gap-3">
                <StarRating rating={company.averageRating} onRatingChange={() => {}} readonly />
                <span className="text-xl font-bold text-gray-900">
                  {company.averageRating.toFixed(1)}
                </span>
                <span className="text-base text-gray-600">
                  ({company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 font-medium">
              Companies on TrustReach aren&apos;t allowed to offer incentives or pay to hide reviews.
            </p>
          </div>

          {/* Add Review Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAddReviewClick}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Add Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Sorting Options */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <label className="text-sm font-semibold text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="date">Date</option>
            <option value="rating">Rating</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="desc">Newest/Highest First</option>
            <option value="asc">Oldest/Lowest First</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <div key={review.id} className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm">
                      {getEmailName(review.email)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getEmailDisplayName(review.email)}</p>
                      <p className="text-xs text-gray-500">{review.email}</p>
                    </div>
                  </div>
                </div>
                {review.created_at && (
                  <p className="text-sm text-gray-500 whitespace-nowrap ml-4">{formatDate(review.created_at)}</p>
                )}
              </div>
              <div className="mb-3">
                <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{review.review}</p>
              {/* Edit/Delete buttons - only show for user's own reviews */}
              {isLoaded && user && review.user_id === user.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => handleEditClick(review)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(review)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
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
            <div className="flex flex-col gap-3">
              <SignInButton mode="modal">
                <button className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200">
                  Sign Up
                </button>
              </SignUpButton>
              <button
                onClick={() => {
                  setShowSignInModal(false)
                  setPendingAddReview(false)
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Review Form Modal */}
      {showAddForm && company && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Review for {company.name}</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Reviewing as:</strong> {user.primaryEmailAddress?.emailAddress || user.firstName || 'User'}
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
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.category}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="https://example.com (optional)"
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
                      phone: '',
                      website_url: company.website_url || '',
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

