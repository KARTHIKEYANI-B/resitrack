import axiosInstance from './axios'

export const adminAPI = {

  getDashboardStats:   (params) => axiosInstance.get('/admin/dashboard/stats', { params }),
  getMonthlyChartData: (year)   => axiosInstance.get('/admin/dashboard/chart', { params: { year } }),

  getAnalyticsSummary:    (params) => axiosInstance.get('/admin/analytics/summary', { params }),
  getAnalyticsChart:      (params) => axiosInstance.get('/admin/analytics/chart', { params }),
  getExpenseBreakdown:    (params) => axiosInstance.get('/admin/analytics/expense-breakdown', { params }),
  getPaymentStats:        (params) => axiosInstance.get('/admin/analytics/payment-stats', { params }),

  getAllApprovals:       (params)      => axiosInstance.get('/admin/approvals', { params }),
  getApprovalCount:     ()            => axiosInstance.get('/admin/approvals/count'),
  approveResident:      (id)          => axiosInstance.put(`/admin/approvals/${id}/approve`),
  rejectResident:       (id, reason)  => axiosInstance.put(`/admin/approvals/${id}/reject`, { reason }),
  bulkApproveResidents: (ids)         => axiosInstance.put('/admin/approvals/bulk-approve', { ids }),
  bulkRejectResidents:  (ids, reason) => axiosInstance.put('/admin/approvals/bulk-reject', { ids, reason }),

  getAllResidents:     ()         => axiosInstance.get('/admin/residents'),
  getActiveResidents: ()         => axiosInstance.get('/admin/residents/active'),
  updateResident:     (id, data) => axiosInstance.put(`/admin/residents/${id}`, data),
  deleteResident:     (id)       => axiosInstance.delete(`/admin/residents/${id}`),

  getPopulationStats:       ()         => axiosInstance.get('/admin/residents/population'),
  getResidentFamilyMembers: (id)       => axiosInstance.get(`/admin/residents/${id}/family-members`),
  getFamilyMemberAgeRange:  (params)   => axiosInstance.get('/admin/residents/population/age-range', { params }),
  getFamilyMembersByAgeRange: (params) => axiosInstance.get('/admin/residents/population/age-range/members', { params }),

  // ── Maintenance Rate Configuration ────────────────────────────────────
  getMaintenanceList:  ()         => axiosInstance.get('/admin/maintenance'),
  createMaintenance:   (data)     => axiosInstance.post('/admin/maintenance', data),
  updateMaintenance:   (id, data) => axiosInstance.put(`/admin/maintenance/${id}`, data),
  deleteMaintenance:   (id)       => axiosInstance.delete(`/admin/maintenance/${id}`),

  // ── Maintenance List: per-owner calculated amounts ────────────────────
  // FIX: This method was missing — caused "Could not load maintenance list" error.
  // Calls GET /admin/maintenance/owner-list?year=YYYY&month=MM
  // Returns { flatOwners, villaOwners, ratePerSqFt, grandTotal, ... }
  getMaintenanceOwnerList: (year, month) =>
    axiosInstance.get('/admin/maintenance/owner-list', { params: { year, month } }),

  getMaintenanceBatches:  ()           => axiosInstance.get('/admin/maintenance/batches'),
  getMaintenanceBatch:    (id)         => axiosInstance.get(`/admin/maintenance/batches/${id}`),
  createMaintenanceBatch: (data)       => axiosInstance.post('/admin/maintenance/batch', data),
  updateBatchStatus:      (id, status) => axiosInstance.put(`/admin/maintenance/batches/${id}/status`, { status }),
  deleteMaintenanceBatch: (id)         => axiosInstance.delete(`/admin/maintenance/batches/${id}`),

  getAllPayments:           (params)     => axiosInstance.get('/admin/payments', { params }),
  createAdminPayment:      (data)       => axiosInstance.post('/admin/payments', data),
  getPaymentTrackingStats: ()           => axiosInstance.get('/admin/payments/tracking-stats'),
  approvePayment:          (id)         => axiosInstance.put(`/admin/payments/${id}/approve`),
  rejectPayment:           (id, reason) => axiosInstance.put(`/admin/payments/${id}/reject`, { reason }),

  // ── Payment Verification (screenshot-based workflow) ──────────────────
  // FIX (from previous task): These were missing — kept here for completeness.
  getPaymentVerificationRequests: (params) =>
    axiosInstance.get('/admin/payment-verification', { params }),
  verifyPaymentRequest:        (id)         => axiosInstance.put(`/admin/payment-verification/${id}/verify`),
  rejectPaymentRequest:        (id, reason) => axiosInstance.put(`/admin/payment-verification/${id}/reject`, { reason }),
  getVerificationPendingCount: ()           => axiosInstance.get('/admin/payment-verification/pending-count'),

  // ── Expense Categories ─────────────────────────────────────────────────
  getExpenseCategories:       ()         => axiosInstance.get('/admin/expenses/categories'),
  getAllExpenseCategoryObjects:()         => axiosInstance.get('/admin/expenses/categories/all'),
  createExpenseCategory:      (name)     => axiosInstance.post('/admin/expenses/categories', { name }),
  updateExpenseCategory:      (id, name) => axiosInstance.put(`/admin/expenses/categories/${id}`, { name }),
  deleteExpenseCategory:      (id)       => axiosInstance.delete(`/admin/expenses/categories/${id}`),

  getAllExpenses:  (params)   => axiosInstance.get('/admin/expenses', { params }),
  addExpense:     (data)     => axiosInstance.post('/admin/expenses', data),
  updateExpense:  (id, data) => axiosInstance.put(`/admin/expenses/${id}`, data),
  deleteExpense:  (id)       => axiosInstance.delete(`/admin/expenses/${id}`),

  // ── Pending Dues ──────────────────────────────────────────────────────
  getPendingDues:        ()   => axiosInstance.get('/admin/pending-dues'),
  getPendingDuesSummary: ()   => axiosInstance.get('/admin/pending-dues/summary'),
  applyPenalty:          (id) => axiosInstance.post(`/admin/pending-dues/${id}/penalty`),
  sendDueNotification:   (id) => axiosInstance.post(`/admin/pending-dues/${id}/notify`),

  getAllReceipts:   (params) => axiosInstance.get('/admin/receipts', { params }),
  getReceiptById:  (id)     => axiosInstance.get(`/admin/receipts/${id}`),
  downloadReceipt: (id)     => axiosInstance.get(`/admin/receipts/${id}/download`, { responseType: 'blob' }),

  getFinancialReport:    (params) => axiosInstance.get('/admin/reports', { params }),
  exportReportPdf:       (params) => axiosInstance.get('/admin/reports/export/pdf',   { params, responseType: 'blob' }),
  exportReportExcel:     (params) => axiosInstance.get('/admin/reports/export/excel', { params, responseType: 'blob' }),
  getCollectionReport:   (params) => axiosInstance.get('/admin/financial-report/collection', { params }),
  getCollectionDetail:   (params) => axiosInstance.get('/admin/financial-report/collection/detail', { params }),
  getExpenseReport:      (params) => axiosInstance.get('/admin/financial-report/expenses', { params }),
  getFinancialSummary:   (params) => axiosInstance.get('/admin/financial-report/summary', { params }),
  exportCollectionPdf:   (params) => axiosInstance.get('/admin/financial-report/collection/export/pdf',   { params, responseType: 'blob' }),
  exportCollectionExcel: (params) => axiosInstance.get('/admin/financial-report/collection/export/excel', { params, responseType: 'blob' }),
  exportExpensePdf:      (params) => axiosInstance.get('/admin/financial-report/expenses/export/pdf',    { params, responseType: 'blob' }),
  exportExpenseExcel:    (params) => axiosInstance.get('/admin/financial-report/expenses/export/excel',  { params, responseType: 'blob' }),

  // Resident Paid/Unpaid Detail — Financial Year payment matrix (new feature)
  getResidentPaymentDetail: (params) => axiosInstance.get('/admin/resident-payment-detail', { params }),

  getNotifications:           ()   => axiosInstance.get('/admin/notifications'),
  getUnreadNotificationCount: ()   => axiosInstance.get('/admin/notifications/unread-count'),
  markNotificationRead:       (id) => axiosInstance.put(`/admin/notifications/${id}/read`),
  deleteNotification:         (id) => axiosInstance.delete(`/admin/notifications/${id}`),
  sendNotification: (data) => axiosInstance.post('/admin/notifications', data),

  getAllComplaints:       (params)   => axiosInstance.get('/admin/complaints', { params }),
  getComplaintStats:     ()         => axiosInstance.get('/admin/complaints/stats'),
  updateComplaintStatus: (id, data) => axiosInstance.put(`/admin/complaints/${id}/status`, data),

  getSettings:    ()     => axiosInstance.get('/admin/settings'),
  updateSettings: (data) => axiosInstance.put('/admin/settings', data),
  changePassword: (data) => axiosInstance.put('/auth/admin/change-password', data),
  getProfile:     ()     => axiosInstance.get('/admin/profile'),
  updateProfile:  (data) => axiosInstance.put('/admin/profile', data),
}