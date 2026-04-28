import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { propertiesAPI, viewingsAPI } from '../api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import PropertyCard from '../components/properties/PropertyCard'
import VerificationBanner from '../components/auth/VerificationBanner'
import { PlusCircle, Home, ShieldCheck, AlertTriangle, Calendar, CheckCircle, XCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [myProperties, setMyProperties] = useState([])
  const [viewings, setViewings] = useState([])
  const [loading, setLoading] = useState(true)

  const isLandlord = user?.role === 'landlord' || user?.role === 'agent' || user?.is_staff

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLandlord) {
          const [propRes, viewRes] = await Promise.all([
             propertiesAPI.mine(),
             viewingsAPI.landlord()
          ])
          setMyProperties(propRes.data.results || propRes.data)
          setViewings(viewRes.data.results || viewRes.data)
        } else {
          const viewRes = await viewingsAPI.mine()
          setViewings(viewRes.data.results || viewRes.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isLandlord])

  const stats = {
    total: myProperties.length,
    approved: myProperties.filter(p => p.status === 'approved').length,
    pending: myProperties.filter(p => p.status === 'pending').length,
    flagged: myProperties.filter(p => p.fraud_score > 0.4).length,
  }

  const handleViewingAction = async (id, action, note = '') => {
    try {
      await viewingsAPI.respond(id, action, note)
      setViewings(prev => prev.map(v => v.id === id ? { ...v, status: action === 'accept' ? 'accepted' : 'declined' } : v))
    } catch (err) {
      console.error(err)
    }
  }

  const handleCancelViewing = async (id) => {
    try {
      await viewingsAPI.cancel(id)
      setViewings(prev => prev.map(v => v.id === id ? { ...v, status: 'cancelled' } : v))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} account
            {user?.is_verified
              ? <span className="ml-2 badge-verified"><ShieldCheck size={11} /> Verified</span>
              : <span className="ml-2 badge-pending">Pending verification</span>
            }
          </p>
        </div>
        {isLandlord && (
          <Link to="/properties/new" className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} /> Add listing
          </Link>
        )}
      </div>

      {/* Verification banner */}
      {!user?.is_verified && <VerificationBanner />}

      {/* Stats (landlord/agent only) */}
      {isLandlord && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total listings', value: stats.total, icon: Home, color: 'text-gray-700' },
            { label: 'Live', value: stats.approved, icon: ShieldCheck, color: 'text-teal-600' },
            { label: 'Pending review', value: stats.pending, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'AI flagged', value: stats.flagged, icon: AlertTriangle, color: 'text-red-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className={`flex items-center gap-2 ${color} mb-1`}>
                <Icon size={15} />
                <span className="text-xs font-medium text-gray-500">{label}</span>
              </div>
              <p className={`font-serif text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tenant quick actions */}
      {!isLandlord && (
        <div className="card p-6">
          <h2 className="font-medium text-gray-800 mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to="/" className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg hover:border-teal-200 hover:bg-teal-50 transition-colors group">
              <div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center transition-colors">
                <Home size={16} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Browse listings</p>
                <p className="text-xs text-gray-400">Find your next home</p>
              </div>
            </Link>
            <Link to="/profile" className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg hover:border-teal-200 hover:bg-teal-50 transition-colors group">
              <div className="w-9 h-9 bg-teal-50 group-hover:bg-teal-100 rounded-lg flex items-center justify-center transition-colors">
                <ShieldCheck size={16} className="text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Complete verification</p>
                <p className="text-xs text-gray-400">Upload your ID to unlock features</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Viewings Section */}
      <div>
        <h2 className="font-medium text-gray-800 mb-4">{isLandlord ? 'Viewing Requests' : 'My Viewings'}</h2>
        {viewings.length === 0 ? (
          <div className="card p-8 text-center text-gray-500 text-sm">
            <Calendar size={24} className="mx-auto mb-2 text-gray-300" />
            No viewings scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {viewings.map(v => (
              <div key={v.id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Link to={`/properties/${v.property_id}`} className="font-medium text-gray-900 hover:text-teal-600 transition-colors">
                    {v.property_title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Calendar size={13} /> {new Date(v.scheduled_date).toLocaleDateString()} at {v.scheduled_time.substring(0, 5)}
                  </p>
                  {isLandlord && (
                    <p className="text-xs text-gray-400 mt-1">Requested by: <span className="font-medium">{v.tenant_name}</span></p>
                  )}
                  {v.message && <p className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded">"{v.message}"</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    v.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    v.status === 'accepted' ? 'bg-teal-100 text-teal-700' :
                    v.status === 'declined' || v.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </span>
                  
                  {/* Actions for Landlord */}
                  {isLandlord && v.status === 'pending' && (
                    <div className="flex gap-2">
                       <button onClick={() => handleViewingAction(v.id, 'accept')} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg" title="Accept"><CheckCircle size={18} /></button>
                       <button onClick={() => handleViewingAction(v.id, 'decline')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Decline"><XCircle size={18} /></button>
                    </div>
                  )}

                  {/* Actions for Tenant */}
                  {!isLandlord && v.status === 'pending' && (
                     <button onClick={() => handleCancelViewing(v.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My listings */}
      {isLandlord && (
        <div>
          <h2 className="font-medium text-gray-800 mb-4">My listings</h2>
          {loading ? (
            <LoadingSpinner className="py-12" />
          ) : myProperties.length === 0 ? (
            <div className="card p-12 text-center">
              <Home size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No listings yet.</p>
              <Link to="/properties/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                <PlusCircle size={15} /> Add your first listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myProperties.map(p => <PropertyCard key={p.id} property={p} showFraudScore />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
