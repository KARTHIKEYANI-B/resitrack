import axiosInstance from './axios'

export const adminAPI = {

  // ── Dashboard ────────────────────────────────────────────────────────────
  getDashboardStats:   ()       => axiosInstance.get('/admin/dashboard/stats'),
  getMonthlyChartData: (year)   => axiosInstance.get('/admin/dashboard/chart', { params: { year } }),

  // ── Analytics (new — replaces static mock data in FinancialReports) ──────
  getAnalyticsSummary:    (params) => axiosInstance.get('/admin/analytics/summary', { params }),
  getAnalyticsChart:      (params) => axiosInstance.get('/admin/analytics/chart', { params }),
  getExpenseBreakdown:    (params) => axiosInstance.get('/admin/analytics/expense-breakdown', { params }),
  getPaymentStats:        (params) => axiosInstance.get('/admin/analytics/payment-stats', { params }),

  // ── Resident Approvals ───────────────────────────────────────────────────
  getAllApprovals:       (params)      => axiosInstance.get('/admin/approvals', { params }),
  getApprovalCount:     ()            => axiosInstance.get('/admin/approvals/count'),
  approveResident:      (id)          => axiosInstance.put(`/admin/approvals/${id}/approve`),
  rejectResident:       (id, reason)  => axiosInstance.put(`/admin/approvals/${id}/reject`, { reason }),
  bulkApproveResidents: (ids)         => axiosInstance.put('/admin/approvals/bulk-approve', { ids }),
  bulkRejectResidents:  (ids, reason) => axiosInstance.put('/admin/approvals/bulk-reject', { ids, reason }),

  // ── Residents (view/edit/delete only — no manual add) ───────────────────
  getAllResidents:    ()          => axiosInstance.get('/admin/residents'),
  getActiveResidents: ()         => axiosInstance.get('/admin/residents/active'),
  updateResident:    (id, data)  => axiosInstance.put(`/admin/residents/${id}`, data),
  deleteResident:    (id)        => axiosInstance.delete(`/admin/residents/${id}`),

  // ── Maintenance config (rate cards) ──────────────────────────────────────
  getMaintenanceList:  ()          => axiosInstance.get('/admin/maintenance'),
  createMaintenance:   (data)      => axiosInstance.post('/admin/maintenance', data),
  updateMaintenance:   (id, data)  => axiosInstance.put(`/admin/maintenance/${id}`, data),
  deleteMaintenance:   (id)        => axiosInstance.delete(`/admin/maintenance/${id}`),

  // ── Maintenance batches (NEW) ─────────────────────────────────────────────
  getMaintenanceBatches:  ()          => axiosInstance.get('/admin/maintenance/batches'),
  getMaintenanceBatch:    (id)        => axiosInstance.get(`/admin/maintenance/batches/${id}`),
  createMaintenanceBatch: (data)      => axiosInstance.post('/admin/maintenance/batch', data),
  updateBatchStatus:      (id, status)=> axiosInstance.put(`/admin/maintenance/batches/${id}/status`, { status }),
  deleteMaintenanceBatch: (id)        => axiosInstance.delete(`/admin/maintenance/batches/${id}`),

  // ── Payments ─────────────────────────────────────────────────────────────
  getAllPayments:   (params)     => axiosInstance.get('/admin/payments', { params }),
  createAdminPayment: (data)    => axiosInstance.post('/admin/payments', data),
  getPaymentTrackingStats:  ()    => axiosInstance.get('/admin/payments/tracking-stats'),
  approvePayment:  (id)         => axiosInstance.put(`/admin/payments/${id}/approve`),
  rejectPayment:   (id, reason) => axiosInstance.put(`/admin/payments/${id}/reject`, { reason }),

  // ── Expenses ─────────────────────────────────────────────────────────────
  getAllExpenses:   (params)    => axiosInstance.get('/admin/expenses', { params }),
  addExpense:      (data)      => axiosInstance.post('/admin/expenses', data),
  updateExpense:   (id, data)  => axiosInstance.put(`/admin/expenses/${id}`, data),
  deleteExpense:   (id)        => axiosInstance.delete(`/admin/expenses/${id}`),

  // ── Pending Dues ──────────────────────────────────────────────────────────
  getPendingDues:      ()   => axiosInstance.get('/admin/pending-dues'),
  applyPenalty:        (id) => axiosInstance.post(`/admin/pending-dues/${id}/penalty`),
  sendDueNotification: (id) => axiosInstance.post(`/admin/pending-dues/${id}/notify`),

  // ── Receipts ─────────────────────────────────────────────────────────────
  getAllReceipts:    (params) => axiosInstance.get('/admin/receipts', { params }),
  getReceiptById:   (id)     => axiosInstance.get(`/admin/receipts/${id}`),
  downloadReceipt:  (id)     => axiosInstance.get(`/admin/receipts/${id}/download`, { responseType: 'blob' }),

  // ── Financial Reports ─────────────────────────────────────────────────────
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

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications:           ()    => axiosInstance.get('/admin/notifications'),
  getUnreadNotificationCount: ()    => axiosInstance.get('/admin/notifications/unread-count'),
  markNotificationRead:       (id)  => axiosInstance.put(`/admin/notifications/${id}/read`),
  deleteNotification:         (id)  => axiosInstance.delete(`/admin/notifications/${id}`),

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings:    ()     => axiosInstance.get('/admin/settings'),
  updateSettings: (data) => axiosInstance.put('/admin/settings', data),
  changePassword: (data) => axiosInstance.put('/auth/admin/change-password', data),
  getProfile:     ()     => axiosInstance.get('/admin/profile'),
  updateProfile:  (data) => axiosInstance.put('/admin/profile', data),
}