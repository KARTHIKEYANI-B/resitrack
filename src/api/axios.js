import axios from 'axios'

/**
 * FIX #7: Base URL from environment variable.
 * In dev:  set VITE_API_BASE_URL=http://localhost:8080/api in frontend/.env
 * In prod: set VITE_API_BASE_URL=https://yourserver.com/api
 *
 * Falls back to '/api' for cases where Vite proxies requests to backend
 * (configured in vite.config.js server.proxy).
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resitrack_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 — token expired or invalid → redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('resitrack_token')
      localStorage.removeItem('resitrack_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance