import axiosInstance from './axios'

export const userAPI = {
  // Dashboard
  getDashboardStats:          ()       => axiosInstance.get('/user/dashboard/stats'),

  // Maintenance & Payments
  getCurrentMaintenance:      ()       => axiosInstance.get('/user/maintenance/current'),
  submitPaymentVerification:  (data)   => axiosInstance.post('/user/maintenance/pay', data),
  getPaymentHistory:          (params) => axiosInstance.get('/user/payments/history', { params }),
  getPendingDues:             ()       => axiosInstance.get('/user/pending-dues'),

  // Receipts
  getReceipts:                (params) => axiosInstance.get('/user/receipts', { params }),
  getReceiptById:             (id)     => axiosInstance.get(`/user/receipts/${id}`),
  downloadReceipt:            (id)     => axiosInstance.get(`/user/receipts/${id}/download`, { responseType: 'blob' }),

  // Notifications
  getNotifications:           ()       => axiosInstance.get('/user/notifications'),
  markNotificationRead:       (id)     => axiosInstance.put(`/user/notifications/${id}/read`),
  deleteNotification:         (id)     => axiosInstance.delete(`/user/notifications/${id}`),
  sendComplaint:              (data)   => axiosInstance.post('/user/notifications/complaint', data),

  // NEW: Financial Report (read-only view for residents)
  getCollectionReport:        (params) => axiosInstance.get('/user/financial-report/collection', { params }),
  getExpenseReport:           (params) => axiosInstance.get('/user/financial-report/expenses', { params }),
  exportCollectionPdf:        (params) => axiosInstance.get('/user/financial-report/collection/export/pdf',   { params, responseType: 'blob' }),
  exportCollectionExcel:      (params) => axiosInstance.get('/user/financial-report/collection/export/excel', { params, responseType: 'blob' }),
  exportExpensePdf:           (params) => axiosInstance.get('/user/financial-report/expenses/export/pdf',     { params, responseType: 'blob' }),
  exportExpenseExcel:         (params) => axiosInstance.get('/user/financial-report/expenses/export/excel',   { params, responseType: 'blob' }),

  // Settings & Profile
  getSettings:                ()       => axiosInstance.get('/user/settings'),
  updateSettings:             (data)   => axiosInstance.put('/user/settings', data),
  changePassword:             (data)   => axiosInstance.put('/auth/user/change-password', data),
  getProfile:                 ()       => axiosInstance.get('/user/profile'),
  updateProfile:              (data)   => axiosInstance.put('/user/profile', data),
}
