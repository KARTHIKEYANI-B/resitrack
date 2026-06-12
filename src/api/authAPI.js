import axiosInstance from './axios'

export const authAPI = {
  adminLogin:              (data)  => axiosInstance.post('/auth/admin/login', data),
  userLogin:               (data)  => axiosInstance.post('/auth/user/login',  data),
  securityLogin:           (data)  => axiosInstance.post('/auth/security/login', data), // NEW
  register:                (data)  => axiosInstance.post('/auth/register',     data),
  validateRegNo:           (regNo) => axiosInstance.get(`/auth/validate-register-number/${regNo}`),

  getRegistrationStatus:   (email) => axiosInstance.get(`/auth/registration-status/${encodeURIComponent(email)}`),

  changeAdminPassword:     (data)  => axiosInstance.put('/auth/admin/change-password', data),
  changeResidentPassword:  (data)  => axiosInstance.put('/auth/user/change-password',  data),
  changeSecurityPassword:  (data)  => axiosInstance.put('/auth/security/change-password', data), // NEW
}