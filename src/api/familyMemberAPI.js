import axiosInstance from './axios'

export const familyMemberAPI = {
  // Owner: CRUD
  getAll:    ()         => axiosInstance.get('/user/family-members'),
  getById:   (id)       => axiosInstance.get(`/user/family-members/${id}`),
  add:       (data)     => axiosInstance.post('/user/family-members', data),
  update:    (id, data) => axiosInstance.put(`/user/family-members/${id}`, data),
  remove:    (id)       => axiosInstance.delete(`/user/family-members/${id}`),

 
  grantAccess:  (id, data) => axiosInstance.post(`/user/family-members/${id}/grant-access`, data),
  revokeAccess: (id)       => axiosInstance.post(`/user/family-members/${id}/revoke-access`),
}