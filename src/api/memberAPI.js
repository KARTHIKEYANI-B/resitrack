import axiosInstance from './axios'

export const memberAPI = {
  // ── Committee Members (display) ────────────────────────────────────────
  // GET /api/members — any authenticated user (ADMIN or USER)
  getAllMembers: () => axiosInstance.get('/members'),

  // GET /api/members/:id
  getMemberById: (id) => axiosInstance.get(`/members/${id}`),

  // POST /api/members — SUPER_ADMIN only (enforced in controller)
  createMember: (data) => axiosInstance.post('/members', data),

  // PUT /api/members/:id — SUPER_ADMIN only
  updateMember: (id, data) => axiosInstance.put(`/members/${id}`, data),

  // DELETE /api/members/:id — SUPER_ADMIN only
  removeMember: (id) => axiosInstance.delete(`/members/${id}`),

  // POST /api/members/transfer-presidency — SUPER_ADMIN only
  transferPresidency: (data) => axiosInstance.post('/members/transfer-presidency', data),

  // ── Admin Assignment Workflow (SUPER_ADMIN) ────────────────────────────
  //
  // These endpoints implement the position-based admin account architecture:
  //   - One Resident = One Record (never duplicated)
  //   - Admin accounts belong to positions, not people
  //   - Personal email is NEVER used as admin account email
  //   - History is preserved across committee changes

  // GET /api/admin/assignments — all currently active assignments
  getActiveAssignments: () => axiosInstance.get('/admin/assignments'),

  // GET /api/admin/assignments/resident/:id — full history for a resident
  getResidentAssignmentHistory: (residentId) =>
    axiosInstance.get(`/admin/assignments/resident/${residentId}`),

  // GET /api/admin/assignments/position/:position — full history for a position
  getPositionHistory: (position) =>
    axiosInstance.get(`/admin/assignments/position/${position}`),

  /**
   * POST /api/admin/assignments/appoint
   * Appoint a resident to a position (SUPER_ADMIN only).
   *
   * Body: {
   *   residentId: number,       // existing owner — never creates a new Resident
   *   position: string,         // PRESIDENT | VICE_PRESIDENT | SECRETARY | etc.
   *   startDate?: string,       // ISO date, defaults to today
   *   notes?: string,
   *   resetPassword: boolean,   // true = generate new credentials for position account
   * }
   *
   * Response includes:
   *   positionEmail     — e.g. admin.treasurer@apartment.com
   *   generatedPassword — only present when resetPassword=true; store securely
   */
  appointResident: (data) => axiosInstance.post('/admin/assignments/appoint', data),

  /**
   * POST /api/admin/assignments/revoke
   * Revoke an active assignment (SUPER_ADMIN only).
   *
   * Body: { assignmentId: number, endDate?: string, notes?: string }
   */
  revokeAssignment: (data) => axiosInstance.post('/admin/assignments/revoke', data),
}