import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { propertiesAPI, fraudAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import FraudScorePanel from '../components/fraud/FraudScorePanel'
import ChatModal from '../components/chat/ChatModal'
import ViewingModal from './../components/properties/ViewingModal'
import ImageLightbox from './../components/ui/ImageLightbox'
import toast from 'react-hot-toast'
import { MapPin, BedDouble, Bath, ShieldCheck, AlertTriangle, ArrowLeft, MessageCircle, Calendar, Heart, Eye } from 'lucide-react'
import Navbar from '../components/layout/Navbar'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [showViewingModal, setShowViewingModal] = useState(false)
  
  const [saved, setSaved] = useState(false)
  const [savingAnim, setSavingAnim] = useState(false)

  useEffect(() => {
    propertiesAPI.detail(id)
      .then(({ data }) => {
        setProperty(data)
        setSaved(data.is_saved || false)
      })
      .catch(() => toast.error('Property not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const { data } = await fraudAPI.analyze(id)
      setProperty(prev => ({
        ...prev,
        fraud_score: data.fraud_score,
        fraud_flags: data.flags,
      }))
      toast.success('Fraud analysis complete.')
    } catch {
      toast.error('Analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!user) {
      toast('Log in to save listings', { icon: '🔒' })
      navigate('/login')
      return
    }

    setSavingAnim(true)
    const wasSaved = saved
    setSaved(!wasSaved) 

    try {
      const { data } = await propertiesAPI.toggleSave(property.id)
      setSaved(data.saved)
    } catch {
      setSaved(wasSaved)
      toast.error('Could not save listing.')
    } finally {
      setTimeout(() => setSavingAnim(false), 300)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner className="py-32" size="lg" /></div>
  )

  if (!property) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="text-center py-32 text-gray-400">Property not found.</div>
    </div>
  )

  const images = property.images || []

  // Fix: compare as strings to handle UUID vs string mismatches
  const isOwner = user && String(property.owner?.id) === String(user.id)
  const isAdmin = user?.is_staff
  // Tenants can chat — anyone who is logged in and NOT the owner
  const canChat = user && !isOwner && !isAdmin

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">

        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-600 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image gallery */}
            <div className="card overflow-hidden relative">
              {/* Save Button */}
              <button
                onClick={handleSave}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all duration-200 backdrop-blur-sm ${
                  saved
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/80 text-gray-500 hover:bg-white hover:text-red-500'
                } ${savingAnim ? 'scale-125' : 'scale-100'}`}
                title={saved ? 'Remove from saved' : 'Save listing'}
              >
                <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
              </button>

              {images.length > 0 ? (
                <>
                  <div className="w-full h-96 relative cursor-pointer group" onClick={() => setShowLightbox(true)}>
                    <img
                      src={images[activeImg]?.image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/opacity-0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                       <span className="bg-black/50 text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <Eye size={16} /> View Gallery ({images.length})
                       </span>
                    </div>
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-t border-gray-100">
                      {images.map((img, i) => (
                        <img
                          key={img.id}
                          src={img.image}
                          onClick={() => setActiveImg(i)}
                          className={`h-16 w-20 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${i === activeImg ? 'ring-2 ring-teal-500 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                          alt=""
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-72 bg-teal-50 flex items-center justify-center text-teal-200">
                  No images uploaded
                </div>
              )}
            </div>

            {/* Details */}
            <div className="card p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-gray-900">{property.title}</h1>
                  <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <MapPin size={13} /> {property.address}, {property.city}, {property.state}
                  </p>
                </div>
                {property.is_verified
                  ? <span className="badge-verified flex-shrink-0"><ShieldCheck size={11} /> Verified</span>
                  : <span className="badge-pending flex-shrink-0">Pending</span>
                }
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                 <span className="flex items-center gap-1.5">
                    <Eye size={14} /> {property.views_count} view{property.views_count !== 1 ? 's' : ''}
                 </span>
              </div>

              <div className="flex items-center gap-6 py-3 border-y border-gray-100 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><BedDouble size={14} /> {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1.5"><Bath size={14} /> {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                {property.area_sqm && <span>{property.area_sqm} m²</span>}
                <span className="capitalize">{property.property_type}</span>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>

              {property.amenities?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map(a => (
                      <span key={a} className="bg-gray-50 border border-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Price & actions */}
            <div className="card p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Monthly rent</p>
                <p className="font-serif text-3xl font-bold text-gray-900">
                  ₦{Number(property.price).toLocaleString()}
                </p>
              </div>

              {/* Only show contact button to logged-in non-owners */}
              {canChat && (
                <button
                  onClick={() => setShowChat(true)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <MessageCircle size={15} /> Contact landlord
                </button>
              )}

              {/* Show login prompt to guests */}
              {!user && (
                <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 text-center">
                  <MessageCircle size={15} /> Login to contact landlord
                </Link>
              )}

              {/* Schedule viewing — available to tenants */}
              {canChat && (
                <button 
                  onClick={() => setShowViewingModal(true)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Calendar size={15} /> Schedule viewing
                </button>
              )}

              {/* Owner sees manage link instead */}
              {isOwner && (
                <div className="text-center py-2 text-sm text-gray-400">
                  This is your listing
                </div>
              )}
            </div>

            {/* Landlord info */}
            {property.owner && (
              <div className="card p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Listed by</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-medium text-sm">
                    {property.owner.first_name?.[0]}{property.owner.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{property.owner.full_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{property.owner.role}</p>
                    {property.owner.is_verified && (
                      <span className="badge-verified text-xs mt-0.5 inline-flex">
                        <ShieldCheck size={9} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fraud score — ONLY owner or admin */}
            {(isOwner || isAdmin) && (
              <FraudScorePanel
                score={property.fraud_score}
                flags={property.fraud_flags}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Chat modal */}
      {showChat && property && (
        <ChatModal
          property={property}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Viewing modal */}
      {showViewingModal && property && (
        <ViewingModal
          property={property}
          onClose={() => setShowViewingModal(false)}
        />
      )}

      {/* Lightbox */}
      {showLightbox && images.length > 0 && (
         <ImageLightbox 
            images={images}
            startIndex={activeImg}
            onClose={() => setShowLightbox(false)}
         />
      )}
    </div>
  )
}