'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import NotificationModal from '@/components/NotificationModal'

interface BrandCard {
  id: string
  brand_name: string
  url?: string
  category: string
  email?: string
  phone?: string
  address?: string
  about: string
  created_at: string
}

export default function BrandPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [brand, setBrand] = useState<BrandCard | null>(null)
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [pendingAddReview, setPendingAddReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    rating: 0,
    review: '',
  })
  const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  })
  const [availableBrandNames, setAvailableBrandNames] = useState<string[]>([])
  const [brandSearchQuery, setBrandSearchQuery] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [brandSearchError, setBrandSearchError] = useState('')

  const fetchReviews = useCallback(async (brandName: string) => {
    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .ilike('company_name', brandName)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await fetch(`/api/brands/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setBrand(data)
          // Fetch reviews for this brand
          if (data.brand_name) {
            fetchReviews(data.brand_name)
          }
        } else {
          console.error('Failed to fetch brand')
        }
      } catch (error) {
        console.error('Error fetching brand:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchBrand()
    }
  }, [params.slug, fetchReviews])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getEmailInitials = (email: string) => {
    if (!email) return 'U'
    const namePart = email.split('@')[0]
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase()
    }
    return namePart.charAt(0).toUpperCase() + 'U'
  }

  const getPartialEmail = (email: string) => {
    if (!email) return ''
    // Show only first 5 characters of the email
    return email.substring(0, 5)
  }

  // Handle opening add review form after sign-in
  useEffect(() => {
    if (isLoaded && user && pendingAddReview) {
      setShowAddForm(true)
      setPendingAddReview(false)
      setShowSignInModal(false)
    }
  }, [isLoaded, user, pendingAddReview])

  // Fetch available brand names from markdown files
  useEffect(() => {
    const fetchBrandNames = async () => {
      try {
        const response = await fetch('/api/brands')
        if (response.ok) {
          const data = await response.json()
          const brandNames = data
            .map((brand: BrandCard) => brand.brand_name)
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
    if (!formData.company_name.trim()) {
      setBrandSearchError('')
      return true
    }
    const exists = availableBrandNames.some(
      (name) => name.toLowerCase() === formData.company_name.toLowerCase()
    )
    if (!exists) {
      setBrandSearchError('Brand name not registered. Please select from the list.')
      return false
    }
    setBrandSearchError('')
    return true
  }, [formData.company_name, availableBrandNames])

  // Update brand search query when formData.company_name changes
  useEffect(() => {
    setBrandSearchQuery(formData.company_name)
    if (formData.company_name) {
      validateBrandName()
    }
  }, [formData.company_name, validateBrandName])

  // Pre-fill company name when brand loads
  useEffect(() => {
    if (brand && brand.brand_name) {
      setFormData(prev => ({ ...prev, company_name: brand.brand_name }))
      setBrandSearchQuery(brand.brand_name)
    }
  }, [brand])

  const handleAddReviewClick = () => {
    if (!isLoaded) return
    
    if (user) {
      // User is signed in, open form directly
      setShowAddForm(true)
    } else {
      // User is not signed in, show sign-in modal
      setPendingAddReview(true)
      setShowSignInModal(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company_name || !formData.review || formData.rating === 0) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please fill in all required fields.' })
      return
    }

    if (!user) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please sign in to submit a review.' })
      return
    }

    setSubmitting(true)

    try {
      const normalizedFormData = {
        user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || formData.email,
        company_name: formData.company_name,
        rating: formData.rating,
        review: formData.review,
      }
      
      console.log('Submitting review:', normalizedFormData)
      
      const { data, error } = await supabase.from('company_reviews').insert([normalizedFormData]).select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Review submitted successfully:', data)

      setFormData({
        email: '',
        company_name: brand?.brand_name || '',
        rating: 0,
        review: '',
      })
      setShowAddForm(false)
      fetchReviews(brand?.brand_name || '')
      setNotification({ isOpen: true, type: 'success', message: 'Review submitted successfully!' })
    } catch (error: any) {
      console.error('Error adding review:', error)
      const errorMessage = error?.message || error?.details || 'Unknown error occurred'
      setNotification({ isOpen: true, type: 'error', message: 'Failed to add review. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/all-categories" className="text-gray-600 hover:text-primary-600 transition-colors">
                  All Categories
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <span className="text-gray-900 font-medium">Brand Not Found</span>
              </li>
            </ol>
          </nav>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Brand Not Found</h1>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Home
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

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/all-categories" className="text-gray-600 hover:text-primary-600 transition-colors">
                All Categories
              </Link>
            </li>
            {brand.category && (
              <>
                <li className="text-gray-400">/</li>
                <li>
                  <Link href={`/category/${generateSlug(brand.category)}`} className="text-gray-600 hover:text-primary-600 transition-colors">
                    {brand.category}
                  </Link>
                </li>
              </>
            )}
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">{brand.brand_name}</span>
            </li>
          </ol>
        </nav>

        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-primary-50 via-white to-secondary-50 rounded-2xl p-6 md:p-8 mb-8 border-2 border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{brand.brand_name}</h1>
              {brand.category && (
                <p className="text-lg text-gray-600 font-medium">{brand.category}</p>
              )}
            </div>
            {brand.url && (
              <a
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                <ExternalLink size={20} />
                <span>Visit Website</span>
              </a>
            )}
          </div>
          
          {/* Contact Info inside banner */}
          {(brand.email || brand.phone || brand.address) && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brand.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-primary-600 flex-shrink-0" />
                    <a href={`mailto:${brand.email}`} className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
                      {brand.email}
                    </a>
                  </div>
                )}
                {brand.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-primary-600 flex-shrink-0" />
                    <a href={`tel:${brand.phone}`} className="text-gray-700 hover:text-primary-600 transition-colors text-sm">
                      {brand.phone}
                    </a>
                  </div>
                )}
                {brand.address && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm">{brand.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        {brand.about && (
          <div className="mb-8">
            <div className="brand-content">
              <ReactMarkdown
                components={{
                  h2: ({node, ...props}) => (
                    <h2 {...props} className="text-3xl font-bold text-gray-900" />
                  ),
                  h3: ({node, ...props}) => (
                    <h3 {...props} className="text-xl font-bold text-gray-800" />
                  ),
                  p: ({node, ...props}) => (
                    <p {...props} className="text-gray-700 text-base" />
                  ),
                  ul: ({node, ...props}) => (
                    <ul {...props} className="list-disc list-inside" />
                  ),
                  li: ({node, ...props}) => (
                    <li {...props} className="text-gray-700 text-base" />
                  ),
                  strong: ({node, ...props}) => (
                    <strong {...props} className="text-gray-900 font-semibold" />
                  ),
                }}
              >
                {brand.about}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Reviews</h2>
            <button
              onClick={handleAddReviewClick}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              <span>Write a Review</span>
            </button>
          </div>
          
          {reviewsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="pb-8 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                        {getEmailInitials(review.email)}
                      </div>
                    </div>
                    
                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {getPartialEmail(review.email)}
                          </p>
                          {review.created_at && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                          <span className="text-base font-bold text-gray-900">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-base">{review.review}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">No reviews yet for this brand.</p>
              <button
                onClick={handleAddReviewClick}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                <span>Be the first to review →</span>
              </button>
            </div>
          )}
        </div>

        {/* Sign In Modal */}
        {showSignInModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to add a review for {brand.brand_name}.
              </p>
              <div className="space-y-3">
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
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Review for {brand.brand_name}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Reviewing as:</strong> {user.primaryEmailAddress?.emailAddress || user.firstName || 'User'}
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
                        setFormData({ ...formData, company_name: e.target.value })
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
                              setFormData({ ...formData, company_name: name })
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
                    rating={formData.rating}
                    onRatingChange={(rating) => setFormData({ ...formData, rating })}
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
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Write your review..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
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
      </div>
    </div>
  )
}


