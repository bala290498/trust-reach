'use client'

import { useState } from 'react'
import CustomSelect from './CustomSelect'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  color?: 'primary' | 'secondary'
}

function Toggle({ checked, onChange, color = 'primary' }: ToggleProps) {
  const bgColor = checked 
    ? (color === 'primary' ? 'bg-primary-600' : 'bg-secondary-500')
    : 'bg-gray-300'
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        color === 'primary' ? 'focus:ring-primary-500' : 'focus:ring-secondary-500'
      } ${bgColor}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
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

interface FilterBarProps {
  selectedCategory: string
  selectedRating: number
  onCategoryChange: (category: string) => void
  onRatingChange: (rating: number) => void
  showRating?: boolean
  showNewArrivals?: boolean
  showVerified?: boolean
  newArrivalsChecked?: boolean
  verifiedChecked?: boolean
  onNewArrivalsChange?: (value: boolean) => void
  onVerifiedChange?: (value: boolean) => void
}

export default function FilterBar({
  selectedCategory,
  selectedRating,
  onCategoryChange,
  onRatingChange,
  showRating = true,
  showNewArrivals = false,
  showVerified = false,
  newArrivalsChecked = false,
  verifiedChecked = false,
  onNewArrivalsChange,
  onVerifiedChange,
}: FilterBarProps) {

  return (
    <div className="w-full max-w-full sm:max-w-4xl mx-auto px-4 sm:px-0">
      <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-6">
            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Category:</label>
              <CustomSelect
                value={selectedCategory}
                onChange={(value) => onCategoryChange(String(value))}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
                minWidth="9.375rem"
              />
            </div>

            {/* Rating Filter */}
            {showRating && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Rating:</label>
                <CustomSelect
                  value={selectedRating}
                  onChange={(value) => onRatingChange(Number(value))}
                  options={[
                    { value: 0, label: 'All Ratings' },
                    { value: 5, label: '5 Stars' },
                    { value: 4, label: '4+ Stars' },
                    { value: 3, label: '3+ Stars' },
                    { value: 2, label: '2+ Stars' },
                    { value: 1, label: '1+ Stars' },
                  ]}
                  minWidth="9.375rem"
                />
              </div>
            )}

        {/* New Arrivals Toggle */}
        {showNewArrivals && onNewArrivalsChange && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">New Arrivals:</label>
            <div className="flex items-center">
              <Toggle
                checked={newArrivalsChecked}
                onChange={onNewArrivalsChange}
                color="primary"
              />
            </div>
          </div>
        )}

        {/* Verified Toggle */}
        {showVerified && onVerifiedChange && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Verified by TrustReach:</label>
            <div className="flex items-center">
              <Toggle
                checked={verifiedChecked}
                onChange={onVerifiedChange}
                color="secondary"
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

