import Navbar from '../components/layout/Navbar'
import { Mail, Phone, Send } from 'lucide-react'
import { authAPI } from '../api'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.target)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    }

    try {
      await authAPI.contact(data)
      toast.success('Your message has been sent to tboad04@gmail.com. We will get back to you shortly!')
      e.target.reset()
    } catch (err) {
      toast.error('Failed to send message. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-24 px-6 grid grid-cols-1 lg:grid-cols-2 gap-20">
        {/* Contact Info */}
        <div className="space-y-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h1>
            <p className="text-gray-500 max-w-md leading-relaxed">
              Have questions about property verification or need support with your rental? Our team is here to help Nigerians find safe homes.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[var(--nest-teal)]">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Us</p>
                <p className="font-bold text-gray-900">tboad04@gmail.com</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[var(--nest-amber)]">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Call Us</p>
                <p className="font-bold text-gray-900">09058120048</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-50 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input name="name" required type="text" className="input" placeholder="Afolabi K." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input name="email" required type="email" className="input" placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
              <select name="subject" className="input">
                <option>General Inquiry</option>
                <option>Property Verification Request</option>
                <option>Technical Support</option>
                <option>Landlord Partnership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
              <textarea name="message" required rows={5} className="input" placeholder="How can we help you today?"></textarea>
            </div>
            <button disabled={loading} type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
              <Send size={18} />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-xs mt-12">
         <p>© 2026 NestVerify Nigeria. Securely verifying homes for you.</p>
      </footer>
    </div>
  )
}
