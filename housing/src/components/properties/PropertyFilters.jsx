import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Kaduna']
const TYPES  = ['apartment', 'house', 'studio', 'duplex', 'shared', 'commercial']

export default function PropertyFilters({ onFilter }) {
  const [filters, setFilters] = useState({ city: '', property_type: '', bedrooms: '', search: '', min_price: '', max_price: '' })

  const update = (key, value) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    // Strip empty values
    const clean = Object.fromEntries(Object.entries(updated).filter(([, v]) => v !== ''))
    onFilter(clean)
  }

  const clear = () => {
    setFilters({ city: '', property_type: '', bedrooms: '', search: '', min_price: '', max_price: '' })
    onFilter({})
  }

  const hasFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <SlidersHorizontal size={14} /> Filters
        </h3>
        {hasFilters && (
          <button onClick={clear} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="label text-xs">Keyword</label>
        <input
          className="input text-sm"
          placeholder="Search listings..."
          value={filters.search}
          onChange={e => update('search', e.target.value)}
        />
      </div>

      {/* City */}
      <div>
        <label className="label text-xs">City</label>
        <select className="input text-sm" value={filters.city} onChange={e => update('city', e.target.value)}>
          <option value="">All cities</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Property type */}
      <div>
        <label className="label text-xs">Property type</label>
        <select className="input text-sm" value={filters.property_type} onChange={e => update('property_type', e.target.value)}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="label text-xs">Price Range (₦)</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="input text-sm w-1/2"
            placeholder="Min"
            value={filters.min_price}
            onChange={e => update('min_price', e.target.value)}
          />
          <input
            type="number"
            className="input text-sm w-1/2"
            placeholder="Max"
            value={filters.max_price}
            onChange={e => update('max_price', e.target.value)}
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="label text-xs">Bedrooms (min)</label>
        <select className="input text-sm" value={filters.bedrooms} onChange={e => update('bedrooms', e.target.value)}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
        </select>
      </div>
    </div>
  )
}
