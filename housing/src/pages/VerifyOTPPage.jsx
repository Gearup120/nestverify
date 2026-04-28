import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'

export default function VerifyOTPPage() {
  const { verifyOTP } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get email from query params or state
  const queryParams = new URLSearchParams(location.search)
  const email = queryParams.get('email') || location.state?.email

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timer, setTimer] = useState(60)

  useEffect(() => {
    if (!email) {
      toast.error('No email found. Please register or login.')
      navigate('/login')
    }
  }, [email, navigate])

  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleChange = (index, value) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    try {
      await verifyOTP(email, fullCode)
      toast.success('Email verified! Welcome to NestVerify.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (timer > 0) return
    setResending(true)
    try {
      await authAPI.resendOTP({ email })
      toast.success('New code sent to your email.')
      setTimer(60)
    } catch (err) {
      toast.error('Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 overflow-hidden">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-teal-600 transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-2xl font-bold text-teal-600">
            Nest<span className="text-amber-400">Verify</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-100 rounded-xl focus:border-teal-500 focus:ring-0 transition-all bg-gray-50 uppercase"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg font-semibold shadow-lg shadow-teal-100"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin mr-2" size={20} />
                  Verifying...
                </span>
              ) : (
                'Verify Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={timer > 0 || resending}
                className={`font-medium transition-colors ${
                  timer > 0 || resending ? 'text-gray-300 cursor-not-allowed' : 'text-teal-600 hover:text-teal-700 hover:underline'
                }`}
              >
                {resending ? 'Resending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-400">
          <ShieldCheck size={13} />
          <span>Your account security is our priority</span>
        </div>
      </div>
    </div>
  )
}
