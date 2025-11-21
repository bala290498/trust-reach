'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase, ProductListing } from '@/lib/supabase'
import StarRating from '@/components/StarRating'
import { ExternalLink, Edit, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

export default function MyProductsPage() {
  const { user, isLoaded } = useUser()
  const [products, setProducts] = useState<ProductListing[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductListing | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<ProductListing | null>(null)
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
  const [submitting, setSubmitting] = useState(false)

  const fetchMyProducts = useCallback(async () => {
    if (!user?.id) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('product_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching my products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded) {
      fetchMyProducts()
    }
  }, [isLoaded, fetchMyProducts])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const normalizeUrl = (url: string): string => {
    if (!url) return url
    url = url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  const handleEditClick = (product: ProductListing) => {
    setEditingProduct(product)
    setFormData({
      email: product.email || '',
      phone: product.phone || '',
      platform_name: product.platform_name || '',
      product_name: product.product_name || '',
      category: product.category || '',
      url: product.url || '',
      rating: product.rating || 0,
      review: product.review || '',
    })
    setShowEditForm(true)
  }

  const handleDeleteClick = (product: ProductListing) => {
    setDeletingProduct(product)
    setShowDeleteConfirm(true)
  }

  const handleEditSubmit = async () => {
    if (!editingProduct || !user) return

    setSubmitting(true)
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product')
      }

      setShowEditForm(false)
      setEditingProduct(null)
      fetchMyProducts()
      alert('Product updated successfully!')
    } catch (error: any) {
      console.error('Error updating product:', error)
      alert(error.message || 'Failed to update product. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !user) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingProduct.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product')
      }

      setShowDeleteConfirm(false)
      setDeletingProduct(null)
      fetchMyProducts()
      alert('Product deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert(error.message || 'Failed to delete product. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Products</h1>
            <p className="text-gray-600 mb-6">Please sign in to view your products.</p>
            <Link
              href="/ecommerce"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft size={20} />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/ecommerce"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to All Products</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Products</h1>
          <p className="text-gray-600">Manage and edit your product reviews</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-gray-600">Loading your products...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-6">You haven&apos;t submitted any product reviews yet.</p>
              <Link
                href="/ecommerce"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Add Your First Product Review</span>
              </Link>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border-2 border-gray-300 p-6 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2 mb-2 flex-wrap">
                      <span className="text-sm font-bold text-primary-600">{product.platform_name}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500 font-medium">{product.category}</span>
                      {product.created_at && (
                        <>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(product.created_at)}</span>
                        </>
                      )}
                    </div>
                    {product.product_name && (
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={product.product_name}>
                        {product.product_name}
                      </h3>
                    )}
                  </div>
                  {product.url && (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
                <div className="mb-3 flex-shrink-0">
                  <StarRating rating={product.rating} onRatingChange={() => {}} readonly />
                </div>
                <p className="text-gray-700 leading-relaxed text-sm line-clamp-3 flex-1 overflow-hidden mb-4" title={product.review}>
                  {product.review}
                </p>
                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors mb-3 inline-block"
                  >
                    View Product →
                  </a>
                )}
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Product Form Modal */}
        {showEditForm && editingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Edit Product Listing</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-5">
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
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Write your review here..."
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Product'}
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
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
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
      </div>
    </div>
  )
}

