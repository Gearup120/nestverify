import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { RefreshCw, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'tenant',
    password: '',
    password2: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await register(formData)
      if (data.email_sent === false) {
        toast.error(`Account created, but email failed: ${data.email_error || 'Unknown error'}`)
      } else {
        toast.success('Account created! Check your email for the verification code.')
      }
      // ✅ Pass email via state so VerifyOTPPage can read it
      navigate('/verify-otp', { state: { email: formData.email } })
    } catch (err) {
      const errors = err.response?.data
      if (errors && typeof errors === 'object') {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-2xl font-bold text-teal-600">
            Nest<span className="text-amber-400">Verify</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Create your account</h1>
          <p className="text-gray-500 text-sm mt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:underline font-medium">Log in</Link>
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input w-full"
                placeholder="+234 801 234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
                <option value="agent">Agent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input w-full pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                name="password2"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password2}
                onChange={handleChange}
                className="input w-full"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg font-semibold shadow-lg shadow-teal-100 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin mr-2" size={20} />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>

      </div>
    </div>
  )
}