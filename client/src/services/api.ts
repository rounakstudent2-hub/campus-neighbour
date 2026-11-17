const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || `Request failed with status ${response.status}`, response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (credentials: { email: string; password: string }) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (payload: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadAvatar: (imageData: string) => request<any>('/auth/upload-avatar', { method: 'POST', body: JSON.stringify({ imageData }) }),
  getStudentProfile: (id: string) => request<any>(`/auth/students/${id}`),
  getDemoAccounts: () => request<any>('/auth/demo-accounts'),

  // Categories & Tasks
  getCategories: () => request<any>('/tasks/categories'),
  getTasks: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    return request<any>(`/tasks?${searchParams.toString()}`);
  },
  getTaskById: (id: string) => request<any>(`/tasks/${id}`),
  createTask: (payload: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  assignTask: (id: string, payload: { studentId: string; agreedFee?: number }) => request<any>(`/tasks/${id}/assign`, { method: 'POST', body: JSON.stringify(payload) }),
  startTask: (id: string) => request<any>(`/tasks/${id}/start`, { method: 'POST' }),
  completeTask: (id: string, completionProof?: string) => request<any>(`/tasks/${id}/complete`, { method: 'POST', body: JSON.stringify({ completionProof }) }),
  confirmTaskCompletion: (id: string) => request<any>(`/tasks/${id}/confirm`, { method: 'POST' }),
  cancelTask: (id: string, reason?: string) => request<any>(`/tasks/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Applications
  applyForTask: (payload: { taskId: string; proposedFee: number; pitchNote?: string }) => request<any>('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  getMyApplications: () => request<any>('/applications/my-applications'),
  withdrawApplication: (id: string) => request<any>(`/applications/${id}`, { method: 'DELETE' }),

  // Messages & Conversations
  getConversations: () => request<any>('/messages/conversations'),
  getConversationMessages: (id: string) => request<any>(`/messages/conversation/${id}`),
  sendMessage: (payload: { conversationId?: string; taskId?: string; recipientId?: string; messageText: string }) => request<any>('/messages', { method: 'POST', body: JSON.stringify(payload) }),

  // Payments
  getPaymentHistory: () => request<any>('/payments/history'),
  createPaymentOrder: (taskId: string, amount?: number) => request<any>('/payments/create-order', { method: 'POST', body: JSON.stringify({ taskId, amount }) }),
  verifyPayment: (payload: any) => request<any>('/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),

  // Reviews
  submitReview: (payload: { taskId: string; revieweeId: string; rating: number; comment?: string }) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getTaskReviews: (taskId: string) => request<any>(`/reviews/task/${taskId}`),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // Reports
  submitReport: (payload: { reportedUserId?: string; taskId?: string; reason: string; details?: string }) => request<any>('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  getMyReports: () => request<any>('/reports/my'),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminUsers: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.append(k, String(v));
    });
    return request<any>(`/admin/users?${searchParams.toString()}`);
  },
  updateUserStatus: (id: string, payload: { isActive?: boolean; isVerified?: boolean }) => request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAdminTasks: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') searchParams.append(k, String(v));
    });
    return request<any>(`/admin/tasks?${searchParams.toString()}`);
  },
  updateTaskAdminStatus: (id: string, status: string) => request<any>(`/admin/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminReports: () => request<any>('/admin/reports'),
  updateAdminReport: (id: string, payload: { status: string; adminNotes?: string }) => request<any>(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAdminCategories: () => request<any>('/admin/categories'),
  createAdminCategory: (payload: any) => request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateAdminCategory: (id: string, payload: any) => request<any>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
};
