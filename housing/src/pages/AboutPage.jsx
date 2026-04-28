import Navbar from '../components/layout/Navbar'
import { Link } from 'react-router-dom'
import { ShieldCheck, UserCheck, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-[var(--nest-teal)] py-24 px-6 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Mission: Safe Housing for Every Nigerian</h1>
        <p className="text-xl text-teal-50 max-w-3xl mx-auto font-light leading-relaxed">
          NestVerify was born out of a desire to eliminate fraud in the Nigerian rental market and build a future where every home-seeker feels secure.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto py-24 px-6 leading-relaxed text-gray-600 space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">The NestVerify Story</h2>
        <p>
          In a rapidly growing market like Nigeria, the process of finding a home has often been fraught with uncertainty, lack of transparency, and unfortunately, scams. We saw the need for a platform that doesn't just list properties, but verifies them.
        </p>
        <p>
          Founded in Lagos, NestVerify is a technology-driven real estate platform dedicated to physical property verification, identity authentication, and secure rental transactions. Our team consists of real estate professionals and tech experts committed to creating a transparent ecosystem.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
           <div className="text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-[var(--nest-teal)] mx-auto mb-4">
                 <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Integrity</h3>
              <p className="text-sm">We believe in absolute honesty in every listing and transaction.</p>
           </div>
           <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-[var(--nest-amber)] mx-auto mb-4">
                 <UserCheck size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Trust</h3>
              <p className="text-sm">Building a community of verified landlords and reliable tenants.</p>
           </div>
           <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                 <Heart size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Care</h3>
              <p className="text-sm">Every user is part of the Nest family, and their safety is our priority.</p>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-20 px-6 text-center">
         <h2 className="text-2xl font-bold text-gray-900 mb-6">Join the movement toward safer housing</h2>
         <Link to="/register" className="btn-primary inline-block">Get Started Today</Link>
      </section>

      {/* Footer (Simplified) */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-xs">
         <p>© 2026 NestVerify Nigeria. Securely verifying homes for you.</p>
      </footer>
    </div>
  )
}
