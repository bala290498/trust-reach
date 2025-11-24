'use client'

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabaseAuth } from '@/lib/supabase-auth'
import type { User } from '@supabase/supabase-js'
import SignInModal from '@/components/SignInModal'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { Search, Plus, ExternalLink, ChevronLeft, ChevronRight, Edit, Trash2, Laptop, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Car, Building, GraduationCap } from 'lucide-react'
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

// All available categories
const allCategories = [
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

function HomeContent() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const searchParams = useSearchParams()
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [filteredReviews, setFilteredReviews] = useState<CompanyReview[]>([])
  const [brandCards, setBrandCards] = useState<BrandCard[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRating, setSelectedRating] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ type: 'brand' | 'review'; name: string; data?: CompanyReview | BrandCard }>>([])
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null)
  const [isReviewFromYourReviews, setIsReviewFromYourReviews] = useState(false)
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
  const [availableBrandNames, setAvailableBrandNames] = useState<string[]>([])
  const [brandSearchQuery, setBrandSearchQuery] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [brandSearchError, setBrandSearchError] = useState('')
  const [showViewAllDropdown, setShowViewAllDropdown] = useState(false)
  const viewAllDropdownRef = useRef<HTMLDivElement | null>(null)
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; reviews: CompanyReview[] } | null>(null)
  const [companySortBy, setCompanySortBy] = useState<'date' | 'rating'>('date')
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('desc')
  const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  })

  // Get user session
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

  const fetchBrandCards = useCallback(async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrandCards(data || [])
        
        // Extract unique categories from brand cards
        const uniqueCategories = Array.from(new Set(data.map((brand: BrandCard) => brand.category).filter(Boolean))) as string[]
        setCategories(uniqueCategories.sort())
        
        // Extract brand names from markdown files only (sorted alphabetically)
        const brandNames = data
          .map((brand: BrandCard) => brand.brand_name)
          .filter((name: string) => name && name.trim())
          .sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        setAvailableBrandNames(brandNames)
      }
    } catch (error) {
      console.error('Error fetching brand cards:', error)
      setBrandCards([])
      setAvailableBrandNames([])
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
  }, [fetchBrandCards])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    filterReviews()
  }, [filterReviews, searchQuery, selectedRating])

  // Close View All dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewAllDropdownRef.current && !viewAllDropdownRef.current.contains(event.target as Node)) {
        setShowViewAllDropdown(false)
      }
    }

    if (showViewAllDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showViewAllDropdown])

  // Normalize text for comparison (remove spaces, special chars, lowercase)
  const normalizeText = useCallback((text: string): string => {
    return text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, '')
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
      setBrandSearchError('Company or Brand name not registered. Please select from the list.')
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

    // Validate brand name exists
    if (!validateBrandName()) {
      setNotification({ isOpen: true, type: 'error', message: 'Please select a registered company or brand name from the list.' })
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
        email: user.email || formData.email,
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

    if (!formData.company_name || !formData.review || formData.rating === 0) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please fill in all required fields.' })
      return
    }

    // Validate brand name exists
    if (!validateBrandName()) {
      setNotification({ isOpen: true, type: 'error', message: 'Please select a registered company or brand name from the list.' })
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
    // Show only first 6 characters of email
    return email.substring(0, 6)
  }

  const getEmailColor = (email: string): string => {
    if (!email) return '#2563eb' // Default primary-600 color
    
    // Simple hash function to convert email to a number
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    // Generate HSL color with good saturation and lightness
    // Hue: 0-360 (full color spectrum)
    // Saturation: 50-70% (vibrant but not too intense)
    // Lightness: 40-50% (readable on white text)
    const hue = Math.abs(hash) % 360
    const saturation = 50 + (Math.abs(hash) % 21) // 50-70%
    const lightness = 40 + (Math.abs(hash) % 11) // 40-50%
    
    // Convert HSL to RGB
    const h = hue / 360
    const s = saturation / 100
    const l = lightness / 100
    
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h * 6) % 2 - 1))
    const m = l - c / 2
    
    let r = 0, g = 0, b = 0
    
    if (h < 1/6) {
      r = c; g = x; b = 0
    } else if (h < 2/6) {
      r = x; g = c; b = 0
    } else if (h < 3/6) {
      r = 0; g = c; b = x
    } else if (h < 4/6) {
      r = 0; g = x; b = c
    } else if (h < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    // Convert to hex
    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'Hotels & Restaurants': UtensilsCrossed,
      'Health & Medical': Heart,
      'Travel & Vacation': Plane,
      'Construction & Manufacturing': Building2,
      'Home Services': HomeIcon,
      'Events & Entertainment': Music,
      'Beauty & Well-being': Sparkles,
      'Electronics & Technology': Laptop,
      'Vehicles & Transportation': Car,
      'Local Services': Building,
      'Education & Training': GraduationCap,
    }
    const IconComponent = iconMap[category]
    return IconComponent || Laptop
  }

  const getCategoryCount = (category: string) => {
    return brandCards.filter((brand) => brand.category === category).length
  }

  const getBestBrandInCategory = (category: string): { name: string; rating: number; reviewCount: number } | null => {
    const categoryBrands = brandCards.filter((brand) => brand.category === category)
    if (categoryBrands.length === 0) return null

    // For all categories, find brand with highest average rating
    let bestBrand: { name: string; rating: number; reviewCount: number } | null = null
    let highestRating = 0

    categoryBrands.forEach((brand) => {
      const brandReviews = reviews.filter((review) => review.company_name === brand.brand_name)
      if (brandReviews.length > 0) {
        const averageRating = brandReviews.reduce((sum, review) => sum + review.rating, 0) / brandReviews.length
        if (averageRating > highestRating || (averageRating === highestRating && brandReviews.length > (bestBrand?.reviewCount || 0))) {
          highestRating = averageRating
          bestBrand = { 
            name: brand.brand_name, 
            rating: averageRating,
            reviewCount: brandReviews.length
          }
        }
      }
    })

    // If no brands have reviews, return the first brand
    if (!bestBrand && categoryBrands.length > 0) {
      return {
        name: categoryBrands[0].brand_name,
        rating: 0,
        reviewCount: 0
      }
    }

    return bestBrand
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
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-[clamp(2.5rem,5vw,3rem)] w-full">
        <div className="max-w-[min(1200px,95vw)] mx-auto px-[clamp(1rem,4vw,2rem)] text-center">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-gray-900 mb-[clamp(0.75rem,2vw,1rem)] leading-tight">
            Find Trusted Company Reviews
          </h1>
          <p className="text-[clamp(0.875rem,2vw,1.125rem)] text-gray-600 mb-[clamp(1rem,3vw,1.5rem)] max-w-[min(42rem,90vw)] mx-auto">
            Discover authentic reviews from real customers. Make informed decisions with trusted insights. {isLoaded && !user && 'Sign in to add your own reviews.'}
          </p>
          
          {/* Search Bar */}
          <div className="w-full max-w-[min(36rem,90vw)] mx-auto mb-[clamp(1rem,3vw,1.5rem)]">
            <div className="relative">
              <Search className="absolute left-[clamp(0.75rem,2vw,1rem)] top-1/2 transform -translate-y-1/2 text-gray-400" size={18} style={{ width: 'clamp(1rem, 2.5vw, 1.125rem)', height: 'clamp(1rem, 2.5vw, 1.125rem)' }} />
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
                className="w-full pl-[clamp(2.75rem,8vw,3rem)] pr-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.625rem,1.5vw,0.75rem)] text-[clamp(0.875rem,2vw,1rem)] border border-gray-200 rounded-[clamp(0.5rem,1.5vw,0.75rem)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSearchDropdown && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-[clamp(0.75rem,2vw,1.25rem)] shadow-xl z-50 max-h-[min(24rem,60vh)] overflow-y-auto">
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
                          className="block w-full text-left px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.75rem,2vw,1rem)] hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[clamp(0.875rem,2vw,1rem)] text-gray-900 truncate">{suggestion.name}</p>
                              <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-gray-500 mt-1">
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
                                  <span className="text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold text-gray-900 whitespace-nowrap">{Math.round(averageRating * 10) / 10}</span>
                                </>
                              )}
                              {averageRating === 0 && (
                                <span className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-gray-400 whitespace-nowrap">No reviews</span>
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
                      className="w-full text-left px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.75rem,2vw,1rem)] hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[clamp(0.875rem,2vw,1rem)] text-gray-900 truncate">{suggestion.name}</p>
                        </div>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            {averageRating > 0 && (
                              <>
                                <StarRating rating={averageRating} onRatingChange={() => {}} readonly />
                                <span className="text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold text-gray-900 whitespace-nowrap">{Math.round(averageRating * 10) / 10}</span>
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
              <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-gray-500 mt-2 text-center">
                {filteredReviews.length > 0 
                  ? `Found ${filteredReviews.length} matching ${filteredReviews.length === 1 ? 'company' : 'companies'}`
                  : 'No companies found matching your search'}
              </p>
            )}
          </div>

          <button
            onClick={handleAddReviewClick}
            className="inline-flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] px-[clamp(1rem,3vw,1.25rem)] py-[clamp(0.625rem,1.5vw,0.75rem)] bg-primary-600 text-white font-semibold rounded-[clamp(0.5rem,1.5vw,0.75rem)] hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl text-[clamp(0.875rem,2vw,1rem)]"
          >
            <Plus size={18} style={{ width: 'clamp(1rem, 2.5vw, 1.125rem)', height: 'clamp(1rem, 2.5vw, 1.125rem)' }} />
            <span>Add Your Review</span>
          </button>
        </div>
      </div>

      <div className="max-w-[min(1200px,95vw)] mx-auto px-[clamp(1rem,4vw,2rem)] py-[clamp(2rem,5vw,4rem)]">

        {/* Company Details Modal with All Reviews */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[clamp(0.5rem,2vw,1rem)]" onClick={() => setSelectedCompany(null)}>
            <div className="bg-white rounded-[clamp(0.75rem,2vw,1.25rem)] max-w-[min(56rem,95vw)] w-full max-h-[90vh] overflow-y-auto p-[clamp(1rem,4vw,2rem)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-[clamp(1rem,3vw,1.5rem)] gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-gray-900 mb-2 break-words">{selectedCompany.name}</h2>
                  <div className="flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] mb-4 flex-wrap">
                    {(() => {
                      const avgRating = selectedCompany.reviews.reduce((sum, r) => sum + r.rating, 0) / selectedCompany.reviews.length
                      return (
                        <>
                          <StarRating rating={Math.round(avgRating * 10) / 10} onRatingChange={() => {}} readonly />
                          <span className="text-[clamp(1rem,2.5vw,1.125rem)] font-bold text-gray-900">
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-[clamp(0.875rem,2vw,1rem)] text-gray-600">
                            ({selectedCompany.reviews.length} {selectedCompany.reviews.length === 1 ? 'review' : 'reviews'})
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-[clamp(1.25rem,3vw,1.5rem)] h-[clamp(1.25rem,3vw,1.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sorting Options */}
              <div className="mb-[clamp(1rem,3vw,1.5rem)] flex items-center gap-[clamp(0.5rem,2vw,1rem)] flex-wrap">
                <label className="text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-700">Sort by:</label>
                <select
                  value={companySortBy}
                  onChange={(e) => setCompanySortBy(e.target.value as 'date' | 'rating')}
                  className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.5rem,1.5vw,0.625rem)] border-2 border-gray-200 rounded-[clamp(0.5rem,1.5vw,0.75rem)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-[clamp(0.875rem,2vw,1rem)]"
                >
                  <option value="date">Date</option>
                  <option value="rating">Rating</option>
                </select>
                <select
                  value={companySortOrder}
                  onChange={(e) => setCompanySortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.5rem,1.5vw,0.625rem)] border-2 border-gray-200 rounded-[clamp(0.5rem,1.5vw,0.75rem)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-[clamp(0.875rem,2vw,1rem)]"
                >
                  <option value="desc">Newest/Highest First</option>
                  <option value="asc">Oldest/Lowest First</option>
                </select>
              </div>

              {/* Reviews List */}
              <div className="space-y-[clamp(0.75rem,2vw,1rem)]">
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
                    <div key={review.id} className="border-2 border-gray-200 rounded-[clamp(0.75rem,2vw,1rem)] p-[clamp(1rem,3vw,1.5rem)] hover:border-primary-300 transition-all">
                      <div className="flex items-start justify-between mb-[clamp(0.5rem,1.5vw,0.75rem)] gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] mb-2">
                            <div className="w-[clamp(2rem,5vw,2.5rem)] h-[clamp(2rem,5vw,2.5rem)] rounded-full text-white flex items-center justify-center font-semibold text-[clamp(0.75rem,2vw,0.875rem)] flex-shrink-0" style={{ backgroundColor: getEmailColor(review.email) }}>
                              {getEmailName(review.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 truncate">{getEmailDisplayName(review.email)}</p>
                            </div>
                          </div>
                        </div>
                        {review.created_at && (
                          <p className="text-[clamp(0.875rem,2vw,1rem)] text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                        )}
                      </div>
                      <div className="mb-[clamp(0.5rem,1.5vw,0.75rem)]">
                        <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[clamp(0.875rem,2vw,1rem)] break-words">{review.review}</p>
                      {/* Edit/Delete buttons - only show for user's own reviews */}
                      {isLoaded && user && review.user_id === user.id && (
                        <div className="mt-[clamp(0.75rem,2vw,1rem)] pt-[clamp(0.75rem,2vw,1rem)] border-t border-gray-200 flex gap-[clamp(0.5rem,1.5vw,0.75rem)] flex-wrap">
                          <button
                            onClick={() => {
                              handleEditClick(review)
                              setSelectedCompany(null)
                            }}
                            className="flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vw,0.625rem)] text-[clamp(0.875rem,2vw,1rem)] font-medium text-blue-600 bg-blue-50 rounded-[clamp(0.5rem,1.5vw,0.75rem)] hover:bg-blue-100 transition-colors"
                          >
                            <Edit size={16} style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteClick(review)
                              setSelectedCompany(null)
                            }}
                            className="flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.5rem,1.5vw,0.625rem)] text-[clamp(0.875rem,2vw,1rem)] font-medium text-red-600 bg-red-50 rounded-[clamp(0.5rem,1.5vw,0.75rem)] hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                })()}
              </div>

              <div className="mt-[clamp(1rem,3vw,1.5rem)] pt-[clamp(1rem,3vw,1.5rem)] border-t border-gray-200">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="w-full bg-gray-200 text-gray-700 py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-gray-300 transition-all duration-200 text-[clamp(0.875rem,2vw,1rem)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[clamp(0.5rem,2vw,1rem)]" onClick={() => setSelectedReview(null)}>
            <div className="bg-white rounded-[clamp(0.75rem,2vw,1.25rem)] max-w-[min(42rem,95vw)] w-full max-h-[90vh] overflow-y-auto p-[clamp(1rem,4vw,2rem)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-[clamp(1rem,3vw,1.5rem)] gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-gray-900 mb-2 break-words">{selectedReview.company_name}</h2>
                  <div className="flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] flex-wrap">
                    {selectedReview.created_at ? (
                      <React.Fragment>
                        <span className="text-gray-300">•</span>
                        <p className="text-[clamp(0.875rem,2vw,1rem)] text-gray-500">{formatDate(selectedReview.created_at)}</p>
                      </React.Fragment>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-[clamp(1.25rem,3vw,1.5rem)] h-[clamp(1.25rem,3vw,1.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-[clamp(1rem,3vw,1.5rem)]">
                <StarRating rating={selectedReview.rating} onRatingChange={() => {}} readonly />
              </div>

              <div className="mb-[clamp(1rem,3vw,1.5rem)] flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                <div className="w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] rounded-full text-white flex items-center justify-center font-semibold text-[clamp(1rem,2.5vw,1.125rem)] flex-shrink-0" style={{ backgroundColor: getEmailColor(selectedReview.email) }}>
                  {getEmailName(selectedReview.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 truncate">{getEmailDisplayName(selectedReview.email)}</p>
                </div>
              </div>

              <div className="mb-[clamp(1rem,3vw,1.5rem)]">
                <h3 className="text-[clamp(1rem,2.5vw,1.125rem)] font-semibold text-gray-900 mb-[clamp(0.5rem,1.5vw,0.75rem)]">Review</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[clamp(0.875rem,2vw,1rem)] break-words">{selectedReview.review}</p>
              </div>

              <div className="pt-[clamp(1rem,3vw,1.5rem)] border-t border-gray-200 flex justify-end items-center gap-4 flex-wrap">
                {/* Only show Edit/Delete buttons if opened from Your Reviews section */}
                {isReviewFromYourReviews && isLoaded && user && selectedReview.user_id === user.id ? (
                  <div className="flex gap-[clamp(0.5rem,1.5vw,0.75rem)] flex-wrap">
                    <button
                      onClick={() => {
                        handleEditClick(selectedReview)
                        setSelectedReview(null)
                        setIsReviewFromYourReviews(false)
                      }}
                      className="bg-blue-600 text-white py-[clamp(0.625rem,1.5vw,0.75rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] text-[clamp(0.875rem,2vw,1rem)]"
                    >
                      <Edit size={18} style={{ width: 'clamp(1rem, 2.5vw, 1.125rem)', height: 'clamp(1rem, 2.5vw, 1.125rem)' }} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteClick(selectedReview)
                        setSelectedReview(null)
                        setIsReviewFromYourReviews(false)
                      }}
                      className="bg-red-600 text-white py-[clamp(0.625rem,1.5vw,0.75rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-red-700 transition-all duration-200 flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] text-[clamp(0.875rem,2vw,1rem)]"
                    >
                      <Trash2 size={18} style={{ width: 'clamp(1rem, 2.5vw, 1.125rem)', height: 'clamp(1rem, 2.5vw, 1.125rem)' }} />
                      <span>Delete</span>
                    </button>
                  </div>
                ) : null}
                <button
                  onClick={() => {
                    setSelectedReview(null)
                    setIsReviewFromYourReviews(false)
                  }}
                  className="bg-gray-200 text-gray-700 py-[clamp(0.625rem,1.5vw,0.75rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-gray-300 transition-all duration-200 text-[clamp(0.875rem,2vw,1rem)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign In Modal for Add Review */}
        <SignInModal
          isOpen={showSignInModal && !user}
          onClose={() => {
            setShowSignInModal(false)
            setPendingAddReview(false)
          }}
          title="Sign In Required"
          message="Please sign in or create an account to add a review."
        />

        {/* Add Company Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[clamp(0.5rem,2vw,1rem)]">
            <div className="bg-white rounded-[clamp(0.75rem,2vw,1.25rem)] max-w-[min(42rem,95vw)] w-full max-h-[90vh] overflow-y-auto p-[clamp(1rem,4vw,2rem)] shadow-2xl">
              <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold mb-[clamp(1rem,3vw,1.5rem)] text-gray-900">Add New Company Review</h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-[clamp(0.75rem,2vw,1rem)]">
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-[clamp(0.75rem,2vw,1rem)] p-[clamp(0.75rem,2vw,1rem)] mb-[clamp(0.75rem,2vw,1rem)]">
                    <p className="text-[clamp(0.875rem,2vw,1rem)] text-gray-700 break-words">
                      <strong>Reviewing as:</strong> {user.email || user.user_metadata?.full_name || 'User'}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 mb-2">
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
                        // Delay to allow clicking on dropdown items
                        setTimeout(() => {
                          setShowBrandDropdown(false)
                          validateBrandName()
                        }, 200)
                      }}
                      className={`w-full px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] border-2 rounded-[clamp(0.75rem,2vw,1rem)] focus:outline-none focus:ring-2 transition-all text-[clamp(0.875rem,2vw,1rem)] ${
                        brandSearchError
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="Type to search existing brands..."
                    />
                    {/* Brand Suggestions Dropdown */}
                    {showBrandDropdown && getFilteredBrands().length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-[clamp(0.75rem,2vw,1rem)] shadow-xl z-50 max-h-[min(15rem,40vh)] overflow-y-auto">
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
                            className="w-full text-left px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-semibold text-gray-900 text-[clamp(0.875rem,2vw,1rem)] truncate">{name}</p>
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
                  <label className="block text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={(rating) => setFormData({ ...formData, rating })}
                  />
                </div>
                <div>
                  <label className="block text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 mb-2">
                    Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    rows={4}
                    className="w-full px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] border-2 border-gray-200 rounded-[clamp(0.75rem,2vw,1rem)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-[clamp(0.875rem,2vw,1rem)] resize-y"
                  />
                </div>
                <div className="flex gap-[clamp(0.5rem,2vw,1rem)] flex-wrap">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-w-[min(8rem,40%)] bg-primary-600 text-white py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 text-[clamp(0.875rem,2vw,1rem)]"
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                    }}
                    className="flex-1 min-w-[min(8rem,40%)] bg-gray-100 text-gray-700 py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-gray-200 transition-all duration-200 text-[clamp(0.875rem,2vw,1rem)]"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-[clamp(0.5rem,2vw,1rem)]">
            <div className="bg-white rounded-[clamp(0.75rem,2vw,1.25rem)] max-w-[min(42rem,95vw)] w-full max-h-[90vh] overflow-y-auto p-[clamp(1rem,4vw,2rem)] shadow-2xl">
              <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold mb-[clamp(1rem,3vw,1.5rem)] text-gray-900">Edit Company Review</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-[clamp(0.75rem,2vw,1rem)]">
                  {user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-[clamp(0.75rem,2vw,1rem)] p-[clamp(0.75rem,2vw,1rem)] mb-[clamp(0.75rem,2vw,1rem)]">
                      <p className="text-[clamp(0.875rem,2vw,1rem)] text-gray-700 break-words">
                        <strong>Reviewing as:</strong> {user.email || user.user_metadata?.full_name || 'User'}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 mb-2">
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
                        className={`w-full px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] border-2 rounded-[clamp(0.75rem,2vw,1rem)] focus:outline-none focus:ring-2 transition-all text-[clamp(0.875rem,2vw,1rem)] ${
                          brandSearchError
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="Type to search existing brands..."
                      />
                      {/* Brand Suggestions Dropdown */}
                      {showBrandDropdown && getFilteredBrands().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-[clamp(0.75rem,2vw,1rem)] shadow-xl z-50 max-h-[min(15rem,40vh)] overflow-y-auto">
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
                              className="w-full text-left px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-semibold text-gray-900 text-[clamp(0.875rem,2vw,1rem)] truncate">{name}</p>
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
                    <label className="block text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 mb-2">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <StarRating
                      rating={formData.rating}
                      onRatingChange={(rating) => setFormData({ ...formData, rating })}
                    />
                  </div>
                  <div>
                    <label className="block text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 mb-2">
                      Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.review}
                      onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                      rows={4}
                      className="w-full px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] border-2 border-gray-200 rounded-[clamp(0.75rem,2vw,1rem)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-[clamp(0.875rem,2vw,1rem)] resize-y"
                    />
                  </div>
                  <div className="flex gap-[clamp(0.5rem,2vw,1rem)] flex-wrap">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 min-w-[min(8rem,40%)] bg-primary-600 text-white py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 text-[clamp(0.875rem,2vw,1rem)]"
                    >
                      {loading ? 'Updating...' : 'Update Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false)
                        setEditingReview(null)
                      }}
                      className="flex-1 min-w-[min(8rem,40%)] bg-gray-100 text-gray-700 py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-gray-200 transition-all duration-200 text-[clamp(0.875rem,2vw,1rem)]"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-[clamp(0.5rem,2vw,1rem)]">
            <div className="bg-white rounded-[clamp(0.75rem,2vw,1.25rem)] max-w-[min(28rem,95vw)] w-full p-[clamp(1rem,4vw,2rem)] shadow-2xl">
              <h2 className="text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-gray-900 mb-[clamp(0.75rem,2vw,1rem)]">Delete Review</h2>
              <p className="text-[clamp(0.875rem,2vw,1rem)] text-gray-600 mb-[clamp(1rem,3vw,1.5rem)] break-words">
                Are you sure you want to delete your review for <strong>{deletingReview.company_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-[clamp(0.5rem,2vw,1rem)] flex-wrap">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="flex-1 min-w-[min(8rem,40%)] bg-red-600 text-white py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50 text-[clamp(0.875rem,2vw,1rem)]"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletingReview(null)
                  }}
                  className="flex-1 min-w-[min(8rem,40%)] bg-gray-100 text-gray-700 py-[clamp(0.75rem,2vw,1rem)] px-[clamp(1rem,3vw,1.5rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-gray-200 transition-all duration-200 text-[clamp(0.875rem,2vw,1rem)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popular Categories */}
        {allCategories.filter((category) => getCategoryCount(category) > 0).length > 0 && (
          <div className="mb-[clamp(2rem,5vw,3rem)]">
            <div className="flex items-center justify-between mb-[clamp(1rem,3vw,1.5rem)] gap-4 flex-wrap">
              <h2 className="text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-gray-900 break-words">Popular Categories</h2>
              <Link
                href="/all-categories"
                className="inline-flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] text-primary-600 hover:text-primary-700 font-semibold text-[clamp(0.75rem,2vw,0.875rem)] transition-colors flex-shrink-0 underline-offset-4 hover:underline"
              >
                View All
                <ChevronRight size={16} style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} />
              </Link>
            </div>
            <div className="relative group">
                {/* Left Arrow Button - Desktop Only */}
                    <button
                      onClick={() => {
                    const carousel = carouselRefs.current['popular-categories']
                    if (carousel) {
                      const scrollAmount = carousel.offsetWidth * 0.8
                      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
                    }
                  }}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-primary-50 hover:border-primary-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft size={24} style={{ width: 'clamp(1.25rem, 3vw, 1.5rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)' }} className="text-gray-700" />
                    </button>

                {/* Carousel Container */}
                <div
                  ref={(el) => {
                    if (el) carouselRefs.current['popular-categories'] = el
                  }}
                  className="flex gap-[clamp(0.75rem,2vw,1.5rem)] overflow-x-auto scrollbar-hide scroll-smooth pb-[clamp(0.75rem,2vw,1rem)]"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {allCategories
                    .filter((category) => getCategoryCount(category) > 0)
                    .map((category) => {
                    const categoryCount = getCategoryCount(category)
                    const IconComponent = getCategoryIcon(category)
                    
                    return (
                      <Link
                        key={category}
                        href={`/category/${generateSlug(category)}`}
                        className="bg-white rounded-[clamp(0.75rem,2vw,1rem)] border border-gray-200 p-[clamp(1rem,3vw,1.5rem)] hover:shadow-md hover:border-primary-300 transition-all duration-200 flex flex-col items-center text-center cursor-pointer group w-[min(280px,85vw)] sm:w-[min(300px,40vw)] md:w-[min(320px,30vw)] flex-shrink-0 shadow-sm"
                      >
                        <div className="mb-[clamp(0.75rem,2vw,1rem)]">
                          <div className="text-gray-600 group-hover:text-primary-600 transition-colors flex justify-center">
                            <IconComponent size={24} style={{ width: 'clamp(1.5rem, 4vw, 2rem)', height: 'clamp(1.5rem, 4vw, 2rem)' }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="text-[clamp(1rem,2.5vw,1.125rem)] font-bold text-gray-900 mb-1 break-words group-hover:text-primary-600 transition-colors">
                            {category}
                          </h3>
                          <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-gray-500">
                            {categoryCount} {categoryCount === 1 ? 'business' : 'businesses'}
                          </p>
                        </div>
                        <div className="mt-auto pt-[clamp(0.5rem,1.5vw,0.75rem)] border-t border-gray-200 w-full">
                          <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] font-medium text-primary-600 text-center group-hover:text-primary-700 transition-colors">
                            View Category →
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Right Arrow Button - Desktop Only */}
                <button
                  onClick={() => {
                    const carousel = carouselRefs.current['popular-categories']
                    if (carousel) {
                      const scrollAmount = carousel.offsetWidth * 0.8
                      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' })
                    }
                  }}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-lg hover:bg-primary-50 hover:border-primary-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  aria-label="Scroll categories right"
                >
                  <ChevronRight size={24} style={{ width: 'clamp(1.25rem, 3vw, 1.5rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)' }} className="text-gray-700" />
                </button>
              </div>
          </div>
        )}

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-[clamp(0.75rem,2vw,1.25rem)] p-[clamp(1.5rem,4vw,2.5rem)] mb-[clamp(2rem,5vw,3rem)] border border-pink-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-[clamp(1rem,3vw,1.5rem)]">
            <div className="flex-1 min-w-0">
              <h3 className="text-[clamp(1.25rem,3vw,2rem)] font-bold text-gray-900 mb-2 break-words">
                Share Your Experience
              </h3>
              <p className="text-gray-600 text-[clamp(1rem,2.5vw,1.125rem)] break-words">
                Help others make better decisions by sharing your honest review
              </p>
            </div>
            <button
              onClick={handleAddReviewClick}
              className="bg-gray-900 text-white px-[clamp(1.5rem,4vw,2rem)] py-[clamp(0.75rem,2vw,1rem)] rounded-[clamp(0.75rem,2vw,1rem)] font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl text-[clamp(0.875rem,2vw,1rem)] flex-shrink-0"
            >
              Write a Review
            </button>
          </div>
        </div>

        {/* Category-Based Brand Sections */}
        {brandCards.length > 0 && categories.length > 0 && (
          <div className="mb-12">
              {categories
                .filter((category) => {
                  // Only show categories that have at least one brand
                  const categoryBrands = brandCards.filter((brand) => brand.category === category)
                  return categoryBrands.length > 0
                })
                .map((category) => {
                let categoryBrands = brandCards.filter((brand) => brand.category === category)

                // Sort by average rating for all categories
                categoryBrands = [...categoryBrands].sort((a, b) => {
                  const aReviews = reviews.filter((review) => review.company_name === a.brand_name)
                  const bReviews = reviews.filter((review) => review.company_name === b.brand_name)
                  const aRating = aReviews.length > 0
                    ? aReviews.reduce((sum, review) => sum + review.rating, 0) / aReviews.length
                    : 0
                  const bRating = bReviews.length > 0
                    ? bReviews.reduce((sum, review) => sum + review.rating, 0) / bReviews.length
                    : 0
                  return bRating - aRating // Sort by average rating descending
                })

                return (
                  <div key={category} className="mb-[clamp(2rem,5vw,3rem)]">
                    <div className="flex items-center justify-between mb-[clamp(1rem,3vw,1.5rem)] gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-gray-900 break-words">
                          Best in {category}
                        </h2>
                      </div>
                      <Link
                        href={`/category/${generateSlug(category)}`}
                        className="inline-flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] text-primary-600 hover:text-primary-700 font-semibold text-[clamp(0.75rem,2vw,0.875rem)] transition-colors flex-shrink-0 underline-offset-4 hover:underline"
                      >
                        View All
                        <ChevronRight size={16} style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} />
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
                        <ChevronLeft size={24} style={{ width: 'clamp(1.25rem, 3vw, 1.5rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)' }} className="text-gray-700" />
                      </button>

                      {/* Carousel Container */}
                      <div
                        ref={(el) => {
                          if (el) carouselRefs.current[category] = el
                        }}
                        className="flex gap-[clamp(0.75rem,2vw,1.5rem)] overflow-x-auto scrollbar-hide scroll-smooth pb-[clamp(0.75rem,2vw,1rem)]"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {categoryBrands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/brands/${brand.id}`}
                            className="bg-white rounded-[clamp(0.75rem,2vw,1rem)] border border-gray-200 p-[clamp(0.75rem,2vw,1rem)] hover:shadow-md hover:border-primary-300 transition-all duration-200 flex flex-col cursor-pointer group w-[min(280px,85vw)] sm:w-[min(300px,40vw)] md:w-[min(320px,30vw)] flex-shrink-0 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[clamp(0.75rem,2vw,0.875rem)] font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors break-words" title={brand.brand_name}>
                                  {brand.brand_name}
                                </h3>
                                {brand.category && (
                                  <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-gray-500 font-medium truncate" title={brand.category}>
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
                                  <ExternalLink size={14} style={{ width: 'clamp(0.75rem, 2vw, 0.875rem)', height: 'clamp(0.75rem, 2vw, 0.875rem)' }} />
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
                                <div className="mt-[clamp(0.5rem,1.5vw,0.75rem)] flex-1 flex flex-col justify-end">
                                  {reviewCount > 0 ? (
                                    <div className="flex items-center gap-2 mb-2">
                                      <StarRating rating={Math.round(averageRating * 10) / 10} onRatingChange={() => {}} readonly />
                                      <span className="text-[clamp(0.625rem,1.5vw,0.75rem)] font-semibold text-gray-900">{Math.round(averageRating * 10) / 10}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mb-2">
                                      <StarRating rating={0} onRatingChange={() => {}} readonly />
                                      <span className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-gray-400">No reviews</span>
                                    </div>
                                  )}
                                  {reviewCount > 0 && (
                                    <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-gray-500 mb-2">
                                      {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                                    </p>
                                  )}
                                </div>
                              )
                            })()}
                            
                            <div className="mt-[clamp(0.5rem,1.5vw,0.75rem)] pt-2 border-t border-gray-200">
                              <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] font-medium text-primary-600 text-center group-hover:text-primary-700 transition-colors">
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
                        <ChevronRight size={24} style={{ width: 'clamp(1.25rem, 3vw, 1.5rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)' }} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Recent Reviews Section */}
        {reviews.length > 0 && (
          <div className="mb-[clamp(2rem,5vw,3rem)]">
            <div className="flex items-center justify-between mb-[clamp(1rem,3vw,1.5rem)] gap-4 flex-wrap">
              <h2 className="text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-gray-900">Recent Reviews</h2>
                {reviews.length > 6 && (
                  <Link
                    href="/all-reviews"
                    className="inline-flex items-center gap-[clamp(0.25rem,1vw,0.5rem)] text-primary-600 hover:text-primary-700 font-semibold text-[clamp(0.75rem,2vw,0.875rem)] transition-colors flex-shrink-0 underline-offset-4 hover:underline"
                  >
                    View All
                    <ChevronRight size={16} style={{ width: 'clamp(0.875rem, 2vw, 1rem)', height: 'clamp(0.875rem, 2vw, 1rem)' }} />
                  </Link>
                )}
              </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(0.75rem,2vw,1.5rem)]">
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
                      onClick={() => {
                        setSelectedReview(review)
                        setIsReviewFromYourReviews(false)
                      }}
                      className="bg-white rounded-[clamp(0.75rem,2vw,1rem)] border border-gray-200 p-[clamp(0.75rem,2vw,1rem)] hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-[clamp(0.5rem,1.5vw,0.75rem)] gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[clamp(1rem,2.5vw,1.125rem)] font-bold text-gray-900 mb-1 truncate break-words" title={review.company_name}>
                            {review.company_name}
                          </h3>
                        </div>
                        {review.created_at && (
                          <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</p>
                        )}
                      </div>
                      
                      <div className="mb-[clamp(0.5rem,1.5vw,0.75rem)]">
                        <StarRating rating={review.rating} onRatingChange={() => {}} readonly />
                      </div>
                      
                      <div className="mb-[clamp(0.5rem,1.5vw,0.75rem)] flex items-center gap-2">
                        <div className="w-[clamp(1.75rem,4.5vw,2rem)] h-[clamp(1.75rem,4.5vw,2rem)] rounded-full text-white flex items-center justify-center font-semibold text-[clamp(0.75rem,2vw,0.875rem)] flex-shrink-0" style={{ backgroundColor: getEmailColor(review.email) }}>
                          {getEmailName(review.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[clamp(0.875rem,2vw,1rem)] font-semibold text-gray-900 truncate" title={getEmailDisplayName(review.email)}>
                            {getEmailDisplayName(review.email)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed text-[clamp(0.875rem,2vw,1rem)] line-clamp-3 break-words" title={review.review}>
                        {review.review}
                      </p>
                      
                      <div className="mt-[clamp(0.5rem,1.5vw,0.75rem)] pt-[clamp(0.5rem,1.5vw,0.75rem)] border-t border-gray-200">
                        <p className="text-[clamp(0.625rem,1.5vw,0.75rem)] font-medium text-primary-600 text-center hover:text-primary-700 transition-colors">
                          Read More →
                        </p>
                      </div>
                    </div>
                  ))}
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

