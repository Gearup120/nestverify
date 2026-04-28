import { useState, useEffect, useRef } from 'react'
import { propertiesAPI } from '../api'
import PropertyCard from '../components/properties/PropertyCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Navbar from '../components/layout/Navbar'
import { Search, ShieldCheck, CreditCard, UserCheck, FileText, Star, ChevronRight, MapPin, Home, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PropertiesPage() {
  const propertiesRef = useRef(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    '/src/assets/slide1.png',
    '/src/assets/slide2.png',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1920'
  ]

  const fetchProperties = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await propertiesAPI.list(params)
      setProperties(data.results || data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    { icon: <ShieldCheck className="text-teal-600" />, title: 'Verified Listings', desc: 'Every property on our platform is physically inspected and verified for your absolute peace of mind.' },
    { icon: <CreditCard className="text-amber-500" />, title: 'Secure Payments', desc: 'Experience seamless and secure rental payments with integrated protection for both tenants and landlords.' },
    { icon: <UserCheck className="text-blue-500" />, title: 'Background Checks', desc: 'We conduct comprehensive identity and background verification to foster a community of trust.' },
    { icon: <FileText className="text-orange-500" />, title: 'Digital Leases', desc: 'Sign legally binding tenancy agreements electronically, ensuring transparency and ease of access.' },
  ]

  const reviews = [
    { name: 'Biyi Penner', text: 'NestVerify is a game-changer for the Nigerian real estate market. The verification process is thorough and gives me total confidence in my choices.', rating: 5 },
    { name: 'Janet F.', text: 'I found my dream apartment in Lagos within days. The verified badge saved me from several potential scams. Highly recommended!', rating: 5 },
    { name: 'Ruben A.', text: 'The professional interface and verified listings make house-hunting actually enjoyable. It feels safe and very premium.', rating: 5 }
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />

      {/* --- HERO SLIDER SECTION --- */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${slide}')`, backgroundColor: '#1A1A1A' }}
          />
        ))}

        {/* Subtle Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 max-w-5xl px-6 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-cinematic mb-6 leading-tight">
            Find Verified Properties.<br />
            Rent with Absolute Confidence.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light">
            Experience the future of property rentals in Nigeria. Verified listings, transparent processes, and a secure home for every user.
          </p>

          <div className="flex justify-center gap-4">
             <button 
               onClick={() => propertiesRef.current?.scrollIntoView({ behavior: 'smooth' })}
               className="btn-primary py-4 px-10 text-lg"
             >
               Explore Properties
             </button>
             <Link to="/about" className="bg-white/10 backdrop-blur-md border border-white/20 text-white py-4 px-10 rounded-xl font-bold hover:bg-white/20 transition-all text-lg">Learn More</Link>
          </div>

          {/* Slider Pagination Dots */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-8' : 'bg-white/40'}`}
              />
            ))}
          </div>

          {/* Floating Trust Badge */}
          <div className="absolute -bottom-16 left-6 hidden lg:block">
            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <ShieldCheck size={28} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Trusted by Nigerians</p>
                <p className="text-sm font-bold text-gray-800">& Property Managers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY NESTVERIFY --- */}
      <section className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">Why NestVerify?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card p-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SAMPLE PROPERTIES --- */}
      <section ref={propertiesRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Recently Verified Properties</h2>
            <Link to="/properties" className="text-[var(--nest-teal)] font-bold flex items-center gap-1 hover:underline">
              Explore All <ChevronRight size={18} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {properties.slice(0, 150).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
              {/* Fallback mock cards if no properties in DB */}
              {properties.length === 0 && [1, 2, 3].map(i => (
                <div key={i} className="card overflow-hidden">
                  <div className="h-64 bg-gray-100 animate-pulse" />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-6 w-32 bg-gray-100 rounded" />
                      <div className="h-6 w-16 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-100 rounded" />
                      <div className="h-4 w-2/3 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- REVIEWS --- */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">User Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div key={i} className="card p-8">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-600 italic mb-8 leading-relaxed">"{r.text}"</p>
              <div className="flex items-center gap-4">
                <p className="font-bold text-gray-900">{r.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <Link to="/" className="text-2xl font-bold text-[var(--nest-teal)]">
              Nest<span className="text-[var(--nest-amber)]">Verify</span>
            </Link>
            <p className="text-gray-400 text-sm mt-4 max-w-xs">
              Defining the standard for rental property verification in Nigeria. We provide a safe haven for your housing search.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Links</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-50 text-xs text-gray-400 flex justify-between">
          <p>© 2026 NestVerify Nigeria. All rights reserved.</p>
          <p>Made with confidence.</p>
        </div>
      </footer>
    </div>
  )
}