import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { propertiesAPI } from '../api'
import toast from 'react-hot-toast'
import { Upload, X } from 'lucide-react'

const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'duplex', 'shared', 'commercial']
const AMENITIES_LIST = ['WiFi', 'Parking', 'Generator', 'Security', 'Water supply', 'Air conditioning', 'Furnished', 'CCTV', 'Swimming pool', 'Gym']

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [selectedAmenities, setSelectedAmenities] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm()

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 10) {
      toast.error('Maximum 10 images allowed.')
      return
    }
    const previews = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setImages(prev => [...prev, ...previews])
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const formData = new FormData()

      // Append scalar fields
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== '') formData.append(key, val)
      })

      // Amenities: send as JSON string — Django will parse via serializer
      if (selectedAmenities.length > 0) {
        formData.append('amenities', JSON.stringify(selectedAmenities))
      }

      // Images: each file appended separately under the same key
      images.forEach(({ file }) => formData.append('uploaded_images', file))

      // Debug: log what we're sending
      console.log('Submitting FormData:')
      for (let [key, val] of formData.entries()) {
        console.log(` ${key}:`, val)
      }

      const { data: created } = await propertiesAPI.create(formData)
      toast.success('Listing submitted for review!')
      navigate(`/properties/${created.id}`)
    } catch (err) {
      // Log full Django error response for debugging
      console.error('400 error body:', err.response?.data)
      const errData = err.response?.data
      if (errData && typeof errData === 'object') {
        Object.entries(errData).forEach(([field, msgs]) => {
          toast.error(`${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
        })
      } else {
        toast.error('Failed to submit listing.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Add a listing</h1>
        <p className="text-gray-500 text-sm mt-1">Your listing will be AI-screened then reviewed by our team.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-gray-800">Basic information</h2>

          <div>
            <label className="label">Listing title</label>
            <input className="input" placeholder="e.g. Modern 3-Bedroom Apartment in Lekki"
              {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] resize-none" placeholder="Describe the property, neighbourhood, rules..."
              {...register('description', { required: 'Description is required', minLength: { value: 50, message: 'At least 50 characters' } })} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Property type</label>
              <select className="input" {...register('property_type', { required: 'Required' })}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly rent (₦)</label>
              <input type="number" className="input" placeholder="450000"
                {...register('price', { required: 'Price is required', min: { value: 1, message: 'Must be positive' } })} />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bedrooms</label>
              <input type="number" min="1" className="input" defaultValue={1}
                {...register('bedrooms', { required: true, min: 1 })} />
            </div>
            <div>
              <label className="label">Bathrooms</label>
              <input type="number" min="1" className="input" defaultValue={1}
                {...register('bathrooms', { required: true, min: 1 })} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-gray-800">Location</h2>
          <div>
            <label className="label">Street address</label>
            <input className="input" placeholder="14 Admiralty Way"
              {...register('address', { required: 'Address is required' })} />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Lagos"
                {...register('city', { required: 'City is required' })} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="Lagos State"
                {...register('state', { required: 'State is required' })} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-gray-800">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedAmenities.includes(a)
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                }`}
              >{a}</button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-gray-800">Photos</h2>
          <p className="text-xs text-gray-400">Upload up to 10 photos. First photo will be the cover image.</p>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img.preview} alt="" className="w-full h-24 object-cover rounded-lg" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-teal-600 text-white text-xs px-1.5 py-0.5 rounded">Cover</span>}
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-xl p-6 cursor-pointer transition-colors group">
            <Upload size={20} className="text-gray-300 group-hover:text-teal-400 mb-2 transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-teal-500 transition-colors">Click to upload photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
          </label>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Submitting...' : 'Submit listing for review'}
        </button>
      </form>
    </div>
  )
}