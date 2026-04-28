import Navbar from '../components/layout/Navbar'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-24 px-6 prose prose-slate">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 border-b pb-4">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-12 italic">Last Updated: April 27, 2026</p>
        
        <div className="space-y-12 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              Welcome to NestVerify. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully before using our services in Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Verification Services</h2>
            <p>
              NestVerify provides property and identity verification services. While we strive for 100% accuracy through physical inspections, our verification is based on the state of the property at the time of inspection. Users are encouraged to still exercise personal caution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p>
              Users must provide accurate, current, and complete information during the registration and verification process. Any fraudulent activity or provision of false documents will result in immediate account termination and potential legal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment and Transactions</h2>
            <p>
              All rental payments made through NestVerify are processed securely. We act as a neutral intermediary. Our fee structure is transparent and clearly communicated before any transaction is finalized. All prices are in Nigerian Naira (₦).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <p>
              NestVerify is not a landlord, property manager, or real estate agent. We are a verification and marketplace platform. We are not liable for disputes between tenants and landlords that occur after a successful move-in and verification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact</h2>
            <p>
              If you have any questions regarding these terms, please contact us at legal@nestverify.com.ng.
            </p>
          </section>
        </div>
      </div>
      
      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 text-xs mt-12">
         <p>© 2026 NestVerify Nigeria. Securely verifying homes for you.</p>
      </footer>
    </div>
  )
}
