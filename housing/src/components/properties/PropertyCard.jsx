import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { propertiesAPI } from '../../api'
import { BedDouble, Bath, MapPin, ShieldCheck, Star, Heart, Square, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PropertyCard({ property, onUnsave }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(property._saved || false)

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast('Log in to save listings', { icon: '🔒' })
      navigate('/login')
      return
    }

    const wasSaved = saved
    setSaved(!wasSaved)

    try {
      const { data } = await propertiesAPI.toggleSave(property.id)
      setSaved(data.saved)
      if (!data.saved && onUnsave) {
        onUnsave(property.id)
      }
    } catch {
      setSaved(wasSaved)
      toast.error('Could not save listing.')
    }
  }

  return (
    <Link to={`/properties/${property.id}`} className="card overflow-hidden group block">
      {/* Image Container */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        <img
          src={property.primary_image || '/src/assets/nestverify_hero_cinematic.png'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star size={12} className="text-amber-500" fill="currentColor" />
          <span className="text-[11px] font-black text-gray-800">4.5 Rating</span>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md ${
            saved ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-500 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>

        {/* Verified Badge Overlay */}
        {property.is_verified && (
          <div className="absolute bottom-4 left-4">
             <div className="bg-[var(--nest-teal)] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg scale-90 origin-left">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
             </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-[var(--nest-teal)] transition-colors line-clamp-1">
            {property.title || 'Verified Property'}
          </h3>
          <p className="text-[var(--nest-teal)] font-black text-xl">
            ₦{Number(property.price || 750000).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-4 text-gray-400 text-xs font-bold mb-6">
          <span className="flex items-center gap-1.5"><BedDouble size={14} /> {property.bedrooms || 3} bed</span>
          <span className="flex items-center gap-1.5"><Bath size={14} /> {property.bathrooms || 2} bath</span>
          <span className="flex items-center gap-1.5"><Square size={14} /> {property.sq_ft || '1,200'} sq ft</span>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-gray-50">
           <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={14} className="text-[var(--nest-teal)]" />
              <span className="text-xs font-bold uppercase tracking-tighter">Price · Details</span>
           </div>
           <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ChevronRight size={14} className="text-gray-400" />
           </div>
        </div>
      </div>
    </Link>
  )
}
