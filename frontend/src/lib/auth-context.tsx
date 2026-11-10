"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, AuthTokens, authApi, LoginPayload, RegisterPayload } from "@/lib/api/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthTokens>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("medinex_access_token") : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        console.warn("Session expired or invalid, clearing local tokens", err);
        if (typeof window !== "undefined") {
          localStorage.removeItem("medinex_access_token");
          localStorage.removeItem("medinex_refresh_token");
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthTokens> => {
    setIsLoading(true);
    try {
      const tokens = await authApi.login(payload);
      if (typeof window !== "undefined") {
        localStorage.setItem("medinex_access_token", tokens.accessToken);
        localStorage.setItem("medinex_refresh_token", tokens.refreshToken);
      }
      setUser(tokens.user);
      return tokens;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const newUser = await authApi.register(payload);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("medinex_refresh_token") : undefined;
    try {
      await authApi.logout(refreshToken || undefined);
    } catch (e) {
      console.warn("Logout request failed", e);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("medinex_access_token");
        localStorage.removeItem("medinex_refresh_token");
      }
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
