import axiosInstance from './axios'

export const vehicleAPI = {
  // Owner: CRUD
  getAll:    ()         => axiosInstance.get('/user/vehicles'),
  getById:   (id)       => axiosInstance.get(`/user/vehicles/${id}`),

  // Add a vehicle with no insurance document (JSON)
  add: (data) => axiosInstance.post('/user/vehicles', {
    vehicleNumber:       data.vehicleNumber,
    vehicleType:         data.vehicleType || null,
    insuranceNumber:     data.insuranceNumber || null,
    insuranceProvider:   data.insuranceProvider || null,
    insuranceExpiryDate: data.insuranceExpiryDate || null,
  }),

  // Add a vehicle together with an insurance document (multipart)
  addWithDocument: (data) => {
    const formData = new FormData()
    formData.append('vehicleNumber', data.vehicleNumber)
    if (data.vehicleType)         formData.append('vehicleType', data.vehicleType)
    if (data.insuranceNumber)     formData.append('insuranceNumber', data.insuranceNumber)
    if (data.insuranceProvider)   formData.append('insuranceProvider', data.insuranceProvider)
    if (data.insuranceExpiryDate) formData.append('insuranceExpiryDate', data.insuranceExpiryDate)
    if (data.insuranceDocument)   formData.append('insuranceDocument', data.insuranceDocument)
    return axiosInstance.post('/user/vehicles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  update: (id, data) => axiosInstance.put(`/user/vehicles/${id}`, {
    vehicleNumber:       data.vehicleNumber,
    vehicleType:         data.vehicleType,
    insuranceNumber:     data.insuranceNumber,
    insuranceProvider:   data.insuranceProvider,
    insuranceExpiryDate: data.insuranceExpiryDate,
  }),

  remove: (id) => axiosInstance.delete(`/user/vehicles/${id}`),

  uploadInsuranceDocument: (id, file) => {
    const formData = new FormData()
    formData.append('insuranceDocument', file)
    return axiosInstance.post(`/user/vehicles/${id}/insurance-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  removeInsuranceDocument: (id) => axiosInstance.delete(`/user/vehicles/${id}/insurance-document`),
}
