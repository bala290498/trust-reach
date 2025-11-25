'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { ArrowLeft, ExternalLink, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap } from 'lucide-react'
import { useCallback } from 'react'

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
  return IconComponent ? <IconComponent size={24} /> : null
}

// Utility function to encode category name for URL
function encodeCategoryName(category: string): string {
  return encodeURIComponent(category)
}

// Utility function to decode category name from URL
function decodeCategoryName(encoded: string): string {
  return decodeURIComponent(encoded)
}

interface CompanyData {
  name: string
  averageRating: number
  reviewCount: number
  reviews: CompanyReview[]
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState<string>('')
  const [brandCards, setBrandCards] = useState<Array<{ id: string; brand_name: string }>>([])

  // Decode category name from URL
  useEffect(() => {
    if (params?.category) {
      const decoded = decodeCategoryName(params.category as string)
      setCategoryName(decoded)
    }
  }, [params])

  const fetchReviews = useCallback(async () => {
    if (!categoryName) return

    try {
      // Note: category field no longer exists in company_reviews
      // This page may need to be updated to work with the new brand-based system
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [categoryName])

  // Fetch brands to get brand IDs for consistent slugs
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands')
        if (response.ok) {
          const data = await response.json()
          setBrandCards(data || [])
        }
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
    }
    fetchBrands()
  }, [])

  useEffect(() => {
    if (categoryName) {
      fetchReviews()
    }
  }, [categoryName, fetchReviews])

  // Helper function to get brand ID from brand name (for consistent slugs)
  const getBrandId = useCallback((brandName: string): string => {
    const brand = brandCards.find(
      (b) => b.brand_name.trim().toLowerCase() === brandName.trim().toLowerCase()
    )
    return brand ? brand.id : generateSlug(brandName)
  }, [brandCards])

  // Group reviews by brand name
  useEffect(() => {
    const companyMap = new Map<string, CompanyReview[]>()

    reviews.forEach((review) => {
      const companyName = review.company_name
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, [])
      }
      companyMap.get(companyName)!.push(review)
    })

    const companiesData: CompanyData[] = []
    companyMap.forEach((reviews, companyName) => {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
      const averageRating = totalRating / reviews.length

      companiesData.push({
        name: companyName,
        averageRating,
        reviewCount: reviews.length,
        reviews,
      })
    })

    // Sort by review count (descending), then by average rating (descending)
    companiesData.sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount
      }
      return b.averageRating - a.averageRating
    })

    setCompanies(companiesData)
  }, [reviews])

  // Get top 5 companies by average rating
  const getTop5Companies = useCallback(() => {
    const sortedByRating = [...companies].sort((a, b) => {
      // Primary sort: average rating (descending)
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating
      }
      // Secondary sort: review count (descending) for tie-breaking
      return b.reviewCount - a.reviewCount
    })
    return sortedByRating.slice(0, 5)
  }, [companies])

  const top5Companies = getTop5Companies()

  const getEmailName = (email: string) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const renderTop5Card = (company: CompanyData, rank: number) => {
    const brandId = getBrandId(company.name)
    
    return (
      <div className="relative flex-shrink-0 pt-4 w-[8.75rem] mr-[3.375rem] max-w-full">
        {/* Semi-Transparent Numeral Behind Card - Scaled smaller, beneath card, fully visible */}
        <div 
          className="absolute -left-6 sm:-left-8 top-4 bottom-0 flex items-center justify-center pointer-events-none"
          style={{ 
            opacity: 0.12,
            zIndex: 0
          }}
        >
          <span 
            className="font-black leading-none text-gray-900"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              lineHeight: 1,
              fontSize: 'clamp(3.5rem, 3.5rem + 0.5vw, 5.3125rem)'
            }}
          >
            {rank}
          </span>
        </div>
        
        {/* Compact Card - Fixed width, only name, score, and review count */}
        <Link
          href={`/brands/${brandId}`}
          className="relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-200 flex flex-col cursor-pointer block overflow-hidden justify-center w-[8.75rem] h-[7.5rem] min-h-[7.5rem] max-h-[7.5rem] max-w-full"
          style={{ 
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 10
          }}
        >
          {/* Line 1: Brand Name (bold) */}
          <div className="text-center mb-3 flex-shrink-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-tight" title={company.name}>
              {company.name}
            </h3>
          </div>
          
          {/* Line 2: Average Score and Review Count */}
          <div className="text-center flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              {company.averageRating.toFixed(1)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </Link>
      </div>
    )
  }

  const renderCompanyCard = (company: CompanyData) => {
    const brandId = getBrandId(company.name)
    return (
      <Link
        href={`/brands/${brandId}`}
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

  // Validate category
  if (!categoryName || !categories.includes(categoryName)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to All Reviews
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to All Reviews</span>
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-primary-600">
              {getCategoryIcon(categoryName)}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{categoryName}</h1>
          </div>
          <p className="text-gray-600 text-lg">
            {companies.length} {companies.length === 1 ? 'brand' : 'brands'} in this category
          </p>
        </div>

        {/* Top 5 Players Section */}
        {top5Companies.length > 0 && (
          <div className="mb-12 pt-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">TrustReach Top 5 Players</h2>
            {/* Desktop: 5-up row with clear horizontal gaps (~24px) */}
            <div className="hidden xl:flex xl:justify-center xl:items-start xl:px-12 xl:pt-4">
              {top5Companies.map((company, index) => (
                <div key={`top5-${company.name}-${index}`} className="flex-shrink-0">
                  {renderTop5Card(company, index + 1)}
                </div>
              ))}
            </div>
            {/* Mobile/Tablet: Horizontal scroll with clear spacing (~24px) */}
            <div className="xl:hidden overflow-x-auto scrollbar-hide pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4">
              <div className="flex justify-start items-start" style={{ width: 'max-content', paddingLeft: '3rem' }}>
                {top5Companies.map((company, index) => (
                  <div key={`top5-${company.name}-${index}`} className="flex-shrink-0">
                    {renderTop5Card(company, index + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Companies Section */}
        {companies.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">All Brands</h2>
          </div>
        )}

        {/* Brands Grid */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {companies.map((company, index) => (
              <div key={`${company.name}-${index}`}>
                {renderCompanyCard(company)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Brands Found</h3>
              <p className="text-gray-600 mb-6">
                No brands have been reviewed in this category yet. Be the first to share your experience!
              </p>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Back to All Reviews</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

