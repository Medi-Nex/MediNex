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
  isVerifiedContributor?: boolean;
  headline?: string | null;
  designation?: string | null;
  department?: string | null;
  university?: string | null;
  bio?: string | null;
  skills?: string[];
  responsibilities?: string[];
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  avatarSmUrl?: string | null;
  avatarLgUrl?: string | null;
  coverImageUrl?: string | null;
  roles: string[];
  createdAt: string;
}

export type PublicUserProfile = Omit<AuthUser, "email"> & {
  email?: string | null;
};

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

export interface UsernameAvailabilityResult {
  username: string;
  valid: boolean;
  available: boolean;
  current: boolean;
  reason: "OK" | "CURRENT_USERNAME" | "INVALID_FORMAT" | "RESERVED" | "TAKEN" | string;
  message: string;
  profilePath: string | null;
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

  verifyEmail: (email: string, otp: string) =>
    apiClient<void>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
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

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiClient<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  getMe: () => apiClient<AuthUser>("/auth/me"),

  getPublicProfile: (username: string) =>
    apiClient<PublicUserProfile>(`/users/${encodeURIComponent(username)}`),

  checkUsernameAvailability: (username: string, email?: string) => {
    const params = new URLSearchParams({ username });
    if (email && email.trim()) {
      params.set("email", email.trim());
    }
    return apiClient<UsernameAvailabilityResult>(
      `/users/username-availability?${params.toString()}`
    );
  },

  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient<AuthUser>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateUsername: (username: string) =>
    apiClient<AuthUser>("/users/profile/username", {
      method: "PUT",
      body: JSON.stringify({ username }),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient<AuthUser>("/users/profile/avatar", {
      method: "POST",
      body: formData,
    });
  },

  removeAvatar: () =>
    apiClient<AuthUser>("/users/profile/avatar", {
      method: "DELETE",
    }),

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient<AuthUser>("/users/profile/banner", {
      method: "POST",
      body: formData,
    });
  },

  removeBanner: () =>
    apiClient<AuthUser>("/users/profile/banner", {
      method: "DELETE",
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
