'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import ReactMarkdown from 'react-markdown'
import { Plus, Minus, ExternalLink, UtensilsCrossed, Heart, Plane, Building2, Home as HomeIcon, Music, Sparkles, Laptop, Car, Building, GraduationCap, Calendar } from 'lucide-react'
import NotificationModal from '@/components/NotificationModal'

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

interface BulkOrder {
  id: string
  title: string
  description: string
  category: string
  deadline: string
  status: 'featured' | 'inprogress'
  created_at: string
}

type TabType = 'featured' | 'inprogress'

export default function BulkOrdersPage() {
  const { user, isLoaded } = useUser()
  const [orders, setOrders] = useState<BulkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('featured')
  const [selectedOrder, setSelectedOrder] = useState<BulkOrder | null>(null)
  const [showInterestForm, setShowInterestForm] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    quantity: 1,
    message: '',
  })
  const [submittedData, setSubmittedData] = useState<{
    phone: string
    quantity: number
    message: string
  } | null>(null)
  const [notification, setNotification] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; message: string }>({
    isOpen: false,
    type: 'success',
    message: '',
  })

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/bulk-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching bulk orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => order.status === activeTab)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleShowInterest = (order: BulkOrder) => {
    if (!isLoaded) return
    
    if (user) {
      setSelectedOrder(order)
      setShowInterestForm(true)
      setFormData({ phone: '', quantity: 1, message: '' })
    } else {
      setSelectedOrder(order)
      setShowSignInModal(true)
    }
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
    
    if (!user || !selectedOrder) return

    if (!formData.phone || formData.quantity <= 0) {
      setNotification({ isOpen: true, type: 'warning', message: 'Please fill in phone number and quantity.' })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/bulk-orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress || '',
          phone: formData.phone,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store submitted data before resetting form
        const savedData = {
          phone: formData.phone,
          quantity: formData.quantity,
          message: formData.message,
        }
        setSubmittedData(savedData)
        
        // Create WhatsApp template message with exact format
        const whatsappMessage = `Order: ${selectedOrder.title}\n\nEmail: ${user.primaryEmailAddress?.emailAddress || 'N/A'}\n\nPhone Number *\n${savedData.phone}\n\nQuantity Needed *\n${savedData.quantity}\n\nMessage (Optional)\n${savedData.message || ''}`
        const encodedMessage = encodeURIComponent(whatsappMessage)
        const whatsappUrl = `https://wa.me/7010584543?text=${encodedMessage}`
        
        // Show success notification modal
        setNotification({ isOpen: true, type: 'success', message: 'Interest submitted. Open WhatsApp to continue.' })
        
        // Open WhatsApp after 1 second
        setTimeout(() => {
          window.open(whatsappUrl, '_blank')
        }, 1000)
        
        // Reset form
        setFormData({ phone: '', quantity: 1, message: '' })
        
        // Close form after showing notification
        setTimeout(() => {
          setShowInterestForm(false)
          setSelectedOrder(null)
          setSubmittedData(null)
        }, 2500)
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

  // Handle opening form after sign-in
  useEffect(() => {
    if (isLoaded && user && selectedOrder && showSignInModal) {
      setShowSignInModal(false)
      setShowInterestForm(true)
    }
  }, [isLoaded, user, selectedOrder, showSignInModal])

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-10 md:py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Bulk Orders
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Express your interest in bulk orders. Our team will reach out to you shortly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('featured')}
              className={`pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'featured'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveTab('inprogress')}
              className={`pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'inprogress'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              In Progress
            </button>
          </div>
        </div>

        {/* Micro Copy */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            {activeTab === 'featured' 
              ? 'Featured bulk orders are available for interest submission. Orders are not currently being processed, but you can express your interest for future consideration.'
              : 'In Progress bulk orders are currently ongoing. You can show your interest and our team will reach out to you shortly.'}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-gray-600">Loading bulk orders...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Orders Available</h3>
              <p className="text-gray-600">
                {activeTab === 'featured' && 'No featured orders at the moment.'}
                {activeTab === 'inprogress' && 'No orders in progress at the moment.'}
              </p>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {!loading && filteredOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border-2 border-gray-300 p-3 sm:p-4 hover:shadow-lg hover:border-primary-400 transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 line-clamp-2">{order.title}</h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      {getCategoryIcon(order.category) && (
                        <div className="text-primary-600">
                          {getCategoryIcon(order.category)}
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">{order.category}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-2 flex-1">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown className="text-gray-700 text-xs sm:text-sm line-clamp-3">
                      {order.description}
                    </ReactMarkdown>
                  </div>
                </div>

                {order.deadline && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>Deadline: {formatDate(order.deadline)}</span>
                  </div>
                )}

                <button
                  onClick={() => handleShowInterest(order)}
                  className="w-full mt-auto bg-primary-600 text-white py-2 sm:py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Show Interest
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sign In Modal */}
        {showSignInModal && !user && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
            setShowSignInModal(false)
            setSelectedOrder(null)
          }}>
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in or create an account to express interest in bulk orders.
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
                    setSelectedOrder(null)
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interest Form Modal */}
        {showInterestForm && selectedOrder && user && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
            if (!submitting) {
              setShowInterestForm(false)
              setSelectedOrder(null)
            }
          }}>
            <div className="bg-white rounded-xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Express Interest</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Fill in the details below to express your interest in this bulk order.
                  </p>
                  
                  <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-gray-700">
                      <strong>Order:</strong> {selectedOrder.title}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress || 'N/A'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmitInterest} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Quantity Needed <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(-1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Minus size={18} />
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
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(1)}
                          className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                        Message (Optional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                        placeholder="Any additional information..."
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Interest'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInterestForm(false)
                          setSelectedOrder(null)
                        }}
                        disabled={submitting}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
              </>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

