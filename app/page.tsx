'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import FilterBar from '@/components/FilterBar'
import CategoryCarousel from '@/components/CategoryCarousel'
import StarRating from '@/components/StarRating'
import { Search, Plus, ExternalLink, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap, ChevronLeft, ChevronRight, Edit, Trash2, Menu } from 'lucide-react'
import YourReviewsSlider from '@/components/YourReviewsSlider'

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

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'Restaurants & Bars': UtensilsCrossed,
    'Health & Medical': Heart,
    'Travel & Vacation': Plane,
    'Construction & Manufacturing': Building2,
    'Home Services': HomeIcon,
    'Events & Entertainment': Music,
    'Beauty & Well-being': Sparkles,
    'Electronics & Technology': Laptop,
    'Vehicles & Transportation': Car,
    'Public & Local Services': Building,
    'Education & Training': GraduationCap,
  }
  const IconComponent = iconMap[category]
  return IconComponent ? <IconComponent size={24} /> : null
}

const popularCategories = [
  'Restaurants & Bars',
  'Health & Medical',
  'Electronics & Technology',
  'Beauty & Well-being',
  'Travel & Vacation',
  'Home Services',
]

export default function Home() {
  const { user, isLoaded } = useUser()
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [filteredReviews, setFilteredReviews] = useState<CompanyReview[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRating, setSelectedRating] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<CompanyReview[]>([])
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null)
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    company_name: '',
    website_url: '',
    category: '',
    rating: 0,
    review: '',
  })
  const [loading, setLoading] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingReview, setEditingReview] = useState<CompanyReview | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingReview, setDeletingReview] = useState<CompanyReview | null>(null)
  const [showSlider, setShowSlider] = useState(false)
  const [pendingAddReview, setPendingAddReview] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [companyNameSuggestions, setCompanyNameSuggestions] = useState<string[]>([])
  const [showCompanyNameDropdown, setShowCompanyNameDropdown] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      // Fetch all reviews (not just user's own) - anyone can see all reviews
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    }
  }, [])

  const filterReviews = useCallback(() => {
    let filtered = [...reviews]

    // Real-time word-by-word search for company name - supports single word matching
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase().trim()
      // If search term has multiple words, check if ANY word matches
      // If it's a single word or partial word, match if company name contains it
      if (searchTerm.length > 0) {
        filtered = filtered.filter((review) => {
          const companyName = review.company_name.toLowerCase()
          // Support single word or partial word matching
          return companyName.includes(searchTerm)
        })
      }
    }

    if (selectedCategory) {
      filtered = filtered.filter((review) => review.category === selectedCategory)
    }

    if (selectedRating > 0) {
      filtered = filtered.filter((review) => review.rating >= selectedRating)
    }

    setFilteredReviews(filtered)
  }, [reviews, searchQuery, selectedCategory, selectedRating])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    filterReviews()
  }, [filterReviews])

  // Normalize text for comparison (remove spaces, special chars, lowercase)
  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  // Get unique company names from reviews
  const getUniqueCompanyNames = useCallback(() => {
    const uniqueNames = new Set<string>()
    reviews.forEach((review) => {
      if (review.company_name) {
        uniqueNames.add(review.company_name)
      }
    })
    return Array.from(uniqueNames).sort()
  }, [reviews])

  // Handle opening add review form after sign-in
  useEffect(() => {
    if (isLoaded && user && pendingAddReview) {
      setShowAddForm(true)
      setPendingAddReview(false)
      setShowSignInModal(false)
    }
  }, [isLoaded, user, pendingAddReview])

  // Generate company name suggestions
  useEffect(() => {
    if (showAddForm && formData.company_name) {
      const query = normalizeText(formData.company_name)
      const uniqueNames = getUniqueCompanyNames()
      
      if (query.length > 0) {
        const matches = uniqueNames.filter((name) => {
          const normalizedName = normalizeText(name)
          return normalizedName.includes(query) || query.includes(normalizedName)
        })
        setCompanyNameSuggestions(matches.slice(0, 10)) // Limit to 10 suggestions
        setShowCompanyNameDropdown(matches.length > 0)
      } else {
        setCompanyNameSuggestions([])
        setShowCompanyNameDropdown(false)
      }
    } else {
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
    }
  }, [formData.company_name, showAddForm, getUniqueCompanyNames])

  // Generate search suggestions for dropdown
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim()
      const suggestions = reviews
        .filter((review) => {
          const companyName = review.company_name.toLowerCase()
          return companyName.includes(query)
        })
        .slice(0, 5) // Show top 5 matches
      setSearchSuggestions(suggestions)
      setShowSearchDropdown(suggestions.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSearchDropdown(false)
    }
  }, [searchQuery, reviews])

  const normalizeUrl = (url: string): string => {
    if (!url) return url
    url = url.trim()
    // Remove any leading/trailing whitespace
    url = url.trim()
    
    // If URL doesn't start with http:// or https://, add https://
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url
    }
    
    return url
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return true // Optional field
    url = url.trim()
    
    // Supports various formats:
    // - https://test.com
    // - http://test.in
    // - test.com
    // - test.in
    // - www.test.com
    // - www.test.in
    // - subdomain.test.com
    const urlPattern = /^(https?:\/\/)?(www\.)?([\da-z\.-]+)\.([a-z\.]{2,})([\/\w \.-]*)*\/?$/i
    return urlPattern.test(url)
  }

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.phone || !formData.company_name || !formData.category || !formData.review || formData.rating === 0) {
      alert('Please fill in all required fields.')
      return
    }

    if (!user) {
      alert('Please sign in to submit a review.')
      return
    }

    // Validate URL format if provided
    if (formData.website_url && !isValidUrl(formData.website_url)) {
      alert('Please enter a valid website URL (e.g., example.com, www.example.in, https://example.com)')
      return
    }

    // Proceed with submission
    await handleSubmit()
  }

  const handleSubmit = async () => {
    if (!user) {
      alert('Please sign in to submit a review.')
      return
    }

    setLoading(true)

    try {
      // Normalize the URL before submitting (add https:// if missing)
      const normalizedFormData = {
        ...formData,
        website_url: formData.website_url ? normalizeUrl(formData.website_url) : '',
        user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || formData.email,
      }
      
      const { error } = await supabase.from('company_reviews').insert([normalizedFormData])

      if (error) throw error

      setFormData({
        email: '',
        phone: '',
        company_name: '',
        website_url: '',
        category: '',
        rating: 0,
        review: '',
      })
      setShowAddForm(false)
      fetchReviews()
      alert('Review submitted successfully!')
    } catch (error) {
      console.error('Error adding review:', error)
      alert('Failed to add review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (review: CompanyReview) => {
    setEditingReview(review)
    setShowEditForm(true)
    setSelectedReview(null)
    setFormData({
      email: review.email || '',
      phone: review.phone,
      company_name: review.company_name,
      website_url: review.website_url || '',
      category: review.category,
      rating: review.rating,
      review: review.review,
    })
  }

  const handleDeleteClick = (review: CompanyReview) => {
    setDeletingReview(review)
    setShowDeleteConfirm(true)
  }

  const handleEditSubmit = async () => {
    if (!editingReview || !user) {
      alert('Please sign in to edit reviews.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reviews/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReview.id,
          company_name: formData.company_name,
          website_url: formData.website_url || null,
          category: formData.category,
          rating: formData.rating,
          review: formData.review,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Review updated successfully!')
        setShowEditForm(false)
        setEditingReview(null)
        setFormData({
          email: '',
          phone: '',
          company_name: '',
          website_url: '',
          category: '',
          rating: 0,
          review: '',
        })
        fetchReviews()
      } else {
        alert(data.error || 'Failed to update review')
      }
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReview || !user) {
      alert('Please sign in to delete reviews.')
      return
    }

    setLoading(true)
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
        fetchReviews()
      } else {
        const errorMsg = data.error || data.message || 'Failed to delete review'
        const details = data.details ? `\n\nDetails: ${data.details}` : ''
        const code = data.code ? `\n\nError Code: ${data.code}` : ''
        alert(`${errorMsg}${details}${code}\n\nPlease check the terminal logs for more information.`)
        console.error('Delete error response:', data)
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const groupedByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredReviews.filter((r) => r.category === category)
    return acc
  }, {} as Record<string, CompanyReview[]>)

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const scrollCarousel = (category: string, direction: 'left' | 'right') => {
    const carousel = carouselRefs.current[category]
    if (!carousel) return
    
    const scrollAmount = 400 // Scroll by approximately one card width + gap
    const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount
    carousel.scrollBy({ left: scrollDirection, behavior: 'smooth' })
  }

  const setCarouselRef = useCallback((category: string, el: HTMLDivElement | null) => {
    if (el) {
      carouselRefs.current[category] = el
    } else {
      delete carouselRefs.current[category]
    }
  }, [])

  const getEmailName = (email: string) => {
    if (!email) return 'U'
    const namePart = email.split('@')[0]
    // Capitalize first letter
    return namePart.charAt(0).toUpperCase()
  }

  const getEmailDisplayName = (email: string) => {
    if (!email) return 'User'
    const namePart = email.split('@')[0]
    // Capitalize first letter and return
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
  }

  const renderReviewCard = (review: CompanyReview) => {
    return <div 
        className="bg-white rounded-2xl border-2 border-gray-300 p-6 hover:shadow-lg hover:border-primary-400 transition-all duration-200 h-[280px] flex flex-col cursor-pointer"
        onClick={() => setSelectedReview(review)}
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
              onClick={(e) => e.stopPropagation()}
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
        <p className="text-gray-700 leading-relaxed text-sm line-clamp-3 flex-1 overflow-hidden" title={review.review}>
          {review.review}
        </p>
        {/* View in Your Reviews link - only show for user's own reviews */}
        {isLoaded && user && review.user_id === user.id && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Link
              href="/my-reviews"
              onClick={(e) => e.stopPropagation()}
              className="block text-center text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors py-2 px-3"
            >
              Manage in Your Reviews →
            </Link>
          </div>
        )}
      </div>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Your Reviews Slider */}
      <YourReviewsSlider 
        isOpen={showSlider} 
        onClose={() => setShowSlider(false)}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Floating Button to Open Slider */}
      {isLoaded && user && (
        <button
          onClick={() => setShowSlider(true)}
          className="fixed right-6 bottom-6 z-30 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all duration-200 hover:scale-110 flex items-center justify-center"
          aria-label="Open your reviews menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 md:py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Find Trusted Company Reviews
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Discover authentic reviews from real customers. Make informed decisions with trusted insights. {isLoaded && !user && 'Sign in to add your own reviews.'}
          </p>
          
          {/* Wide Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search for companies... (e.g., type any word from company name)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchDropdown(true)
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0 && searchSuggestions.length > 0) {
                    setShowSearchDropdown(true)
                  }
                }}
                onBlur={() => {
                  // Delay hiding dropdown to allow clicking on suggestions
                  setTimeout(() => setShowSearchDropdown(false), 200)
                }}
                className="w-full pl-12 pr-4 py-2.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSearchDropdown && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  {searchSuggestions.map((review) => (
                    <button
                      key={review.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(review.company_name)
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{review.company_name}</p>
                          <p className="text-sm text-gray-500 mt-1">{review.category}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searchQuery.trim().length > 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                {filteredReviews.length > 0 
                  ? `Found ${filteredReviews.length} matching ${filteredReviews.length === 1 ? 'company' : 'companies'}`
                  : 'No companies found matching your search'}
              </p>
            )}
          </div>

          <button
            onClick={handleAddReviewClick}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
          >
            <Plus size={18} />
            <span>Add Your Review</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">

        {/* Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedReview.company_name}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm text-gray-500 font-medium">{selectedReview.category}</p>
                    {selectedReview.created_at ? (
                      <React.Fragment>
                        <span className="text-gray-300">•</span>
                        <p className="text-sm text-gray-500">{formatDate(selectedReview.created_at)}</p>
                      </React.Fragment>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedReview.website_url && (
                <div className="mb-6">
                  <a
                    href={selectedReview.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
                  >
                    <ExternalLink size={18} />
                    <span>Visit Website</span>
                  </a>
                </div>
              )}

              <div className="mb-6">
                <StarRating rating={selectedReview.rating} onRatingChange={() => {}} readonly />
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                  {getEmailName(selectedReview.email)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{getEmailDisplayName(selectedReview.email)}</p>
                  <p className="text-xs text-gray-500">{selectedReview.email}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Review</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReview.review}</p>
              </div>

              <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
                {/* Only show Edit/Delete buttons if this is the user's own review */}
                {isLoaded && user && selectedReview.user_id === user.id ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleEditClick(selectedReview)
                        setSelectedReview(null)
                      }}
                      className="bg-blue-600 text-white py-2.5 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                    >
                      <Edit size={18} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteClick(selectedReview)
                        setSelectedReview(null)
                      }}
                      className="bg-red-600 text-white py-2.5 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="bg-gray-200 text-gray-700 py-2.5 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Add Company Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Add New Company Review</h2>
              
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
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => {
                        setFormData({ ...formData, company_name: e.target.value })
                      }}
                      onFocus={() => {
                        if (companyNameSuggestions.length > 0) {
                          setShowCompanyNameDropdown(true)
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow clicking on suggestions
                        setTimeout(() => setShowCompanyNameDropdown(false), 200)
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Type to search existing companies or enter new"
                    />
                    {/* Company Name Suggestions Dropdown */}
                    {showCompanyNameDropdown && companyNameSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                        {companyNameSuggestions.map((name, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, company_name: name })
                              setShowCompanyNameDropdown(false)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-semibold text-gray-900">{name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Website URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com or example.in or www.example.com"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supports: https://example.com, example.in, www.example.com, etc.</p>
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
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
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
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
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

        {/* Edit Review Form Modal */}
        {showEditForm && editingReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Edit Company Review</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-4">
                  {user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Reviewing as:</strong> {user.primaryEmailAddress?.emailAddress || user.firstName || 'User'}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number <span className="text-red-500">*</span>
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
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
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
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Review'}
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
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
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

        {/* Popular Categories Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Categories</h2>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            {popularCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group min-w-[120px]"
              >
                <div className="text-primary-600 group-hover:text-primary-700 transition-colors">
                  {getCategoryIcon(category)}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-10">
          <FilterBar
            selectedCategory={selectedCategory}
            selectedRating={selectedRating}
            onCategoryChange={setSelectedCategory}
            onRatingChange={setSelectedRating}
          />
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 md:p-10 mb-12 border border-pink-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Share Your Experience
              </h3>
              <p className="text-gray-600 text-lg">
                Help others make better decisions by sharing your honest review
              </p>
            </div>
            <button
              onClick={handleAddReviewClick}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Write a Review
            </button>
          </div>
        </div>

        {/* Category Sections with Carousel Layout */}
        {categories.map((category) => {
          const categoryReviews = groupedByCategory[category] || []
          if (categoryReviews.length === 0) return null

          return (
            <div key={category} className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="text-primary-600">
                    {getCategoryIcon(category)}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
                </div>
                <a
                  href={`/?category=${encodeURIComponent(category)}`}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
                >
                  View All →
                </a>
              </div>
              <div className="relative">
                {/* Left Arrow */}
                <button
                  onClick={() => scrollCarousel(category, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={24} className="text-gray-700" />
                </button>
                
                {/* Carousel Container */}
                <div
                  ref={(el) => setCarouselRef(category, el)}
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-12"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categoryReviews.map((review) => (
                    <div key={review.id} className="flex-shrink-0 w-[380px]">
                      {renderReviewCard(review)}
                    </div>
                  ))}
                </div>
                
                {/* Right Arrow */}
                <button
                  onClick={() => scrollCarousel(category, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Empty State - No Reviews */}
        {filteredReviews.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reviews Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory || selectedRating > 0
                  ? 'No reviews match your search criteria. Try adjusting your filters.'
                  : 'No reviews have been submitted yet. Be the first to share your experience!'}
              </p>
              <button
                onClick={handleAddReviewClick}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                <span>Write Your First Review</span>
              </button>
            </div>
          </div>
        )}

        {/* All Reviews Carousel (when no category filter) */}
        {!selectedCategory && filteredReviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All Reviews</h2>
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel('all-reviews', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
              
              {/* Carousel Container */}
              <div
                ref={(el) => setCarouselRef('all-reviews', el)}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredReviews.map((review) => (
                  <div key={review.id} className="flex-shrink-0 w-[380px]">
                    {renderReviewCard(review)}
                  </div>
                ))}
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel('all-reviews', 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                aria-label="Scroll right"
              >
                <ChevronRight size={24} className="text-gray-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

