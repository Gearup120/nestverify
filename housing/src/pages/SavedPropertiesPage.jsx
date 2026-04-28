import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { propertiesAPI } from '../api'
import PropertyCard from '../components/properties/PropertyCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Heart, Search } from 'lucide-react'

export default function SavedPropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSaved()
  }, [])

  const fetchSaved = async () => {
    try {
      const { data } = await propertiesAPI.saved()
      setProperties(data.results || data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = (id) => {
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <h1 className="font-serif text-2xl font-bold text-gray-900">Saved listings</h1>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : properties.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Heart size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved listings</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Keep track of homes you love by clicking the heart icon on any listing.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Search size={16} /> Browse properties
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{properties.length} saved propert{properties.length === 1 ? 'y' : 'ies'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map(p => (
              <PropertyCard 
                key={p.id} 
                property={{...p, _saved: true}} 
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
