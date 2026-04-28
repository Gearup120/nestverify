import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register:      (data)     => api.post('/register/', data),
  login:         (data)     => api.post('/login/', data),
  logout:        (refresh)  => api.post('/logout/', { refresh }),
  profile:       ()         => api.get('/profile/'),
  updateProfile: (data)     => api.patch('/profile/', data),
  uploadID:      (formData) => api.patch('/upload-id/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verifyOTP:     (data)     => api.post('/verify-otp/', data),
  resendOTP:     (data)     => api.post('/resend-otp/', data),
  adminUsers:    ()         => api.get('/admin/users/'),
  adminVerify:   (id, action) => api.patch(`/admin/verify/${id}/`, { action }),
  contact:       (data)     => api.post('/contact/', data),
}

// Properties
export const propertiesAPI = {
  list:         (params)     => api.get('/properties/', { params }),
  detail:       (id)         => api.get(`/properties/${id}/`),
  create:       (formData)   => api.post('/properties/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:       (id, data)   => api.patch(`/properties/${id}/`, data),
  delete:       (id)         => api.delete(`/properties/${id}/`),
  mine:         ()           => api.get('/properties/mine/'),
  saved:        ()           => api.get('/properties/saved/'),
  toggleSave:   (id)         => api.post(`/properties/saved/${id}/`),
  adminPending: ()           => api.get('/properties/admin/pending/'),
  adminReview:  (id, action) => api.patch(`/properties/admin/${id}/review/`, { action }),
}

// Fraud
export const fraudAPI = {
  analyze:       (propertyId) => api.post(`/fraud/analyze/${propertyId}/`),
  report:        (data)       => api.post('/fraud/report/', data),
  adminReports:  (params)     => api.get('/fraud/admin/reports/', { params }),
  resolveReport: (id, data)   => api.patch(`/fraud/admin/reports/${id}/resolve/`, data),
}

// Chat
export const chatAPI = {
  conversations: ()              => api.get('/chat/conversations/'),
  start:         (property_id)   => api.post('/chat/conversations/start/', { property_id }),
  messages:      (convId)        => api.get(`/chat/conversations/${convId}/messages/`),
  send:          (convId, text)  => api.post(`/chat/conversations/${convId}/send/`, { text }),
  unread:        ()              => api.get('/chat/unread/'),
}

// Viewings
export const viewingsAPI = {
  book:    (data)             => api.post('/viewings/', data),
  mine:    ()                 => api.get('/viewings/mine/'),
  landlord: ()                => api.get('/viewings/landlord/'),
  respond: (id, action, note) => api.patch(`/viewings/${id}/respond/`, { action, note }),
  cancel:  (id)               => api.patch(`/viewings/${id}/cancel/`),
}

// AI Assistant
export const aiAPI = {
  chat: (messages) => api.post('/ai/chat/', { messages }),
}

export default api