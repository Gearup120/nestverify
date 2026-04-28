import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOTPPage from './pages/VerifyOTPPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import AddPropertyPage from './pages/AddPropertyPage'
import AdminPage from './pages/AdminPage'
import MessagesPage from './pages/MessagesPage'
import SavedPropertiesPage from './pages/SavedPropertiesPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import LoadingSpinner from './components/ui/LoadingSpinner'

import AIAssistantBubble from './components/ai/AIAssistantBubble'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_staff) return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const location = useLocation()
  const authPages = ['/login', '/register']
  const showBubbles = !authPages.includes(location.pathname)

  return (
    <>
      <Routes>
      {/* Public */}
    {/* Public */}
<Route path="/" element={<PropertiesPage />} />
<Route path="/properties/:id" element={<PropertyDetailPage />} />
<Route path="/about" element={<AboutPage />} />
<Route path="/contact" element={<ContactPage />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/login"      element={<GuestRoute><LoginPage /></GuestRoute>} />
<Route path="/register"   element={<GuestRoute><RegisterPage /></GuestRoute>} />
<Route path="/verify-otp" element={<VerifyOTPPage />} />  {/* ← no GuestRoute */}
      {/* Protected */}
      <Route element={<Layout />}>
        <Route path="/dashboard"      element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/profile"        element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/messages"       element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/saved"          element={<PrivateRoute><SavedPropertiesPage /></PrivateRoute>} />
        <Route path="/properties/new" element={<PrivateRoute><AddPropertyPage /></PrivateRoute>} />
        <Route path="/admin"          element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {showBubbles && <AIAssistantBubble />}
    </>
  )
}