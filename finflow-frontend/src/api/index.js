import axios from 'axios';

/**
 * Global API Queue:
 * Handles multiple concurrent requests failing due to an expired token.
 * Prevents "Race Conditions" where multiple refresh calls are made simultaneously.
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR:
 * 1. Attaches the JWT Bearer token from localStorage.
 * 2. Injects contextual headers (Role, ApplicantID) for microservice awareness.
 * 3. Adds an Idempotency-Key for POST/PATCH/DELETE to prevent duplicate operations.
 */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const role = localStorage.getItem('finflow_role');
    const applicantId = localStorage.getItem('finflow_applicantId') || localStorage.getItem('finflow_userId');
    const loggedInUser = localStorage.getItem('finflow_user');
    if (role) config.headers.userRole = role;
    if (applicantId) config.headers.applicantId = applicantId;
    if (loggedInUser) config.headers.loggedInUser = loggedInUser;

    // Add Idempotency-Key for mutations (POST, PATCH, DELETE)
    if (['post', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers['Idempotency-Key'] = crypto.randomUUID();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR:
 * 1. Catches 401 Unauthorized errors (Expired Tokens).
 * 2. Pauses failed requests and triggers a /auth/refresh call.
 * 3. Silently retries original requests once a new token is obtained.
 */
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token Expiration)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('finflow_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${client.defaults.baseURL}/auth/refresh`, { refreshToken });
        if (res.status === 200) {
          // Fixed: res.data is the ApiResponse, so accessToken is in res.data.data
          const newToken = res.data.data?.accessToken || res.data.accessToken;
          localStorage.setItem('finflow_token', newToken);
          client.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return client(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Domain-Driven Service Abstraction
// Matches exact FinFlow backend endpoints

export const authService = {
  // Auth endpoints (public - no auth filter in gateway)
  signup: (data) => client.post('/auth/signup', data),
  verifySignup: (email, otp) => client.post('/auth/signup/verify', { email, otp }),
  resendSignupOtp: (email) => client.post(`/auth/signup/resend-otp?email=${encodeURIComponent(email)}`),

  // Login & 2FA
  login: (data) => client.post('/auth/login', data),
  verifyLogin: (email, otp) => client.post('/auth/login/verify', { email, otp }),

  // Token refresh
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),

  // Password reset
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => client.post('/auth/verify-otp', { email, otp }),
  resetPassword: (resetToken, newPassword, confirmPassword) =>
    client.post('/auth/reset-password', { resetToken, newPassword, confirmPassword }),

  // Account deletion
  requestDeleteAccount: (email, password) =>
    client.post(`/auth/delete-request?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
  verifyDeleteAccount: (email, otp) =>
    client.delete(`/auth/delete-verify?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`),

  // Profile Management
  updateProfile: (data) => client.put('/auth/profile', data),
  initiateEmailUpdate: (newEmail) => client.post('/auth/profile/email/initiate', { newEmail }),
  confirmEmailUpdate: (data) => client.post('/auth/profile/email/confirm', data),
  getLoginHistory: () => client.get('/auth/profile/login-history'),
};

export const applicationService = {
  // Create new application draft (Step 1)
  createDraft: (loanType, requestedAmount, tenureMonths, purpose) =>
    client.post('/applications', { loanType, requestedAmount, tenureMonths, purpose }),

  // Update personal details (Step 2)
  updatePersonalDetails: (data) => client.patch('/applications/personal', data),

  // Update employment details (Step 3)
  updateEmploymentDetails: (data) => client.patch('/applications/employment', data),

  // Update loan details (Step 4)
  updateLoanDetails: (loanAmount, tenureMonths, loanType) =>
    client.patch('/applications/loan', { loanAmount, tenureMonths, loanType }),

  fetchLoanTypes: () =>
    client.get('/meta/loan-types'),

  // Submit application (Step 5)
  submitApplication: () => client.patch('/applications/submit'),

  // Get current status (Step 6)
  getStatus: () => client.get('/applications/status'),

  // Get history (Step 7)
  getHistory: () => client.get('/applications/history'),

  // Delete draft
  deleteDraft: () => client.delete('/applications/draft'),

  // Delete specific application
  deleteById: (id) => client.delete(`/applications/${id}`),

  // Application details (Admin/Internal)
  getApplication: (id) => client.get(`/applications/${id}`),
};

export const notificationService = {
  getNotifications: () => client.get('/notifications/all'),
  markNotificationRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => client.post('/notifications/read-all'),
  sendHealthCheckNotification: () => {
    const user = JSON.parse(localStorage.getItem('finflow_user') || '{}');
    return client.post('/notifications/send', {
      to: user.email || 'test@finflow.in',
      subject: 'System Health Check',
      templateName: 'login-template',
      model: {
        name: user.fullName || 'FinFlow User',
        status: 'SYSTEM_ACTIVE'
      }
    });
  },
};

export const documentService = {
  // Multi-file upload (all 5 documents at once)
  uploadAll: (formData) => client.post('/documents/upload-all', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Single document upload
  uploadSingle: (applicationId, documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('documentType', documentType);
    return client.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Document Retrieval
  downloadZip: () => client.get('/documents', { responseType: 'blob' }),
  getUploadedFiles: () => client.get('/documents/files'),
  downloadByType: (type) => client.get(`/documents/${type}`, { responseType: 'blob' }),

  // My documents (alternate)
  getMyUploads: () => client.get('/documents/me'),

  // Admin document access
  getApplicationDocuments: (applicationId) => client.get(`/documents/application/${applicationId}`),
  getDocumentContent: (documentId) => client.get(`/documents/${documentId}/content`, { responseType: 'blob' }),
};

export const adminService = {
  // Application Management
  getSubmittedApplications: () => client.get('/admin/applications/all'),
  getApplicationDetails: (applicantId) => client.get(`/admin/applications/${applicantId}`),
  makeDecision: (applicantId, decision, remarks, reuploadModules) =>
    client.patch(`/admin/applications/${applicantId}/decision`, { decision, remarks, reuploadModules }),

  // Document Verification
  downloadDocumentsZip: (applicantId) =>
    client.get(`/admin/documents/${applicantId}/download`, { responseType: 'blob' }),
  verifyDocuments: (applicantId, status, remarks) =>
    client.patch(`/admin/documents/verify/${applicantId}?status=${status}&remarks=${encodeURIComponent(remarks)}`),

  // User Management (via Auth Internal)
  getAllUsers: () => client.get('/admin/users/all-users'),
  getEverybody: () => client.get('/auth/internal/users/everybody'),
  getActiveAdmins: () => client.get('/auth/internal/users/active'),
  getAllAdmins: () => client.get('/auth/internal/users/all'),
  updateUserStatus: (userId, status) => client.patch(`/auth/internal/users/${userId}/status?status=${status}`),
  promoteUser: (email) => client.post('/auth/internal/users/promote', { email }),
  demoteUser: (email) => client.post('/auth/internal/users/demote', { email }),

  // Administrative Controls
  requestHold: (applicantId) => client.post(`/admin/applicants/${applicantId}/hold-request`),
  verifyHold: (applicantId, otp, remarks) =>
    client.patch(`/admin/applicants/${applicantId}/hold-verify?otp=${otp}&remarks=${encodeURIComponent(remarks)}`),
  releaseHold: (applicantId) => client.patch(`/admin/applicants/${applicantId}/hold-release`),

  // Reporting
  getMyReport: () => client.get('/admin/reports/my'),
};

export default client;
