'use client'

import React, { useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface NotificationModalProps {
  isOpen: boolean
  type: 'success' | 'error' | 'warning'
  message: string
  onClose: () => void
  duration?: number
}

export default function NotificationModal({
  isOpen,
  type,
  message,
  onClose,
  duration = 2000,
}: NotificationModalProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      
      // Set new timer
      timerRef.current = setTimeout(() => {
        onClose()
        timerRef.current = null
      }, duration)
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [isOpen, duration, onClose])

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !message) return null

  const iconMap = {
    success: <CheckCircle size={48} className="text-green-500" />,
    error: <XCircle size={48} className="text-red-500" />,
    warning: <AlertCircle size={48} className="text-yellow-500" />,
  }

  const bgColorMap = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
  }

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className={`${bgColorMap[type]} rounded-2xl p-8 shadow-2xl max-w-md w-full border-2 ${
          type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-yellow-200'
        } animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 animate-in zoom-in duration-300">
            {iconMap[type]}
          </div>
          <p className="text-lg font-semibold text-gray-900">{message}</p>
        </div>
      </div>
    </div>
  )
}

