import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

// Auth Pages
import LoginPage           from './pages/auth/LoginPage'
import RegisterPage        from './pages/auth/RegisterPage'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'

// Admin Layout + Pages
import AdminLayout           from './pages/admin/AdminLayout'
import AdminDashboard        from './pages/admin/Dashboard'
import ResidentApprovalPage  from './pages/admin/ResidentApprovalPage'
import ResidentList          from './pages/admin/ResidentList'
import MaintenanceManagement from './pages/admin/MaintenanceManagement'
import PaymentTracking       from './pages/admin/PaymentTracking'
import ExpenseManagement     from './pages/admin/ExpenseManagement'
import PendingDues           from './pages/admin/PendingDues'
import Receipts              from './pages/admin/Receipts'
import FinancialReports      from './pages/admin/FinancialReports'
import AdminFinancialReport  from './pages/admin/AdminFinancialReport'
import AdminNotifications    from './pages/admin/Notifications'
import AdminSettings         from './pages/admin/Settings'

// User Layout + Pages
import UserLayout          from './pages/user/UserLayout'
import UserDashboard       from './pages/user/UserDashboard'
import CurrentMaintenance  from './pages/user/CurrentMaintenance'
import PaymentHistory      from './pages/user/PaymentHistory'
import UserPendingDues     from './pages/user/UserPendingDues'
import UserReceipts        from './pages/user/UserReceipts'
import UserFinancialReport from './pages/user/UserFinancialReport'
import UserNotifications   from './pages/user/UserNotifications'
import UserSettings        from './pages/user/UserSettings'

const TOAST_STYLE = {
  background: '#e1e5f2', color: '#bfdbf7',
  border: '1px solid #1f7a8c', fontSize: '13px', borderRadius: '10px',
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 3500,
          style: TOAST_STYLE,
          success: { iconTheme: { primary: '#10b981', secondary: '#1f2937' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }} />

        <Routes>
          {/* Public */}
          <Route path="/"                 element={<Navigate to="/login" replace />} />
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>
          }>
            <Route index                         element={<AdminDashboard />} />
            <Route path="approvals"              element={<ResidentApprovalPage />} />
            <Route path="residents"              element={<ResidentList />} />
            <Route path="maintenance"            element={<MaintenanceManagement />} />
            <Route path="payments"               element={<PaymentTracking />} />
            <Route path="expenses"               element={<ExpenseManagement />} />
            <Route path="pending-dues"           element={<PendingDues />} />
            <Route path="receipts"               element={<Receipts />} />
            <Route path="financial-report"       element={<AdminFinancialReport />} />
            <Route path="reports"                element={<FinancialReports />} />
            <Route path="notifications"          element={<AdminNotifications />} />
            <Route path="settings"               element={<AdminSettings />} />
          </Route>

          {/* User */}
          <Route path="/user" element={
            <ProtectedRoute role="USER"><UserLayout /></ProtectedRoute>
          }>
            <Route index                         element={<UserDashboard />} />
            <Route path="maintenance"            element={<CurrentMaintenance />} />
            <Route path="payment-history"        element={<PaymentHistory />} />
            <Route path="pending-dues"           element={<UserPendingDues />} />
            <Route path="receipts"               element={<UserReceipts />} />
            <Route path="financial-report"       element={<UserFinancialReport />} />
            <Route path="notifications"          element={<UserNotifications />} />
            <Route path="settings"               element={<UserSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}