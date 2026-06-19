import axiosInstance from './axios'

export const securityAdminAPI = {
  getAll:    ()         => axiosInstance.get('/admin/security'),

  getById:   (id)       => axiosInstance.get(`/admin/security/${id}`),

  create:    (data)     => axiosInstance.post('/admin/security', data),

  update:    (id, data) => axiosInstance.put(`/admin/security/${id}`, data),

  remove:    (id)       => axiosInstance.delete(`/admin/security/${id}`),

  sendMessage: (guardId, data) =>
    axiosInstance.post(`/admin/security/${guardId}/message`, data),
}

export const securityAPI = {

  getResidents: () => axiosInstance.get('/security/residents'),

  getNotifications:  () => axiosInstance.get('/security/notifications'),
  getUnreadCount:    () => axiosInstance.get('/security/notifications/unread-count'),
  markRead:          (id) => axiosInstance.put(`/security/notifications/${id}/read`),

  sendMessage: (data) => axiosInstance.post('/security/messages', data),
}