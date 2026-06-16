import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

// Auth Pages
import LoginPage           from './pages/auth/LoginPage'
import RegisterPage        from './pages/auth/RegisterPage'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'

// Admin Layout + Pages (unchanged)
import AdminLayout           from './pages/admin/AdminLayout'
import AdminDashboard        from './pages/admin/Dashboard'
import ResidentApprovalPage  from './pages/admin/ResidentApprovalPage'
import ResidentList          from './pages/admin/ResidentList'
import MaintenanceManagement from './pages/admin/MaintenanceManagement'
import MaintenanceList       from './pages/admin/MaintenanceList'
import PaymentTracking       from './pages/admin/PaymentTracking'
import PaymentVerification   from './pages/admin/PaymentVerification'
import ExpenseManagement     from './pages/admin/ExpenseManagement'
import PendingDues           from './pages/admin/PendingDues'
import Receipts              from './pages/admin/Receipts'
import AdminFinancialReport  from './pages/admin/AdminFinancialReport'
import AdminNotifications    from './pages/admin/Notifications'
import AdminComplaints       from './pages/admin/AdminComplaints'
import AdminSettings         from './pages/admin/Settings'
import AdminMembersList      from './pages/admin/MembersList'

// User Layout + Pages (unchanged)
import UserLayout          from './pages/user/UserLayout'
import UserDashboard       from './pages/user/UserDashboard'
import FamilyMembersPage   from './pages/user/FamilyMembersPage'
import CurrentMaintenance  from './pages/user/CurrentMaintenance'
import PaymentHistory      from './pages/user/PaymentHistory'
import UserPendingDues     from './pages/user/UserPendingDues'
import UserReceipts        from './pages/user/UserReceipts'
import UserFinancialReport from './pages/user/UserFinancialReport'
import UserNotifications   from './pages/user/UserNotifications'
import UserSettings        from './pages/user/UserSettings'
import UserMembersList     from './pages/user/UserMembersList'
import UserSecurityMessage from './pages/user/UserSecurityMessage'

// Security Layout + Pages
import SecurityLayout        from './pages/security/SecurityLayout'
import SecurityDashboard     from './pages/security/SecurityDashboard'
import SecurityResidents     from './pages/security/SecurityResidents'
import SecurityNotifications from './pages/security/SecurityNotifications'
import SecurityMessages      from './pages/security/SecurityMessages'

const TOAST_STYLE = {
  background: '#FFFAF5',
  color: '#1a2e2e',
  border: '1px solid #E8C9AB',
  fontSize: '13px',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,121,121,0.12)',
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: TOAST_STYLE,
            success: { iconTheme: { primary: '#007979', secondary: '#ffffff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
          containerStyle={{ top: 20, right: 20 }}
          gutter={8}
        />

        <Routes>
          {/* Public */}
          <Route path="/"                 element={<Navigate to="/login" replace />} />
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Admin — unchanged */}
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>
          }>
            <Route index                       element={<AdminDashboard />} />
            <Route path="approvals"            element={<ResidentApprovalPage />} />
            <Route path="residents"            element={<ResidentList />} />
            <Route path="members"              element={<AdminMembersList />} />
            <Route path="maintenance"          element={<MaintenanceManagement />} />
            <Route path="maintenance-list"     element={<MaintenanceList />} />
            <Route path="payments"             element={<PaymentTracking />} />
            <Route path="payment-verification" element={<PaymentVerification />} />
            <Route path="expenses"             element={<ExpenseManagement />} />
            <Route path="pending-dues"         element={<PendingDues />} />
            <Route path="receipts"             element={<Receipts />} />
            <Route path="financial-report"     element={<AdminFinancialReport />} />
            <Route path="complaints"           element={<AdminComplaints />} />
            <Route path="notifications"        element={<AdminNotifications />} />
            <Route path="settings"             element={<AdminSettings />} />
          </Route>

          {/* User — unchanged */}
          <Route path="/user" element={
            <ProtectedRoute role="USER"><UserLayout /></ProtectedRoute>
          }>
            <Route index                   element={<UserDashboard />} />
            <Route path="members"          element={<UserMembersList />} />
            <Route path="family-members"   element={<FamilyMembersPage />} />
            <Route path="maintenance"      element={<CurrentMaintenance />} />
            <Route path="payment-history"  element={<PaymentHistory />} />
            <Route path="pending-dues"     element={<UserPendingDues />} />
            <Route path="receipts"         element={<UserReceipts />} />
            <Route path="financial-report" element={<UserFinancialReport />} />
            <Route path="notifications"    element={<UserNotifications />} />
            <Route path="security-message" element={<UserSecurityMessage />} />
            <Route path="settings"         element={<UserSettings />} />
          </Route>

          {/* Security */}
          <Route path="/security" element={
            <ProtectedRoute role="SECURITY"><SecurityLayout /></ProtectedRoute>
          }>
            <Route index                   element={<SecurityDashboard />} />
            <Route path="residents"        element={<SecurityResidents />} />
            <Route path="notifications"    element={<SecurityNotifications />} />
            <Route path="messages"         element={<SecurityMessages />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}