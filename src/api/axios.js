import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})


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

    if (error.response?.status === 401) {
      const hasJsonBody = error.response?.data && (
        typeof error.response.data === 'object'
          ? Object.keys(error.response.data).length > 0
          : String(error.response.data).length > 0
      )

      if (!hasJsonBody) {

        localStorage.removeItem('resitrack_token')
        localStorage.removeItem('resitrack_user')
        sessionStorage.removeItem('resitrack_token')
        sessionStorage.removeItem('resitrack_user')
        window.location.href = '/login'
      }

    }
    return Promise.reject(error)
  }
)

export default axiosInstance