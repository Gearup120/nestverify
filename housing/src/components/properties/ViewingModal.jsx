import { useState } from 'react'
import { X, Calendar, Clock, Send } from 'lucide-react'
import { viewingsAPI } from '../../api'
import toast from 'react-hot-toast'

export default function ViewingModal({ property, onClose, onBooked }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Minimum date is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date || !time) {
      toast.error('Please select a date and time.')
      return
    }

    setSubmitting(true)
    try {
      await viewingsAPI.book({
        listing: property.id,
        scheduled_date: date,
        scheduled_time: time,
        message,
      })
      toast.success('Viewing request sent! The landlord will respond shortly.')
      onBooked?.()
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.listing?.[0] || 'Failed to book viewing.'
      toast.error(detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900">Schedule a viewing</h3>
            <p className="text-xs text-gray-400 mt-0.5">{property.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="label text-xs flex items-center gap-1.5">
              <Calendar size={13} className="text-teal-600" />
              Preferred date
            </label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-sm"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="label text-xs flex items-center gap-1.5">
              <Clock size={13} className="text-teal-600" />
              Preferred time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input text-sm"
            >
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                <option key={t} value={t}>
                  {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="label text-xs">Message to landlord (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E.g. I'd like to see the kitchen and bedroom..."
              rows={3}
              className="input text-sm resize-none"
            />
          </div>

          {/* Info box */}
          <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-3 text-xs text-teal-700">
            <p className="font-medium mb-1">💰 Payment note</p>
            <p>Rent and deposit payments should be discussed directly in the chat with the landlord. NestVerify does not process payments.</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !date}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Sending request...'
            ) : (
              <>
                <Send size={14} /> Request viewing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
