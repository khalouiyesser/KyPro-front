import api from './client';

export interface LoginPayload          { email: string; password: string; }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string; }
export interface ForgotPasswordPayload { email: string; }
export interface ResetPasswordPayload  { email: string; token: string; newPassword: string; }

export const authApi = {
  login:          (data: LoginPayload)          => api.post('/auth/login',           data).then(r => r.data),
  getProfile:     ()                            => api.get('/auth/profile').then(r => r.data),
  changePassword: (data: ChangePasswordPayload) => api.post('/auth/change-password', data).then(r => r.data),
  forgotPassword: (data: ForgotPasswordPayload) => api.post('/auth/forgot-password', data).then(r => r.data),
  resetPassword:  (data: ResetPasswordPayload)  => api.post('/auth/reset-password',  data).then(r => r.data),
};