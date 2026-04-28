import { useState, useEffect } from 'react'
import { propertiesAPI, fraudAPI, authAPI } from '../api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import FraudScorePanel from '../components/fraud/FraudScorePanel'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Users } from 'lucide-react'

export default function AdminPage() {
  const [tab, setTab] = useState('listings')
  const [pending, setPending] = useState([])
  const [reports, setReports] = useState([])
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (tab === 'listings') {
          const { data } = await propertiesAPI.adminPending()
          setPending(data.results || data)
        } else if (tab === 'reports') {
          const { data } = await fraudAPI.adminReports()
          setReports(data.results || data)
        } else if (tab === 'users') {
          const { data } = await authAPI.adminUsers()
          setUsers((data.results || data).filter(u => u.verification_status === 'pending'))
        }
      } catch (err) {
        toast.error('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tab])

  const handleReview = async (id, action) => {
    try {
      await propertiesAPI.adminReview(id, action)
      toast.success(`Listing ${action === 'approve' ? 'approved' : 'rejected'}.`)
      setPending(prev => prev.filter(p => p.id !== id))
    } catch {
      toast.error('Action failed.')
    }
  }

  const handleUserVerification = async (userId, action) => {
    try {
      await authAPI.adminVerify(userId, action)
      toast.success(`User ${action === 'approve' ? 'verified' : 'rejected'}.`)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch {
      toast.error('Verification update failed.')
    }
  }

  const handleResolveReport = async (id, status) => {
    try {
      await fraudAPI.resolveReport(id, { status })
      toast.success(`Report marked as ${status}.`)
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch {
      toast.error('Action failed.')
    }
  }

  const fraudRisk = (score) => {
    if (score >= 0.7) return { label: 'Very high', cls: 'text-red-600 bg-red-50 border-red-200' }
    if (score >= 0.45) return { label: 'High', cls: 'text-orange-600 bg-orange-50 border-orange-200' }
    if (score >= 0.2) return { label: 'Medium', cls: 'text-amber-600 bg-amber-50 border-amber-200' }
    return { label: 'Low', cls: 'text-teal-600 bg-teal-50 border-teal-100' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={22} className="text-teal-600" />
        <h1 className="font-serif text-2xl font-bold text-gray-900">Admin panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto max-w-full">
        {[
          { key: 'listings', label: 'Pending listings', icon: CheckCircle },
          { key: 'users',    label: 'Identity verification', icon: Users },
          { key: 'reports',  label: 'Fraud reports',    icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
            {key === 'listings' && pending.length > 0 && (
              <span className="bg-amber-400 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {pending.length}
              </span>
            )}
            {key === 'users' && users.length > 0 && (
              <span className="bg-teal-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {users.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : tab === 'listings' ? (
        pending.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <CheckCircle size={36} className="mx-auto mb-3 text-gray-200" />
            All caught up — no pending listings.
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(prop => {
              const risk = fraudRisk(prop.fraud_score || 0)
              return (
                <div key={prop.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{prop.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${risk.cls}`}>
                          {risk.label} risk ({((prop.fraud_score || 0) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{prop.city}, {prop.state} — ₦{Number(prop.price).toLocaleString()}/mo</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        By {prop.owner_name} · {new Date(prop.created_at).toLocaleDateString()}
                      </p>

                      {/* Fraud flags */}
                      {prop.fraud_flags?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {prop.fraud_flags.map((flag, i) => (
                            <p key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" /> {flag}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReview(prop.id, 'reject')}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleReview(prop.id, 'approve')}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : tab === 'users' ? (
        users.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Users size={36} className="mx-auto mb-3 text-gray-200" />
            No identity verification requests.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="flex-1 min-w-0 flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{u.full_name}</h3>
                      <p className="text-sm text-gray-500">{u.email} · <span className="capitalize">{u.role}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">Joined {new Date(u.date_joined).toLocaleDateString()}</p>
                      
                      {u.id_document && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ID Document</p>
                          <a href={u.id_document} target="_blank" rel="noreferrer" className="block w-40 h-24 rounded-lg overflow-hidden border border-gray-100 hover:border-teal-300 transition-colors bg-gray-50">
                            <img src={u.id_document} alt="ID" className="w-full h-full object-cover" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleUserVerification(u.id, 'reject')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handleUserVerification(u.id, 'approve')}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50">
                      <CheckCircle size={14} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <AlertTriangle size={36} className="mx-auto mb-3 text-gray-200" />
            No fraud reports found.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{report.property_title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{report.reason}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>By: {report.reporter_name || 'Auto-generated'}</span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full border ${
                        report.status === 'open' ? 'bg-red-50 text-red-600 border-red-200' :
                        report.status === 'resolved' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>{report.status}</span>
                    </div>
                  </div>
                  {report.status === 'open' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleResolveReport(report.id, 'dismissed')}
                        className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Dismiss
                      </button>
                      <button onClick={() => handleResolveReport(report.id, 'resolved')}
                        className="px-3 py-1.5 text-xs text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
