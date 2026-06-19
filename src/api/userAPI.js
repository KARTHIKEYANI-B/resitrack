import axiosInstance from './axios'

export const userAPI = {
  getDashboardStats:          ()       => axiosInstance.get('/user/dashboard/stats'),

  getCurrentMaintenance:      ()       => axiosInstance.get('/user/maintenance/current'),
  submitPaymentVerification:  (data)   => axiosInstance.post('/user/maintenance/pay', data),
  getPaymentHistory:          (params) => axiosInstance.get('/user/payments/history', { params }),
  getPendingDues:             ()       => axiosInstance.get('/user/pending-dues'),

  submitPaymentVerificationRequest: (data) => {
    const formData = new FormData()
    formData.append('name',          data.name)
    formData.append('phoneNumber',   data.phoneNumber)
    formData.append('paymentAmount', String(data.paymentAmount))
    formData.append('transactionId', data.transactionId)
    if (data.screenshot) formData.append('screenshot', data.screenshot)
    return axiosInstance.post('/user/payment-verification/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  submitCashPaymentRequest: (data) =>
    axiosInstance.post('/user/payment-verification/submit-cash', {
      name:          data.name,
      phoneNumber:   data.phoneNumber,
      paymentAmount: data.paymentAmount,
      paidToAdminId: data.paidToAdminId,
    }),

  submitBankTransferRequest: (data) => {
    const formData = new FormData()
    formData.append('name',          data.name)
    formData.append('phoneNumber',   data.phoneNumber)
    formData.append('paymentAmount', String(data.paymentAmount))
    formData.append('referenceId',   data.referenceId)
    if (data.bankName)    formData.append('bankName',   data.bankName)
    if (data.screenshot)  formData.append('screenshot', data.screenshot)
    return axiosInstance.post('/user/payment-verification/submit-bank-transfer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getActiveAdminsForCashPayment: () =>
    axiosInstance.get('/user/payment-verification/active-admins'),

  getMyPaymentVerificationRequests: () => axiosInstance.get('/user/payment-verification/my'),

  getReceipts:                (params) => axiosInstance.get('/user/receipts', { params }),
  getReceiptById:             (id)     => axiosInstance.get(`/user/receipts/${id}`),
  downloadReceipt:            (id)     => axiosInstance.get(`/user/receipts/${id}/download`, { responseType: 'blob' }),

  getNotifications:           ()       => axiosInstance.get('/user/notifications'),
  getUnreadNotificationCount: ()       => axiosInstance.get('/user/notifications/unread-count'),
  markNotificationRead:       (id)     => axiosInstance.put(`/user/notifications/${id}/read`),
  deleteNotification:         (id)     => axiosInstance.delete(`/user/notifications/${id}`),

  submitComplaint:            (data)   => axiosInstance.post('/user/complaints', data),
  getMyComplaints:            ()       => axiosInstance.get('/user/complaints'),
  sendComplaint:              (data)   => axiosInstance.post('/user/complaints', {
    title:       data.title || data.subject || '',
    description: data.description || data.message || '',
  }),

  getCollectionReport:        (params) => axiosInstance.get('/user/financial-report/collection', { params }),
  getExpenseReport:           (params) => axiosInstance.get('/user/financial-report/expenses', { params }),
  // Single-month summary: same queries as Admin Dashboard → Bank/Cash always in sync
  getMonthlySummary:          (params) => axiosInstance.get('/user/financial-report/monthly-summary', { params }),
  exportCollectionPdf:        (params) => axiosInstance.get('/user/financial-report/collection/export/pdf',   { params, responseType: 'blob' }),
  exportCollectionExcel:      (params) => axiosInstance.get('/user/financial-report/collection/export/excel', { params, responseType: 'blob' }),
  exportExpensePdf:           (params) => axiosInstance.get('/user/financial-report/expenses/export/pdf',     { params, responseType: 'blob' }),
  exportExpenseExcel:         (params) => axiosInstance.get('/user/financial-report/expenses/export/excel',   { params, responseType: 'blob' }),

  getSettings:                ()       => axiosInstance.get('/user/settings'),
  updateSettings:             (data)   => axiosInstance.put('/user/settings', data),
  changePassword:             (data)   => axiosInstance.put('/auth/user/change-password', data),
  getProfile:                 ()       => axiosInstance.get('/user/profile'),
  updateProfile:              (data)   => axiosInstance.put('/user/profile', data),

  updateFullProfile:          (data)   => axiosInstance.put('/user/profile/full', data),

  uploadProfilePhoto: (file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return axiosInstance.post('/user/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  removeProfilePhoto: () => axiosInstance.delete('/user/profile/photo'),

  getSecurityGuards:        ()                  => axiosInstance.get('/user/security/guards'),

  sendMessageToSecurity:    (guardId, data)     => axiosInstance.post(`/user/security/${guardId}/message`, data),
}