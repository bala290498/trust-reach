'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { ArrowLeft, Calendar, Plus, Minus, CheckCircle2, MessageCircle, Mail, Phone } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { generateSlug } from '@/lib/utils'
import NotificationModal from '@/components/NotificationModal'

interface CommunityPurchase {
  id: string
  title: string
  category: string
  valid_until?: string
  status: 'monthly' | 'special'
  about: string
  offer_deals?: string
  stock_clearances?: string
  market_price?: string
  community_price?: string
  dealer_email?: string
  dealer_phone?: string
  minimum_order_quantity?: string
  created_at: string
}

export default function CommunityPurchaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [purchase, setPurchase] = useState<CommunityPurchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    quantity: 1,
    message: '',
  })
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  })

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/community-purchase/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setPurchase(data)
        } else {
          console.error('Failed to fetch community purchase')
        }
      } catch (error) {
        console.error('Error fetching community purchase:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchPurchase()
    }
  }, [params.slug])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleQuantityChange = (delta: number) => {
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta),
    }))
  }

  const handleQuantityInput = (value: string) => {
    if (value === '') {
      setFormData((prev) => ({ ...prev, quantity: 1 }))
      return
    }
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      setFormData((prev) => ({ ...prev, quantity: num }))
    }
  }

  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !purchase) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please sign in to submit interest.' })
      return
    }

    if (!formData.phone || formData.quantity <= 0) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please fill in phone number and quantity.' })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/community-purchase/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress || '',
          phone: formData.phone,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Create WhatsApp template message
        const whatsappMessage = `Order: ${purchase.title}\n\nEmail: ${user.primaryEmailAddress?.emailAddress || 'N/A'}\n\nPhone Number *\n${formData.phone}\n\nQuantity Needed *\n${formData.quantity}\n\nMessage (Optional)\n${formData.message || ''}`
        const encodedMessage = encodeURIComponent(whatsappMessage)
        const waUrl = `https://wa.me/7010584543?text=${encodedMessage}`
        
        // Store WhatsApp URL and show success modal
        setWhatsappUrl(waUrl)
        setShowSuccessModal(true)
        
        // Reset form
        setFormData({ phone: '', quantity: 1, message: '' })
      } else {
        setNotification({ isOpen: true, type: 'error', message: data.error || 'Failed to submit interest. Please try again.' })
      }
    } catch (error) {
      console.error('Error submitting interest:', error)
      setNotification({ isOpen: true, type: 'error', message: 'Failed to submit interest. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleShowInterest = () => {
    if (!isLoaded) return
    
    if (user) {
      // User is signed in, form is already visible on page
    } else {
      setShowSignInModal(true)
    }
  }

  // Handle opening form after sign-in
  useEffect(() => {
    if (isLoaded && user && showSignInModal) {
      setShowSignInModal(false)
    }
  }, [isLoaded, user, showSignInModal])

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

  if (!purchase) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-base">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/community-purchase" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Community Purchase
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <span className="text-gray-900 font-medium">Not Found</span>
              </li>
            </ol>
          </nav>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Purchase Not Found</h1>
            <Link
              href="/community-purchase"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Community Purchase
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

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-base">
            <li>
              <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/community-purchase" className="text-gray-600 hover:text-primary-600 transition-colors">
                Community Purchase
              </Link>
            </li>
            {purchase.category && (
              <>
                <li className="text-gray-400">/</li>
                <li>
                  <span className="text-gray-900 font-medium">{purchase.category}</span>
                </li>
              </>
            )}
            <li className="text-gray-400">/</li>
            <li>
              <span className="text-gray-900 font-medium">{purchase.title}</span>
            </li>
          </ol>
        </nav>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary-50 via-white to-secondary-50 rounded-2xl p-6 md:p-8 mb-8 border-2 border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{purchase.title}</h1>
              {purchase.category && (
                <p className="text-lg text-gray-600 font-medium">{purchase.category}</p>
              )}
            </div>
            {purchase.valid_until && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={20} />
                <span className="text-base font-medium">Valid Until: {formatDate(purchase.valid_until)}</span>
              </div>
            )}
          </div>
          
          {/* Contact Info and Price Display */}
          {((purchase.dealer_email || purchase.dealer_phone) || purchase.minimum_order_quantity || (purchase.market_price || purchase.community_price)) && (
            <div className="pt-6 border-t border-gray-200 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side - Dealer Contact Information and Minimum Order */}
                {((purchase.dealer_email || purchase.dealer_phone) || purchase.minimum_order_quantity) && (
                  <div>
                    {(purchase.dealer_email || purchase.dealer_phone) && (
                      <>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Dealer Contact</p>
                        <div className="space-y-2 mb-4">
                          {purchase.dealer_email && (
                            <div className="flex items-center gap-3">
                              <Mail size={18} className="text-primary-600 flex-shrink-0" />
                              <a href={`mailto:${purchase.dealer_email}`} className="text-gray-700 hover:text-primary-600 transition-colors text-base">
                                {purchase.dealer_email}
                              </a>
                            </div>
                          )}
                          {purchase.dealer_phone && (
                            <div className="flex items-center gap-3">
                              <Phone size={18} className="text-primary-600 flex-shrink-0" />
                              <a href={`tel:${purchase.dealer_phone}`} className="text-gray-700 hover:text-primary-600 transition-colors text-base">
                                {purchase.dealer_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {purchase.minimum_order_quantity && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Minimum Order Quantity</p>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900">
                          {purchase.minimum_order_quantity} units
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Right Side - Prices */}
                {(purchase.market_price || purchase.community_price) && (
                  <div className="md:text-right">
                    <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4">
                      {purchase.market_price && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Market Price</p>
                          <p className="text-3xl md:text-4xl font-bold text-gray-700 line-through">
                            ₹{purchase.market_price}
                          </p>
                        </div>
                      )}
                      {purchase.community_price && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Community Price</p>
                          <p className="text-3xl md:text-4xl font-bold text-primary-600">
                            ₹{purchase.community_price}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - About and Offer/Stock Clearances */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {purchase.about && (
              <div>
                <div className="brand-content">
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => (
                        <h2 {...props} className="text-3xl font-bold text-gray-900 mb-4" />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 {...props} className="text-xl font-bold text-gray-800 mb-3" />
                      ),
                      p: ({node, ...props}) => (
                        <p {...props} className="text-gray-700 text-base mb-4 leading-relaxed" />
                      ),
                      ul: ({node, ...props}) => (
                        <ul {...props} className="list-disc list-inside mb-4 space-y-2" />
                      ),
                      li: ({node, ...props}) => (
                        <li {...props} className="text-gray-700 text-base" />
                      ),
                      strong: ({node, ...props}) => (
                        <strong {...props} className="text-gray-900 font-semibold" />
                      ),
                    }}
                  >
                    {purchase.about}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Offer Deals Section */}
            {purchase.offer_deals && (
              <div className="pt-8 border-t-2 border-gray-200">
                <div className="brand-content">
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => (
                        <h2 {...props} className="text-3xl font-bold text-gray-900 mb-4" />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 {...props} className="text-xl font-bold text-gray-800 mb-3" />
                      ),
                      p: ({node, ...props}) => (
                        <p {...props} className="text-gray-700 text-base mb-4 leading-relaxed" />
                      ),
                      ul: ({node, ...props}) => (
                        <ul {...props} className="list-disc list-inside mb-4 space-y-2" />
                      ),
                      li: ({node, ...props}) => (
                        <li {...props} className="text-gray-700 text-base" />
                      ),
                      strong: ({node, ...props}) => (
                        <strong {...props} className="text-gray-900 font-semibold" />
                      ),
                    }}
                  >
                    {purchase.offer_deals}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Stock Clearances Section */}
            {purchase.stock_clearances && (
              <div className="pt-8 border-t-2 border-gray-200">
                <div className="brand-content">
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => (
                        <h2 {...props} className="text-3xl font-bold text-gray-900 mb-4" />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 {...props} className="text-xl font-bold text-gray-800 mb-3" />
                      ),
                      p: ({node, ...props}) => (
                        <p {...props} className="text-gray-700 text-base mb-4 leading-relaxed" />
                      ),
                      ul: ({node, ...props}) => (
                        <ul {...props} className="list-disc list-inside mb-4 space-y-2" />
                      ),
                      li: ({node, ...props}) => (
                        <li {...props} className="text-gray-700 text-base" />
                      ),
                      strong: ({node, ...props}) => (
                        <strong {...props} className="text-gray-900 font-semibold" />
                      ),
                    }}
                  >
                    {purchase.stock_clearances}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quantity Selection and Submit Button */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Express Interest</h3>
              
              {!user && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Please sign in to express your interest in this community purchase.
                  </p>
                  <SignInButton mode="modal">
                    <button className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 mb-2">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              )}

              {user && (
                <form onSubmit={handleSubmitInterest} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-700">
                      <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress || 'N/A'}
                    </p>
                  </div>

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
                      Quantity Needed <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => handleQuantityInput(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                            setFormData((prev) => ({ ...prev, quantity: 1 }))
                          }
                        }}
                        className="flex-1 px-4 py-3 text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Interest'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sign In Modal */}
        {showSignInModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to express interest in this community purchase.
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
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal with WhatsApp Button */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={48} className="text-green-600" />
                </div>
              </div>
              
              {/* Greeting Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Thank You!
              </h2>
              <p className="text-gray-600 mb-6">
                Open WhatsApp to continue with your order details.
              </p>
              
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#20BA5A] transition-all duration-200 shadow-lg hover:shadow-xl mb-4"
              >
                <MessageCircle size={24} />
                <span>Open WhatsApp</span>
              </a>
              
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setWhatsappUrl('')
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

