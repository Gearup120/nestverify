import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { ShieldCheck, Upload, User, Clock, XCircle } from 'lucide-react'

const STATUS_MAP = {
  pending:  { label: 'Pending review', icon: Clock,        cls: 'badge-pending' },
  verified: { label: 'Verified',        icon: ShieldCheck,  cls: 'badge-verified' },
  rejected: { label: 'Rejected',        icon: XCircle,      cls: 'badge-rejected' },
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  const status = STATUS_MAP[user?.verification_status] || STATUS_MAP.pending

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB.')
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files[0]
    if (!file) return toast.error('Please select a file first.')

    const formData = new FormData()
    formData.append('id_document', file)

    setUploading(true)
    try {
      await authAPI.uploadID(formData)
      await refreshProfile()
      toast.success('ID uploaded successfully. Pending admin review.')
      setPreview(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-serif text-2xl font-bold text-gray-900">My profile</h1>

      {/* Profile info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl font-serif">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{user?.full_name || `${user?.first_name} ${user?.last_name}`}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Phone</p>
            <p className="text-gray-700">{user?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Member since</p>
            <p className="text-gray-700">
              {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' }) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-600" />
            Identity verification
          </h3>
          <span className={status.cls}>
            <status.icon size={11} />
            {status.label}
          </span>
        </div>

        {user?.verification_status === 'verified' ? (
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 text-sm text-teal-700">
            Your identity has been verified. You have full access to all platform features.
          </div>
        ) : (
          <>
            {user?.verification_status === 'rejected' && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-600">
                Your ID was rejected. Please upload a clearer, valid government-issued ID.
              </div>
            )}

            <p className="text-sm text-gray-500">
              Upload a government-issued ID (passport, NIN slip, driver's licence) to verify your account.
            </p>

            {/* Upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
              ) : (
                <>
                  <Upload size={24} className="text-gray-300 group-hover:text-teal-400 mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-gray-500">Click to upload your ID document</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF — max 5MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {preview && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary w-full"
              >
                {uploading ? 'Uploading...' : 'Submit ID for verification'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
