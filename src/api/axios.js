import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

/**
 * Read the auth token from whichever store it was saved to.
 *
 * The "Remember Me" feature (added in a previous session) changed
 * AuthContext.login() to write to sessionStorage when rememberMe=false
 * and to localStorage when rememberMe=true.
 *
 * This interceptor must check BOTH stores so it works regardless of
 * which one the user's token is in.
 *
 * Priority: localStorage first (persisted "remember me" session),
 * then sessionStorage (current-tab session only).
 */
function getToken() {
  return localStorage.getItem('resitrack_token')
      ?? sessionStorage.getItem('resitrack_token')
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force-logout on 401 if there is NO response body with content
    // (i.e. a true "invalid/expired token" scenario from Spring Security),
    // NOT on API errors that happen to return 401/403 with a JSON body.
    //
    // Spring Security returns an empty body 401 when the JWT is missing/invalid.
    // Our own controllers return a JSON body with a message even when they
    // throw 401/403, so we check for an empty response to distinguish them.
    if (error.response?.status === 401) {
      const hasJsonBody = error.response?.data && (
        typeof error.response.data === 'object'
          ? Object.keys(error.response.data).length > 0
          : String(error.response.data).length > 0
      )

      if (!hasJsonBody) {
        // True unauthenticated request (token missing/expired) — force logout
        localStorage.removeItem('resitrack_token')
        localStorage.removeItem('resitrack_user')
        sessionStorage.removeItem('resitrack_token')
        sessionStorage.removeItem('resitrack_user')
        window.location.href = '/login'
      }
      // If there IS a JSON body it's an application-level 401 (wrong password, etc.)
      // Let the caller handle it — do NOT redirect
    }
    return Promise.reject(error)
  }
)

export default axiosInstance