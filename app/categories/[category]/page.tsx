'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, CompanyReview } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import StarRating from '@/components/StarRating'
import { ArrowLeft, ExternalLink, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap } from 'lucide-react'

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
  category: string
  website_url?: string
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
      const { data, error } = await supabase
        .from('company_reviews')
        .select('*')
        .eq('category', categoryName)
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

  useEffect(() => {
    if (categoryName) {
      fetchReviews()
    }
  }, [categoryName, fetchReviews])

  // Group reviews by company name
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
      const firstReview = reviews[0]

      companiesData.push({
        name: companyName,
        category: firstReview.category,
        website_url: firstReview.website_url || undefined,
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
    const companySlug = generateSlug(company.name)
    
    return (
      <div className="relative flex-shrink-0 pt-4" style={{ width: '140px', marginRight: '24px' }}>
        {/* Semi-Transparent Numeral Behind Card - Scaled smaller, beneath card, fully visible */}
        <div 
          className="absolute -left-6 sm:-left-8 top-4 bottom-0 flex items-center justify-center pointer-events-none"
          style={{ 
            opacity: 0.12,
            zIndex: 0
          }}
        >
          <span 
            className="text-[70px] sm:text-[85px] font-black leading-none text-gray-900"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              lineHeight: 1
            }}
          >
            {rank}
          </span>
        </div>
        
        {/* Compact Card - Fixed width, only name, score, and review count */}
        <Link
          href={`/companies/${companySlug}`}
          className="relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-200 flex flex-col cursor-pointer block overflow-hidden justify-center"
          style={{ 
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 10,
            width: '140px',
            height: '120px',
            minHeight: '120px',
            maxHeight: '120px'
          }}
        >
          {/* Line 1: Company Name (bold) */}
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
          <p className="text-gray-600">Loading companies...</p>
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
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} in this category
          </p>
        </div>

        {/* Top 5 Players Section */}
        {top5Companies.length > 0 && (
          <div className="mb-12 pt-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Top 5 Players</h2>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">All Companies</h2>
          </div>
        )}

        {/* Companies Grid */}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Companies Found</h3>
              <p className="text-gray-600 mb-6">
                No companies have been reviewed in this category yet. Be the first to share your experience!
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

