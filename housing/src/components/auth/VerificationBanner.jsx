import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function VerificationBanner() {
  const { user } = useAuth()

  if (user?.verification_status === 'verified') return null

  const messages = {
    pending:  { text: 'Your ID is under review. We\'ll notify you once verified.', cta: null },
    rejected: { text: 'Your ID was rejected. Please re-upload a valid document.', cta: 'Re-upload ID' },
    default:  { text: 'Verify your identity to unlock full platform access.', cta: 'Verify now' },
  }

  const msg = messages[user?.verification_status] || messages.default

  return (
    <div className="flex items-start justify-between gap-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck size={15} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800">Identity not verified</p>
          <p className="text-xs text-amber-600 mt-0.5">{msg.text}</p>
        </div>
      </div>
      {msg.cta && (
        <Link
          to="/profile"
          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
        >
          {msg.cta} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}
