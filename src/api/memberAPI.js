import axiosInstance from './axios'

export const memberAPI = {

  getAllMembers: () => axiosInstance.get('/members'),

  getMemberById: (id) => axiosInstance.get(`/members/${id}`),

  createMember: (data) => axiosInstance.post('/members', data),

  updateMember: (id, data) => axiosInstance.put(`/members/${id}`, data),

  removeMember: (id) => axiosInstance.delete(`/members/${id}`),

  transferPresidency: (data) => axiosInstance.post('/members/transfer-presidency', data),

  getActiveAssignments: () => axiosInstance.get('/admin/assignments'),

  getResidentAssignmentHistory: (residentId) =>
    axiosInstance.get(`/admin/assignments/resident/${residentId}`),

  getPositionHistory: (position) =>
    axiosInstance.get(`/admin/assignments/position/${position}`),

  appointResident: (data) => axiosInstance.post('/admin/assignments/appoint', data),

  revokeAssignment: (data) => axiosInstance.post('/admin/assignments/revoke', data),
}