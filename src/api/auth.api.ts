import api from './client';

export interface LoginPayload { email: string; password: string; }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string; }

export const authApi = {
  login: (data: LoginPayload) => api.post('/auth/login', data).then(r => r.data),
  getProfile: () => api.get('/auth/profile').then(r => r.data),
  changePassword: (data: ChangePasswordPayload) => api.post('/auth/change-password', data).then(r => r.data),
};
