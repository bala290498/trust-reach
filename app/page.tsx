'use client'

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { Search, Plus, ExternalLink, ChevronLeft, ChevronRight, Edit, Trash2, Laptop, UtensilsCrossed, Heart, Plane } from 'lucide-react'
import YourReviewsSlider from '@/components/YourReviewsSlider'
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

function HomeContent() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [filteredReviews, setFilteredReviews] = useState<CompanyReview[]>([])
  const [brandCards, setBrandCards] = useState<BrandCard[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [popularCategories, setPopularCategories] = useState<Array<{ name: string; icon: string; description: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRating, setSelectedRating] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ type: 'brand' | 'review'; name: string; data?: CompanyReview | BrandCard }>>([])
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null)
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
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
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; reviews: CompanyReview[] } | null>(null)
  const [companySortBy, setCompanySortBy] = useState<'date' | 'rating'>('date')
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('desc')
  const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  })

  const fetchBrandCards = useCallback(async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrandCards(data || [])
        
        // Extract unique categories from brand cards
        const uniqueCategories = Array.from(new Set(data.map((brand: BrandCard) => brand.category).filter(Boolean))) as string[]
        setCategories(uniqueCategories.sort())
      }
    } catch (error) {
      console.error('Error fetching brand cards:', error)
      setBrandCards([])
    }
  }, [])

  const fetchPopularCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/popular-categories')
      if (response.ok) {
        const data = await response.json()
        setPopularCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching popular categories:', error)
      setPopularCategories([])
    }
  }, [])

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

    if (selectedRating > 0) {
      filtered = filtered.filter((review) => review.rating >= selectedRating)
    }

    setFilteredReviews(filtered)
  }, [reviews, searchQuery, selectedRating])

  useEffect(() => {
    fetchBrandCards()
    fetchPopularCategories()
  }, [fetchBrandCards, fetchPopularCategories])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    filterReviews()
  }, [filterReviews, searchQuery, selectedRating])

  // Normalize text for comparison (remove spaces, special chars, lowercase)
  const normalizeText = useCallback((text: string): string => {
    return text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, '')
  }, [])

  // Get all available brand/company names from both brands and reviews
  const getAllAvailableBrandNames = useCallback(() => {
    const uniqueNames = new Set<string>()
    
    // Add brand names from brand cards
    brandCards.forEach((brand) => {
      if (brand.brand_name && brand.brand_name.trim()) {
        uniqueNames.add(brand.brand_name.trim())
      }
    })
    
    // Add company names from reviews
    reviews.forEach((review) => {
      if (review.company_name && review.company_name.trim()) {
        uniqueNames.add(review.company_name.trim())
      }
    })
    
    // Sort alphabetically
    return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [brandCards, reviews])

  // Handle opening add review form after sign-in
  useEffect(() => {
    if (isLoaded && user && pendingAddReview) {
      setShowAddForm(true)
      setPendingAddReview(false)
      setShowSignInModal(false)
    }
  }, [isLoaded, user, pendingAddReview])

  // Handle company parameter from URL to pre-fill form
  useEffect(() => {
    const companyParam = searchParams.get('company')
    if (companyParam && isLoaded) {
      const decodedCompany = decodeURIComponent(companyParam)
      if (user) {
        // User is signed in, open form with pre-filled company name
        setFormData(prev => ({ ...prev, company_name: decodedCompany }))
        setShowAddForm(true)
      } else {
        // User is not signed in, set pending and show sign-in modal
        setFormData(prev => ({ ...prev, company_name: decodedCompany }))
        setPendingAddReview(true)
        setShowSignInModal(true)
      }
    }
  }, [searchParams, isLoaded, user])

  // Generate company name suggestions with debouncing - normalized keyword search
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Show suggestions for both add and edit forms
    const isFormOpen = showAddForm || showEditForm
    if (!isFormOpen) {
      // Only clear when both forms are closed
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

    // Normalize search query (remove spaces, special chars, lowercase)
    const normalizedQuery = normalizeText(trimmedName)
    
    // If normalized query is less than 2 characters, hide suggestions immediately
    if (normalizedQuery.length < 2) {
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
      return
    }

    // Get all available brand/company names
    const allBrandNames = getAllAvailableBrandNames()
    
    // Filter matches using normalized keyword search
    // Match if normalized brand name contains normalized query or vice versa
    const findMatches = (query: string, names: string[]) => {
      return names.filter((name) => {
        const normalizedName = normalizeText(name)
        // Check if query appears in name (allows partial matches anywhere in the name)
        return normalizedName.includes(query) || query.includes(normalizedName)
      })
    }

    // Immediately check for matches (synchronous check to hide if no matches)
    const immediateMatches = findMatches(normalizedQuery, allBrandNames)

    // If no matches, hide immediately (no debounce delay)
    if (immediateMatches.length === 0) {
      setCompanyNameSuggestions([])
      setShowCompanyNameDropdown(false)
      return
    }

    // Debounce the search (200ms delay) for better performance
    debounceTimerRef.current = setTimeout(() => {
      const currentInput = formData.company_name?.trim() || ''
      const queryLower = currentInput.toLowerCase()
      
      // Check if input exactly matches one of the available brand names (case-insensitive)
      const exactMatch = allBrandNames.find(name => name.toLowerCase() === queryLower)
      
      // If there's an exact match, hide the dropdown (user already selected/typed the exact value)
      if (exactMatch) {
        setCompanyNameSuggestions([])
        setShowCompanyNameDropdown(false)
        return
      }
      
      // Re-check matches after debounce (in case user continued typing)
      const finalMatches = findMatches(normalizeText(currentInput), allBrandNames)
      
      // Filter out exact matches from suggestions (since user already typed it)
      const filteredMatches = finalMatches.filter(name => name.toLowerCase() !== queryLower)
      
      // If no other matches after filtering out exact match, hide dropdown
      if (filteredMatches.length === 0) {
        setCompanyNameSuggestions([])
        setShowCompanyNameDropdown(false)
        return
      }
      
      // Sort matches by relevance: starts with query, then contains
      const sortedMatches = filteredMatches.sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        
        // Starts with query gets highest priority
        if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1
        if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1
        
        // Alphabetical order for remaining matches
        return aLower.localeCompare(bLower)
      })
      
      // Show dropdown with other matches (excluding exact match)
      setCompanyNameSuggestions(sortedMatches.slice(0, 15)) // Show up to 15 suggestions
      setShowCompanyNameDropdown(true)
    }, 200) // 200ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [formData.company_name, showAddForm, showEditForm, getAllAvailableBrandNames, normalizeText])

  // Generate search suggestions for dropdown - includes both brands and reviews
  useEffect(() => {
    // Clear any existing timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current)
    }

    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([])
      setShowSearchDropdown(false)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const normalizedQuery = normalizeText(searchQuery)
    
    // Debounce the search (150ms delay) for better performance
    searchDebounceTimerRef.current = setTimeout(() => {
      const suggestions: Array<{ type: 'brand' | 'review'; name: string; data?: CompanyReview | BrandCard }> = []

      // Search through brand cards
      if (brandCards && brandCards.length > 0) {
        brandCards.forEach((brand) => {
          if (brand.brand_name) {
            const brandNameLower = brand.brand_name.toLowerCase()
            const normalizedBrandName = normalizeText(brand.brand_name)
            
            // Check if query matches (case-insensitive, normalized)
            if (brandNameLower.includes(query) || normalizedBrandName.includes(normalizedQuery)) {
              suggestions.push({
                type: 'brand',
                name: brand.brand_name,
                data: brand
              })
            }
          }
        })
      }

      // Search through reviews
      if (reviews && reviews.length > 0) {
        reviews.forEach((review) => {
          if (review.company_name) {
            const companyNameLower = review.company_name.toLowerCase()
            const normalizedCompanyName = normalizeText(review.company_name)
            
            // Check if query matches (case-insensitive, normalized)
            if (companyNameLower.includes(query) || normalizedCompanyName.includes(normalizedQuery)) {
              // Avoid duplicates - if a brand with same name already exists, skip
              const isDuplicate = suggestions.some(
                s => s.type === 'brand' && s.name.toLowerCase() === review.company_name.toLowerCase()
              )
              if (!isDuplicate) {
                suggestions.push({
                  type: 'review',
                  name: review.company_name,
                  data: review
                })
              }
            }
          }
        })
      }

      // Remove duplicates by name (case-insensitive)
      const uniqueSuggestions = Array.from(
        new Map(suggestions.map(s => [s.name.toLowerCase(), s])).values()
      )

      // Sort by relevance: exact matches first, then starts with, then contains
      const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
        const aLower = a.name.toLowerCase()
        const bLower = b.name.toLowerCase()
        
        // Exact match gets highest priority
        if (aLower === query) return -1
        if (bLower === query) return 1
        
        // Starts with query gets second priority
        if (aLower.startsWith(query) && !bLower.startsWith(query)) return -1
        if (bLower.startsWith(query) && !aLower.startsWith(query)) return 1
        
        // Brands get priority over reviews for same match level
        if (a.type === 'brand' && b.type === 'review') return -1
        if (a.type === 'review' && b.type === 'brand') return 1
        
        // Alphabetical order for remaining matches
        return aLower.localeCompare(bLower)
      })

      // Limit to top 10 suggestions
      const finalSuggestions = sortedSuggestions.slice(0, 10)
      setSearchSuggestions(finalSuggestions)
      setShowSearchDropdown(finalSuggestions.length > 0)
    }, 150) // 150ms debounce delay

    // Cleanup function
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current)
        searchDebounceTimerRef.current = null
      }
    }
  }, [searchQuery, reviews, brandCards, normalizeText])

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
    if (!formData.company_name || !formData.review || formData.rating === 0) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please fill in all required fields.' })
      return
    }

    if (!user) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please sign in to submit a review.' })
      return
    }

    // Proceed with submission
    await handleSubmit()
  }

  const handleSubmit = async () => {
    if (!user) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please sign in to submit a review.' })
      return
    }

    setLoading(true)

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
        company_name: '',
        rating: 0,
        review: '',
      })
      setShowAddForm(false)
      fetchReviews()
      setNotification({ isOpen: true, type: 'success', message: 'Review submitted successfully!' })
    } catch (error: any) {
      console.error('Error adding review:', error)
      const errorMessage = error?.message || error?.details || 'Unknown error occurred'
      setNotification({ isOpen: true, type: 'error', message: 'Failed to add review. Please try again.' })
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
      company_name: review.company_name,
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
      setNotification({ isOpen: true, type: 'warning', message: 'Please sign in to edit reviews.' })
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
          rating: formData.rating,
          review: formData.review,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNotification({ isOpen: true, type: 'success', message: 'Review updated successfully!' })
        setShowEditForm(false)
        setEditingReview(null)
        setFormData({
          email: '',
          company_name: '',
          rating: 0,
          review: '',
        })
        fetchReviews()
      } else {
        setNotification({ isOpen: true, type: 'error', message: data.error || 'Failed to update review' })
      }
    } catch (error) {
      console.error('Error updating review:', error)
      setNotification({ isOpen: true, type: 'error', message: 'Failed to update review. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReview || !user) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please sign in to delete reviews.' })
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

      // Close delete confirmation modal first
      setShowDeleteConfirm(false)
      setDeletingReview(null)

      if (response.ok && data.success) {
        fetchReviews()
        // Small delay to ensure delete modal closes before showing notification
        setTimeout(() => {
          setNotification({ 
            isOpen: true, 
            type: 'success', 
            message: 'Review deleted successfully!' 
          })
        }, 150)
      } else {
        const errorMsg = data.error || data.message || 'Failed to delete review'
        console.error('Delete error response:', data)
        // Small delay to ensure delete modal closes before showing notification
        setTimeout(() => {
          setNotification({ 
            isOpen: true, 
            type: 'error', 
            message: errorMsg 
          })
        }, 150)
      }
    } catch (error) {
      // Close delete confirmation modal first
      setShowDeleteConfirm(false)
      setDeletingReview(null)
      console.error('Error deleting review:', error)
      // Small delay to ensure delete modal closes before showing notification
      setTimeout(() => {
        setNotification({ 
          isOpen: true, 
          type: 'error', 
          message: 'Failed to delete review. Please try again.' 
        })
      }, 150)
    } finally {
      setLoading(false)
    }
  }


  // Group reviews by company name and calculate stats
  interface CompanyData {
    name: string
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
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
        reviews: reviews,
      })
    })

    return companies
  }, [filteredReviews])

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
    // Show only first 5 characters of email
    return email.substring(0, 5)
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
          </div>
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
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen && !!notification.message}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Your Reviews Slider */}
      <YourReviewsSlider 
        isOpen={showSlider} 
        onClose={() => setShowSlider(false)}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 md:py-12 px-0 sm:px-6">
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
                placeholder="Search for companies or brands... (e.g., type any word from company name)"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                  // Dropdown will be shown/hidden by useEffect based on suggestions
                }}
                onFocus={() => {
                  // Show dropdown if there are suggestions
                  if (searchQuery.trim().length >= 2) {
                    // The useEffect will handle showing/hiding based on suggestions
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
                  {searchSuggestions.map((suggestion, index) => {
                    // Calculate average rating for brand if it's a brand type
                    let averageRating = 0
                    let reviewCount = 0
                    let brandId: string | null = null
                    
                    if (suggestion.type === 'brand' && suggestion.data) {
                      const brand = suggestion.data as BrandCard
                      brandId = brand.id
                      const brandReviews = reviews.filter(
                        (r) => r.company_name.toLowerCase() === suggestion.name.toLowerCase()
                      )
                      reviewCount = brandReviews.length
                      averageRating = reviewCount > 0
                        ? brandReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                        : 0
                    } else if (suggestion.type === 'review' && suggestion.data) {
                      const review = suggestion.data as CompanyReview
                      averageRating = review.rating
                      reviewCount = 1
                    }
                    
                    // For brand type suggestions, use Link to navigate to brand page
                    if (suggestion.type === 'brand' && brandId) {
                      return (
                        <Link
                          key={`${suggestion.type}-${suggestion.name}-${index}`}
                          href={`/brands/${brandId}`}
                          onClick={() => {
                            setShowSearchDropdown(false)
                          }}
                          className="block w-full text-left px-6 py-4 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{suggestion.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {suggestion.data && (suggestion.data as BrandCard).category && (
                                  <span>{(suggestion.data as BrandCard).category}</span>
                                )}
                                {reviewCount > 0 && (
                                  <span className="ml-2">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              {averageRating > 0 && (
                                <>
                                  <StarRating rating={averageRating} onRatingChange={() => {}} readonly />
                                  <span className="text-xs font-semibold text-gray-900">{Math.round(averageRating * 10) / 10}</span>
                                </>
                              )}
                              {averageRating === 0 && (
                                <span className="text-xs text-gray-400">No reviews</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    }
                    
                    // For review type suggestions, keep as button to set search query
                    return (
                    <button
                        key={`${suggestion.type}-${suggestion.name}-${index}`}
                      type="button"
                        onMouseDown={(e) => {
                          // Use onMouseDown to prevent blur event
                          e.preventDefault()
                          setSearchQuery(suggestion.name)
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">{suggestion.name}</p>
                        </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {averageRating > 0 && (
                              <>
                                <StarRating rating={averageRating} onRatingChange={() => {}} readonly />
                                <span className="text-xs font-semibold text-gray-900">{Math.round(averageRating * 10) / 10}</span>
                              </>
                            )}
                        </div>
                      </div>
                    </button>
                    )
                  })}
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

      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-16">

        {/* Company Details Modal with All Reviews */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCompany(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedCompany.name}</h2>
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

              <div className="mb-6">
                <StarRating rating={selectedReview.rating} onRatingChange={() => {}} readonly />
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                  {getEmailName(selectedReview.email)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{getEmailDisplayName(selectedReview.email)}</p>
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
                    Company or Brand Name <span className="text-red-500">*</span>
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
                        const currentInput = formData.company_name?.trim() || ''
                        if (currentInput.length >= 2 && companyNameSuggestions.length > 0) {
                          // Check if input exactly matches a suggestion - if so, don't show dropdown
                          const queryLower = currentInput.toLowerCase()
                          const exactMatch = companyNameSuggestions.find(name => name.toLowerCase() === queryLower)
                          if (!exactMatch) {
                            setShowCompanyNameDropdown(true)
                          }
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
                            onMouseDown={(e) => {
                              // Use onMouseDown instead of onClick to prevent blur event
                              e.preventDefault()
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
                      Company or Brand Name <span className="text-red-500">*</span>
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
                          const currentInput = formData.company_name?.trim() || ''
                          if (currentInput.length >= 2 && companyNameSuggestions.length > 0) {
                            // Check if input exactly matches a suggestion - if so, don't show dropdown
                            const queryLower = currentInput.toLowerCase()
                            const exactMatch = companyNameSuggestions.find(name => name.toLowerCase() === queryLower)
                            if (!exactMatch) {
                              setShowCompanyNameDropdown(true)
                            }
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
                              onMouseDown={(e) => {
                                // Use onMouseDown instead of onClick to prevent blur event
                                e.preventDefault()
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
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

        {/* Popular Categories */}
        {popularCategories.length > 0 && (
          <div className="mb-10 px-0 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Categories</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {popularCategories.map((category, index) => {
                  const iconMap: Record<string, any> = {
                    Laptop: Laptop,
                    UtensilsCrossed: UtensilsCrossed,
                    Heart: Heart,
                    Plane: Plane,
                  }
                  const IconComponent = iconMap[category.icon] || Laptop
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedCategory(category.name)
                        // Scroll to filter section
                        document.getElementById('filter-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 transition-all duration-200 w-full max-w-[11.25rem] h-[8.75rem] p-4 ${
                        selectedCategory === category.name
                          ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      <IconComponent size={40} className={selectedCategory === category.name ? 'text-primary-600' : 'text-gray-600'} />
                      <p className="font-semibold text-sm leading-tight text-center">{category.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div id="filter-section" className="mb-10 px-0 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {categories.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Category:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[11.25rem]"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
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

        {/* Category-Based Brand Sections */}
        {brandCards.length > 0 && categories.length > 0 && (
          <div className="mb-12 px-0 sm:px-6">
            <div className="max-w-7xl mx-auto">
              {categories
                .filter((category) => !selectedCategory || category === selectedCategory)
                .map((category) => {
                const categoryBrands = brandCards.filter((brand) => brand.category === category)
                if (categoryBrands.length === 0) return null

                return (
                  <div key={category} className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                      <Link
                        href={`/category/${generateSlug(category)}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                      >
                        View All
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                    <div className="relative group">
                      {/* Left Arrow Button - Desktop Only */}
                      <button
                        onClick={() => {
                          const carousel = carouselRefs.current[category]
                          if (carousel) {
                            const scrollAmount = carousel.offsetWidth * 0.8
                            carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
                          }
                        }}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-primary-50 hover:border-primary-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        aria-label={`Scroll ${category} left`}
                      >
                        <ChevronLeft size={24} className="text-gray-700" />
                      </button>

                      {/* Carousel Container */}
                      <div
                        ref={(el) => {
                          if (el) carouselRefs.current[category] = el
                        }}
                        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {categoryBrands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/brands/${brand.id}`}
                            className="bg-white rounded-lg border-2 border-gray-300 p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col cursor-pointer group w-full max-w-full sm:max-w-[13.75rem] lg:max-w-[15rem] flex-shrink-0"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors" title={brand.brand_name}>
                                  {brand.brand_name}
                                </h3>
                                {brand.category && (
                                  <p className="text-xs text-gray-500 font-medium truncate" title={brand.category}>
                                    {brand.category}
                                  </p>
                                )}
                              </div>
                              {brand.url && (
                                <a
                                  href={brand.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0 ml-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                            
                            {/* Star Rating and Review Count */}
                            {(() => {
                              const brandReviews = reviews.filter((review) => review.company_name === brand.brand_name)
                              const reviewCount = brandReviews.length
                              const averageRating = reviewCount > 0
                                ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
                                : 0
                              
                              return (
                                <div className="mt-3 flex-1 flex flex-col justify-end">
                                  {reviewCount > 0 ? (
                                    <div className="flex items-center gap-2 mb-2">
                                      <StarRating rating={Math.round(averageRating * 10) / 10} onRatingChange={() => {}} readonly />
                                      <span className="text-xs font-semibold text-gray-900">{Math.round(averageRating * 10) / 10}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mb-2">
                                      <StarRating rating={0} onRatingChange={() => {}} readonly />
                                      <span className="text-xs text-gray-400">No reviews</span>
                                    </div>
                                  )}
                                  {reviewCount > 0 && (
                                    <p className="text-xs text-gray-500 mb-2">
                                      {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                                    </p>
                                  )}
                                </div>
                              )
                            })()}
                            
                            <div className="mt-3 pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-primary-600 text-center group-hover:text-primary-700 transition-colors">
                                View Details →
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Right Arrow Button - Desktop Only */}
                      <button
                        onClick={() => {
                          const carousel = carouselRefs.current[category]
                          if (carousel) {
                            const scrollAmount = carousel.offsetWidth * 0.8
                            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' })
                          }
                        }}
                        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-primary-50 hover:border-primary-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        aria-label={`Scroll ${category} right`}
                      >
                        <ChevronRight size={24} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Reviews Section */}
        {reviews.length > 0 && (
          <div className="mb-12 px-0 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
                {reviews.length > 6 && (
                  <Link
                    href="/"
                    className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                  >
                    View All
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {reviews
                  .sort((a, b) => {
                    // Sort by created_at descending (most recent first)
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                    return dateB - dateA
                  })
                  .slice(0, 6)
                  .map((review) => (
                    <div
                      key={review.id}
                      onClick={() => setSelectedReview(review)}
                      className="bg-white rounded-xl border-2 border-gray-300 p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={review.company_name}>
                            {review.company_name}
                          </h3>
                        </div>
                        {review.created_at && (
                          <p className="text-xs text-gray-500 whitespace-nowrap ml-2">{formatDate(review.created_at)}</p>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                      </div>
                      
                      <div className="mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {getEmailName(review.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate" title={getEmailDisplayName(review.email)}>
                            {getEmailDisplayName(review.email)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed text-sm line-clamp-3" title={review.review}>
                        {review.review}
                      </p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-primary-600 text-center hover:text-primary-700 transition-colors">
                          Read More →
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              
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

