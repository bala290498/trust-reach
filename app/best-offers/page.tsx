'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import FilterBar from '@/components/FilterBar'
import CategoryCarousel from '@/components/CategoryCarousel'
import { CheckCircle2, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap, ChevronLeft, ChevronRight, Search } from 'lucide-react'

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

interface Offer {
  id: string
  business_name: string
  url: string
  category: string
  services: string
  offer_deals: string
  quantity_left?: string
  verified: boolean
  created_at: string
}

export default function BestOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newArrivals, setNewArrivals] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Offer[]>([])
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const loadFromMarkdown = useCallback(async () => {
    // This would load from markdown files in the content/offers directory
    // For now, we'll use sample data structure
    const sampleOffers: Offer[] = []
    setOffers(sampleOffers)
  }, [])

  const fetchOffers = useCallback(async () => {
    try {
      // Fetch from markdown files or API endpoint
      // For now, we'll use a local markdown file structure
      const response = await fetch('/api/offers')
      if (response.ok) {
        const data = await response.json()
        setOffers(data)
      } else {
        // Fallback: Load from local markdown files
        loadFromMarkdown()
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      loadFromMarkdown()
    } finally {
      setLoading(false)
    }
  }, [loadFromMarkdown])

  const filterOffers = useCallback(() => {
    let filtered = [...offers]

    if (selectedCategory) {
      filtered = filtered.filter((offer) => offer.category === selectedCategory)
    }

    if (verifiedOnly) {
      filtered = filtered.filter((offer) => offer.verified)
    }

    if (newArrivals) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      filtered = filtered.filter(
        (offer) => new Date(offer.created_at) >= sevenDaysAgo
      )
    }

    setFilteredOffers(filtered)
  }, [offers, selectedCategory, newArrivals, verifiedOnly])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  useEffect(() => {
    filterOffers()
  }, [filterOffers])

  const groupedByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredOffers.filter((o) => o.category === category)
    return acc
  }, {} as Record<string, Offer[]>)

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

  const renderOfferCard = (offer: Offer) => (
    <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 hover:shadow-lg hover:border-primary-200 transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-1.5 mb-1.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{offer.business_name}</h3>
            {offer.verified && (
              <div className="flex items-center space-x-1 text-secondary-500 bg-secondary-50 px-1.5 py-0.5 rounded-lg">
                <CheckCircle2 size={14} />
                <span className="text-xs font-bold">Verified</span>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mb-2">{offer.category}</p>
        </div>
      </div>
      <div className="mb-2">
        <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1">Services/Offers:</p>
        <div className="prose prose-sm max-w-none text-gray-700 text-xs sm:text-sm line-clamp-3">
          <ReactMarkdown>{offer.services}</ReactMarkdown>
        </div>
      </div>
      {offer.offer_deals && (
        <div className="mb-2">
          <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1">Deals/Stock Clearance:</p>
          <div className="prose prose-sm max-w-none text-gray-700 text-xs sm:text-sm line-clamp-2">
            <ReactMarkdown>{offer.offer_deals}</ReactMarkdown>
          </div>
        </div>
      )}
      {offer.quantity_left && (
        <div className="mb-2 p-2 bg-primary-50 rounded-lg">
          <p className="text-xs sm:text-sm font-semibold text-gray-900">
            Products Left: <span className="text-primary-600 font-bold text-sm sm:text-base">{offer.quantity_left}</span>
          </p>
        </div>
      )}
      {offer.url && (
        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-semibold transition-colors inline-flex items-center"
        >
          Visit Business →
        </a>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 md:py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Best Offers & Stock Clearances
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Exclusive deals and verified offers from trusted businesses
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search for offers... (e.g., business name or services)"
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
                  setTimeout(() => setShowSearchDropdown(false), 200)
                }}
                className="w-full pl-12 pr-4 py-2.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm hover:shadow-md"
              />
              
              {/* Search Suggestions Dropdown */}
              {showSearchDropdown && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  {searchSuggestions.map((offer) => (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(offer.business_name)
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{offer.business_name}</p>
                          <p className="text-sm text-gray-500 mt-1">{offer.category}</p>
                        </div>
                        {offer.verified && (
                          <div className="flex-shrink-0 flex items-center space-x-1 text-secondary-500 bg-secondary-50 px-2 py-1 rounded-lg">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-bold">Verified</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searchQuery.trim().length > 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                {filteredOffers.length > 0 
                  ? `Found ${filteredOffers.length} matching ${filteredOffers.length === 1 ? 'offer' : 'offers'}`
                  : 'No offers found matching your search'}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        
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
        <div className="mb-10">
          <FilterBar
            selectedCategory={selectedCategory}
            selectedRating={0}
            onCategoryChange={setSelectedCategory}
            onRatingChange={() => {}}
            showRating={false}
            showNewArrivals={true}
            showVerified={true}
            newArrivalsChecked={newArrivals}
            verifiedChecked={verifiedOnly}
            onNewArrivalsChange={setNewArrivals}
            onVerifiedChange={setVerifiedOnly}
          />
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 md:p-10 mb-12 border border-pink-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Exclusive Deals & Offers
              </h3>
              <p className="text-gray-600 text-lg">
                Discover verified offers and stock clearances from trusted businesses
              </p>
            </div>
          </div>
        </div>

        {/* Category Sections with Carousel Layout */}
        {categories.map((category) => {
          const categoryOffers = groupedByCategory[category] || []
          if (categoryOffers.length === 0) return null

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
                  href={`/best-offers?category=${encodeURIComponent(category)}`}
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
                  className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 sm:px-12"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categoryOffers.map((offer) => (
                    <div key={offer.id} className="flex-shrink-0 w-full max-w-[18rem] sm:w-[18rem]">
                      {renderOfferCard(offer)}
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

        {/* All Offers Carousel (when no category filter) */}
        {!selectedCategory && filteredOffers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All Offers</h2>
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel('all-offers', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
              
              {/* Carousel Container */}
              <div
                ref={(el) => setCarouselRef('all-offers', el)}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 sm:px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredOffers.map((offer) => (
                  <div key={offer.id} className="flex-shrink-0 w-full max-w-[18rem] sm:w-[18rem]">
                    {renderOfferCard(offer)}
                  </div>
                ))}
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel('all-offers', 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                aria-label="Scroll right"
              >
                <ChevronRight size={24} className="text-gray-700" />
              </button>
            </div>
          </div>
        )}

        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No offers available at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">
              Offers are manually updated by the TrustReach team.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

