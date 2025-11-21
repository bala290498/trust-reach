'use client'

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
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

function HomeContent() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; reviews: CompanyReview[] } | null>(null)
  const [companySortBy, setCompanySortBy] = useState<'date' | 'rating'>('date')
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('desc')

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

  // Handle URL parameters on page load
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam))
      // Scroll to filter section after a short delay to ensure page is loaded
      setTimeout(() => {
        const filterSection = document.getElementById('filter-section')
        if (filterSection) {
          filterSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [searchParams])

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

  // Generate company name suggestions with debouncing - match by first word
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!showAddForm) {
      // Only clear when form is closed
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
      return
    }

    const trimmedName = formData.company_name?.trim() || ''
    
    // If input is empty, hide suggestions immediately
    if (trimmedName.length === 0) {
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
      return
    }

    // Extract first word from user input (case-insensitive)
    const firstWord = trimmedName.split(/\s+/)[0].toLowerCase()
    
    // If first word is less than 2 characters, hide suggestions immediately
    if (firstWord.length < 2) {
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
      return
    }

    // Immediately check for matches (synchronous check to hide if no matches)
    const uniqueNames = getUniqueCompanyNames()
    const immediateMatches = uniqueNames.filter((name) => {
      const companyFirstWord = name.split(/\s+/)[0].toLowerCase()
      return companyFirstWord.startsWith(firstWord) || firstWord.startsWith(companyFirstWord)
    })

    // If no matches, hide immediately (no debounce delay)
    if (immediateMatches.length === 0) {
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
      return
    }

    // Debounce the search (200ms delay) for better performance
    debounceTimerRef.current = setTimeout(() => {
      // Re-check matches after debounce (in case user continued typing)
      const finalMatches = uniqueNames.filter((name) => {
        const companyFirstWord = name.split(/\s+/)[0].toLowerCase()
        return companyFirstWord.startsWith(firstWord) || firstWord.startsWith(companyFirstWord)
      })
      
      // Only show dropdown if there are matches
      if (finalMatches.length > 0) {
        setCompanyNameSuggestions(finalMatches.slice(0, 10)) // Limit to 10 suggestions
        setShowCompanyNameDropdown(true)
      } else {
        // Hide dropdown when there are no matches
        setCompanyNameSuggestions([])
        setShowCompanyNameDropdown(false)
      }
    }, 200) // 200ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
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


  // Group reviews by company name and calculate stats
  interface CompanyData {
    name: string
    category: string
    website_url?: string
    averageRating: number
    reviewCount: number
    reviews: CompanyReview[]
  }

  const getCompaniesData = useCallback(() => {
    const companyMap = new Map<string, CompanyReview[]>()
    
    filteredReviews.forEach((review) => {
      const companyName = review.company_name
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, [])
      }
      companyMap.get(companyName)!.push(review)
    })

    const companies: CompanyData[] = []
    companyMap.forEach((reviews, companyName) => {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
      const averageRating = totalRating / reviews.length
      const firstReview = reviews[0]
      
      companies.push({
        name: companyName,
        category: firstReview.category,
        website_url: firstReview.website_url,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
        reviews: reviews,
      })
    })

    return companies
  }, [filteredReviews])

  const groupedByCategory = categories.reduce((acc, category) => {
    const companies = getCompaniesData()
    acc[category] = companies.filter((c) => c.category === category)
    return acc
  }, {} as Record<string, CompanyData[]>)

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
    
    // Use responsive scroll amount based on container width
    const scrollAmount = carousel.offsetWidth * 0.8 // Scroll 80% of container width
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

  const renderCompanyCard = (company: CompanyData) => {
    const companySlug = generateSlug(company.name)
    return (
      <Link 
        href={`/companies/${companySlug}`}
        className="bg-white rounded-xl border-2 border-gray-300 p-3 sm:p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col cursor-pointer block"
      >
        <div className="flex items-start justify-between mb-2 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate" title={company.name}>
              {company.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs sm:text-sm text-gray-500 font-medium truncate max-w-[8.75rem]" title={company.category}>
                {company.category}
              </p>
            </div>
          </div>
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
        <div className="mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={company.averageRating} onRatingChange={() => {}} readonly />
            <span className="text-base sm:text-lg font-bold text-gray-900">{company.averageRating.toFixed(1)}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            {company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <div className="mt-auto pt-2 border-t border-gray-200">
          <p className="text-xs sm:text-sm font-medium text-primary-600 text-center">
            View All Reviews →
          </p>
        </div>
      </Link>
    )
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
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-6">
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

        {/* Company Details Modal with All Reviews */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCompany(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedCompany.name}</h2>
                  {selectedCompany.reviews[0]?.category && (
                    <p className="text-sm text-gray-500 font-medium mb-4">{selectedCompany.reviews[0].category}</p>
                  )}
                  {selectedCompany.reviews[0]?.website_url && (
                    <a
                      href={selectedCompany.reviews[0].website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2 mb-4"
                    >
                      <ExternalLink size={18} />
                      <span>Visit Website</span>
                    </a>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const avgRating = selectedCompany.reviews.reduce((sum, r) => sum + r.rating, 0) / selectedCompany.reviews.length
                      return (
                        <>
                          <StarRating rating={Math.round(avgRating * 10) / 10} onRatingChange={() => {}} readonly />
                          <span className="text-lg font-bold text-gray-900">
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({selectedCompany.reviews.length} {selectedCompany.reviews.length === 1 ? 'review' : 'reviews'})
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sorting Options */}
              <div className="mb-6 flex items-center gap-4 flex-wrap">
                <label className="text-sm font-semibold text-gray-700">Sort by:</label>
                <select
                  value={companySortBy}
                  onChange={(e) => setCompanySortBy(e.target.value as 'date' | 'rating')}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="date">Date</option>
                  <option value="rating">Rating</option>
                </select>
                <select
                  value={companySortOrder}
                  onChange={(e) => setCompanySortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="desc">Newest/Highest First</option>
                  <option value="asc">Oldest/Lowest First</option>
                </select>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {(() => {
                  const sortedReviews = [...selectedCompany.reviews].sort((a, b) => {
                    if (companySortBy === 'date') {
                      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                      return companySortOrder === 'desc' ? dateB - dateA : dateA - dateB
                    } else {
                      return companySortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating
                    }
                  })

                  return sortedReviews.map((review) => (
                    <div key={review.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-all">
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
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.review}</p>
                      {/* Edit/Delete buttons - only show for user's own reviews */}
                      {isLoaded && user && review.user_id === user.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                          <button
                            onClick={() => {
                              handleEditClick(review)
                              setSelectedCompany(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteClick(review)
                              setSelectedCompany(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                })()}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
            {popularCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group w-full"
              >
                <div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
                  {getCategoryIcon(category)}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center leading-tight">
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div id="filter-section" className="mb-10">
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
          const categoryCompanies = groupedByCategory[category] || []
          if (categoryCompanies.length === 0) return null

          return (
            <div key={category} className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="text-primary-600">
                    {getCategoryIcon(category)}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(category)
                    // Scroll to filter section
                    setTimeout(() => {
                      const filterSection = document.getElementById('filter-section')
                      if (filterSection) {
                        filterSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }, 50)
                  }}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
                >
                  View All →
                </button>
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
                  className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 sm:px-12"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categoryCompanies.map((company, index) => (
                    <div key={`${company.name}-${index}`} className="flex-shrink-0 w-full max-w-[18rem] sm:w-[18rem]">
                      {renderCompanyCard(company)}
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

        {/* Empty State - No Companies */}
        {getCompaniesData().length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Companies Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory || selectedRating > 0
                  ? 'No companies match your search criteria. Try adjusting your filters.'
                  : 'No companies have been reviewed yet. Be the first to share your experience!'}
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

        {/* All Companies Carousel (when no category filter) */}
        {!selectedCategory && getCompaniesData().length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All Companies</h2>
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel('all-companies', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
              
              {/* Carousel Container */}
              <div
                ref={(el) => setCarouselRef('all-companies', el)}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 sm:px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {getCompaniesData().map((company, index) => (
                  <div key={`${company.name}-${index}`} className="flex-shrink-0 w-full max-w-[18rem] sm:w-[18rem]">
                    {renderCompanyCard(company)}
                  </div>
                ))}
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel('all-companies', 'right')}
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

