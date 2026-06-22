import axiosInstance from './axios'

export const authAPI = {

  login:                   (data)  => axiosInstance.post('/auth/login', data),

  adminLogin:              (data)  => axiosInstance.post('/auth/admin/login', data),
  userLogin:               (data)  => axiosInstance.post('/auth/user/login',  data),
  securityLogin:           (data)  => axiosInstance.post('/auth/security/login', data),

  register:                (data)  => axiosInstance.post('/auth/register',     data),

  // Additive: registration with an inline vehicle insurance document.
  // Sends the same fields as `register`, as multipart form-data, plus an
  // optional `insuranceDocument` file. Falls back to plain `register` is
  // unaffected and still works exactly as before for callers that don't
  // need a vehicle insurance document at sign-up time.
  registerWithVehicleDocument: (data, insuranceDocument) => {
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (insuranceDocument) formData.append('insuranceDocument', insuranceDocument)
    return axiosInstance.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  validateRegNo:           (regNo) => axiosInstance.get(`/auth/validate-register-number/${regNo}`),

  getRegistrationStatus:   (email) => axiosInstance.get(`/auth/registration-status/${encodeURIComponent(email)}`),

  changeAdminPassword:     (data)  => axiosInstance.put('/auth/admin/change-password',    data),
  changeResidentPassword:  (data)  => axiosInstance.put('/auth/user/change-password',     data),
  changeSecurityPassword:  (data)  => axiosInstance.put('/auth/security/change-password', data),
}