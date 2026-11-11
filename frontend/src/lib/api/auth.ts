import { apiClient } from "./client";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETED";
  emailVerified: boolean;
  isTeamMember: boolean;
  isPublicVisible?: boolean;
  roles: string[];
  createdAt: string;
}

export type UserDto = AuthUser;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  agreeTerms: boolean;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  headline?: string;
  designation?: string;
  department?: string;
  university?: string;
  bio?: string;
  skills?: string[];
  responsibilities?: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isPublicVisible?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    apiClient<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refresh: (refreshToken: string) =>
    apiClient<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken?: string) =>
    apiClient<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  verifyEmail: (token: string) =>
    apiClient<void>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    apiClient<void>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    apiClient<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  getMe: () => apiClient<AuthUser>("/auth/me"),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient<AuthUser>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
