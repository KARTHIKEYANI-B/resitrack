import axiosInstance from './axios'

// ── Admin → Security account management ──────────────────────────────────────
export const securityAdminAPI = {
  /** List all security accounts */
  getAll:    ()         => axiosInstance.get('/admin/security'),

  /** Get single account */
  getById:   (id)       => axiosInstance.get(`/admin/security/${id}`),

  /** Create a new security account */
  create:    (data)     => axiosInstance.post('/admin/security', data),

  /** Update security account */
  update:    (id, data) => axiosInstance.put(`/admin/security/${id}`, data),

  /** Delete security account */
  remove:    (id)       => axiosInstance.delete(`/admin/security/${id}`),

  /** Admin sends a message to a security guard */
  sendMessage: (guardId, data) =>
    axiosInstance.post(`/admin/security/${guardId}/message`, data),
}

// ── Security guard → own dashboard ───────────────────────────────────────────
export const securityAPI = {
  /** Residents list (read-only) */
  getResidents: () => axiosInstance.get('/security/residents'),

  /** Notifications / messages */
  getNotifications:  () => axiosInstance.get('/security/notifications'),
  getUnreadCount:    () => axiosInstance.get('/security/notifications/unread-count'),
  markRead:          (id) => axiosInstance.put(`/security/notifications/${id}/read`),

  /** Send a message to Admin */
  sendMessage: (data) => axiosInstance.post('/security/messages', data),
}