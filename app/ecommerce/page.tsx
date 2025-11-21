'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { supabase, ProductListing } from '@/lib/supabase'
import FilterBar from '@/components/FilterBar'
import CategoryCarousel from '@/components/CategoryCarousel'
import StarRating from '@/components/StarRating'
import { Plus, ExternalLink, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap, ChevronLeft, ChevronRight, Search, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

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

const platforms = ['Amazon', 'Flipkart']

export default function EcommercePage() {
  const { user, isLoaded } = useUser()
  const [products, setProducts] = useState<ProductListing[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductListing[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRating, setSelectedRating] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<ProductListing[]>([])
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    platform_name: '',
    product_name: '',
    category: '',
    url: '',
    rating: 0,
    review: '',
  })
  const [loading, setLoading] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductListing | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<ProductListing | null>(null)
  const [pendingAddProduct, setPendingAddProduct] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [productNameSuggestions, setProductNameSuggestions] = useState<string[]>([])
  const [showProductNameDropdown, setShowProductNameDropdown] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [])

  const filterProducts = useCallback(() => {
    let filtered = [...products]

    // Real-time search for product name, platform name, or review text
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase().trim()
      if (searchTerm.length > 0) {
        filtered = filtered.filter((product) => {
          const productName = (product.product_name || '').toLowerCase()
          const platformName = product.platform_name.toLowerCase()
          const reviewText = product.review.toLowerCase()
          return productName.includes(searchTerm) || platformName.includes(searchTerm) || reviewText.includes(searchTerm)
        })
      }
    }

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    if (selectedRating > 0) {
      filtered = filtered.filter((product) => product.rating >= selectedRating)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, selectedCategory, selectedRating])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    filterProducts()
  }, [filterProducts])

  // Normalize text for comparison (remove spaces, special chars, lowercase)
  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  // Get unique product names from products
  const getUniqueProductNames = useCallback(() => {
    const uniqueNames = new Set<string>()
    products.forEach((product) => {
      if (product.product_name) {
        uniqueNames.add(product.product_name)
      }
    })
    return Array.from(uniqueNames).sort()
  }, [products])

  // Handle opening add product form after sign-in
  useEffect(() => {
    if (isLoaded && user && pendingAddProduct) {
      setShowAddForm(true)
      setPendingAddProduct(false)
      setShowSignInModal(false)
    }
  }, [isLoaded, user, pendingAddProduct])

  // Generate product name suggestions
  useEffect(() => {
    const trimmedName = formData.product_name?.trim() || ''
    
    if (showAddForm && trimmedName.length > 0) {
      const query = normalizeText(trimmedName)
      const uniqueNames = getUniqueProductNames()
      
      if (query.length > 0) {
        const matches = uniqueNames.filter((name) => {
          const normalizedName = normalizeText(name)
          return normalizedName.includes(query) || query.includes(normalizedName)
        })
        setProductNameSuggestions(matches.slice(0, 10)) // Limit to 10 suggestions
        setShowProductNameDropdown(matches.length > 0)
      } else {
        setProductNameSuggestions([])
        setShowProductNameDropdown(false)
      }
    } else {
      setProductNameSuggestions([])
      setShowProductNameDropdown(false)
    }
  }, [formData.product_name, showAddForm, getUniqueProductNames])

  // Generate search suggestions for dropdown
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim()
      const suggestions = products
        .filter((product) => {
          const productName = (product.product_name || '').toLowerCase()
          const platformName = product.platform_name.toLowerCase()
          const reviewText = product.review.toLowerCase()
          return productName.includes(query) || platformName.includes(query) || reviewText.includes(query)
        })
        .slice(0, 5) // Show top 5 matches
      setSearchSuggestions(suggestions)
      setShowSearchDropdown(suggestions.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSearchDropdown(false)
    }
  }, [searchQuery, products])

  const normalizeUrl = (url: string): string => {
    if (!url) return url
    url = url.trim()
    // Always ensure URL starts with https://
    if (!url.match(/^https:\/\//i)) {
      // Remove http:// if present
      url = url.replace(/^https?:\/\//i, '')
      url = 'https://' + url
    }
    return url
  }

  const isValidUrl = (url: string): boolean => {
    if (!url) return false // Required field
    url = url.trim()
    
    // Must be a valid URL format (will be normalized to https://)
    // Supports:
    // - https://test.com
    // - test.com (will be converted to https://test.com)
    // - www.test.com (will be converted to https://www.test.com)
    // - subdomain.test.com (will be converted to https://subdomain.test.com)
    const urlPattern = /^(https:\/\/)?(www\.)?([\da-z\.-]+)\.([a-z\.]{2,})([\/\w \.-]*)*\/?$/i
    return urlPattern.test(url)
  }

  const handleAddProductClick = () => {
    if (!isLoaded) return
    
    if (user) {
      // User is signed in, open form directly
      setShowAddForm(true)
    } else {
      // User is not signed in, show sign-in modal
      setPendingAddProduct(true)
      setShowSignInModal(true)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please sign in to submit a product.')
      return
    }

    // Validate required fields
    if (!formData.phone || !formData.platform_name || !formData.product_name || !formData.category || !formData.url || !formData.review || formData.rating === 0) {
      alert('Please fill in all required fields.')
      return
    }

    // Validate URL format
    if (!isValidUrl(formData.url)) {
      alert('Please enter a valid product URL. The URL will be automatically converted to HTTPS (e.g., example.com, www.example.in, https://example.com)')
      return
    }

    // Proceed with submission
    await handleSubmit()
  }

  const handleSubmit = async () => {
    if (!user) {
      alert('Please sign in to submit a product.')
      return
    }

    setLoading(true)

    try {
      // Normalize the URL before submitting (ensure it starts with https://)
      const normalizedUrl = normalizeUrl(formData.url)
      
      // Double-check that the normalized URL is valid HTTPS
      if (!normalizedUrl.startsWith('https://')) {
        alert('Invalid URL format. Please enter a valid URL.')
        setLoading(false)
        return
      }

      const normalizedFormData = {
        ...formData,
        url: normalizedUrl,
        user_id: user.id,
        email: user.primaryEmailAddress?.emailAddress || formData.email,
      }
      
      const { error } = await supabase.from('product_listings').insert([normalizedFormData])

      if (error) throw error

      setFormData({
        email: '',
        phone: '',
        platform_name: '',
        product_name: '',
        category: '',
        url: '',
        rating: 0,
        review: '',
      })
      setShowAddForm(false)
      fetchProducts()
      alert('Product submitted successfully!')
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (product: ProductListing) => {
    setEditingProduct(product)
    setShowEditForm(true)
    setFormData({
      email: product.email || '',
      phone: product.phone,
      platform_name: product.platform_name,
      product_name: product.product_name,
      category: product.category,
      url: product.url,
      rating: product.rating,
      review: product.review,
    })
  }

  const handleDeleteClick = (product: ProductListing) => {
    setDeletingProduct(product)
    setShowDeleteConfirm(true)
  }

  const handleEditSubmit = async () => {
    if (!editingProduct || !user) {
      alert('Please sign in to edit products.')
      return
    }

    setLoading(true)
    try {
      const normalizedUrl = normalizeUrl(formData.url)
      
      const response = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          platform_name: formData.platform_name,
          product_name: formData.product_name,
          category: formData.category,
          url: normalizedUrl,
          rating: formData.rating,
          review: formData.review,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Product updated successfully!')
        setShowEditForm(false)
        setEditingProduct(null)
        setFormData({
          email: '',
          phone: '',
          platform_name: '',
          product_name: '',
          category: '',
          url: '',
          rating: 0,
          review: '',
        })
        fetchProducts()
      } else {
        alert(data.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !user) {
      alert('Please sign in to delete products.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingProduct.id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Product deleted successfully!')
        setShowDeleteConfirm(false)
        setDeletingProduct(null)
        fetchProducts()
      } else {
        alert(data.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const groupedByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredProducts.filter((p) => p.category === category)
    return acc
  }, {} as Record<string, ProductListing[]>)

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
    
    const scrollAmount = 400
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

  const renderProductCard = (product: ProductListing) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2 flex-wrap">
            <span className="text-sm font-bold text-primary-600">{product.platform_name}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 font-medium">{product.category}</span>
            {product.created_at && (
              <>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">{formatDate(product.created_at)}</span>
              </>
            )}
          </div>
          {product.product_name && (
            <h3 className="text-lg font-bold text-gray-900 mb-2">{product.product_name}</h3>
          )}
        </div>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={18} />
          </a>
        )}
      </div>
      <div className="mb-4">
        <StarRating rating={product.rating} onRatingChange={() => {}} readonly />
      </div>
      <p className="text-gray-700 mb-4 leading-relaxed text-sm">{product.review}</p>
      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors mb-3 inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          View Product →
        </a>
      )}
      {/* Edit/Delete buttons - only show for user's own products */}
      {isLoaded && user && product.user_id === user.id && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <Link
            href="/my-products"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-center text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors py-2 px-3"
          >
            Manage in Your Products →
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 md:py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Ecommerce Product Listings
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Discover trusted product reviews from verified platforms
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search for products... (e.g., product name, platform, or review)"
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
                  {searchSuggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(product.product_name || product.platform_name)
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{product.product_name || product.platform_name}</p>
                          <p className="text-sm text-gray-500 mt-1">{product.platform_name} • {product.category}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <StarRating rating={product.rating} onRatingChange={() => {}} readonly />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searchQuery.trim().length > 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                {filteredProducts.length > 0 
                  ? `Found ${filteredProducts.length} matching ${filteredProducts.length === 1 ? 'product' : 'products'}`
                  : 'No products found matching your search'}
              </p>
            )}
          </div>

          <button
            onClick={handleAddProductClick}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
          >
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">

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
                Share Your Product Experience
              </h3>
              <p className="text-gray-600 text-lg">
                Help others make better purchase decisions by sharing your honest product review
              </p>
            </div>
            <button
              onClick={handleAddProductClick}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Add Product Review
            </button>
          </div>
        </div>

        {/* Sign In Modal for Add Product */}
        {showSignInModal && !user && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
            setShowSignInModal(false)
            setPendingAddProduct(false)
          }}>
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in or create an account to add a product review.
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
                    setPendingAddProduct(false)
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Form Modal */}
        {showEditForm && editingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Edit Product Listing</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-5">
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Reviewing as:</strong> {user.primaryEmailAddress?.emailAddress || user.firstName || 'User'}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Platform Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.platform_name}
                    onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select Platform</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Enter product name"
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
                    Product URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://amazon.in/product or flipkart.com/product or www.example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supports: https://example.com, example.in, www.example.com, etc.</p>
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
                    {loading ? 'Updating...' : 'Update Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false)
                      setEditingProduct(null)
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
        {showDeleteConfirm && deletingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Product</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your review for <strong>{deletingProduct.product_name || deletingProduct.platform_name}</strong>? This action cannot be undone.
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
                    setDeletingProduct(null)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Add New Product Listing</h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-5">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Platform Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.platform_name}
                    onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select Platform</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.product_name}
                      onChange={(e) => {
                        setFormData({ ...formData, product_name: e.target.value })
                      }}
                      onFocus={() => {
                        const trimmedName = formData.product_name?.trim() || ''
                        if (trimmedName.length > 0 && productNameSuggestions.length > 0) {
                          setShowProductNameDropdown(true)
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow clicking on suggestions
                        setTimeout(() => setShowProductNameDropdown(false), 200)
                      }}
                      placeholder="Type to search existing products or enter new"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                    {/* Product Name Suggestions Dropdown */}
                    {showProductNameDropdown && productNameSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                        {productNameSuggestions.map((name, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, product_name: name })
                              setShowProductNameDropdown(false)
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
                    Product URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://amazon.in/product or flipkart.com/product or www.example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supports: https://example.com, example.in, www.example.com, etc.</p>
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
                    {loading ? 'Submitting...' : 'Submit Product'}
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

        {/* Category Sections with Carousel Layout */}
        {categories.map((category) => {
          const categoryProducts = groupedByCategory[category] || []
          if (categoryProducts.length === 0) return null

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
                  href={`/ecommerce?category=${encodeURIComponent(category)}`}
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
                  {categoryProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[380px]">
                      {renderProductCard(product)}
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

        {/* All Products Carousel (when no category filter) */}
        {!selectedCategory && filteredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">All Products</h2>
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel('all-products', 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
              
              {/* Carousel Container */}
              <div
                ref={(el) => setCarouselRef('all-products', el)}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-[380px]">
                    {renderProductCard(product)}
                  </div>
                ))}
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel('all-products', 'right')}
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

