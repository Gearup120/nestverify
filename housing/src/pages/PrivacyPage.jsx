import Navbar from '../components/layout/Navbar'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-24 px-6 prose prose-slate">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 border-b pb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12 italic">Last Updated: April 27, 2026</p>
        
        <div className="space-y-12 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p>
              To provide our verification services, we collect personal information including your name, email address, phone number, and government-issued identification documents. We also collect property-related data provided by landlords.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Data</h2>
            <p>
              Your data is used solely for the purpose of verifying identities, authenticating properties, processing secure payments, and maintaining the security of our platform. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard encryption and security measures to protect your sensitive documents and payment information. All data is stored on secure servers with restricted access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Information</h2>
            <p>
              We only share information with landlords or tenants as part of a formal verification or rental agreement process. We may also share data with law enforcement if required by Nigerian law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience and analyze site traffic. You can manage your cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. Please contact our privacy team at privacy@nestverify.com.ng for any such requests.
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
