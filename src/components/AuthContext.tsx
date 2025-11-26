"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getValidAccessToken, isTokenExpired } from '../utils/auth/tokenRefresh';
import { handleUnauthorizedError } from '../utils/auth/errorHandler';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; userId?: string; email?: string }>;
  verify2FA: (email: string, otp: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  resendOTP: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        if (isTokenExpired(storedToken)) {
          try {
            const refreshedToken = await getValidAccessToken();
            if (refreshedToken) {
              setToken(refreshedToken);
              setUser(JSON.parse(storedUser));
            } else {
              handleUnauthorizedError(false);
            }
          } catch {
            handleUnauthorizedError(false);
          }
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    
    if (response.requires2FA) {
      setToken(response.accessToken);
      localStorage.setItem('tempToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('tempRefreshToken', response.refreshToken);
      }
      return { 
        requires2FA: true, 
        userId: response.userId,
        email
      };
    }

    return { requires2FA: false };
  };

  const verify2FA = async (email: string, otp: string) => {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || '2FA verification failed');
    }

    const tempToken = localStorage.getItem('tempToken');
    const tempRefreshToken = localStorage.getItem('tempRefreshToken');
    if (tempToken) {
      const me = await api.getMe(tempToken);
      setToken(tempToken);
      setUser(me.user);
      localStorage.setItem('accessToken', tempToken);
      if (tempRefreshToken) {
        localStorage.setItem('refreshToken', tempRefreshToken);
      }
      localStorage.setItem('user', JSON.stringify(me.user));
      localStorage.removeItem('tempToken');
      localStorage.removeItem('tempRefreshToken');
    }
  };

  const register = async (data: any) => {
    await api.register(data);
  };

  const resendOTP = async (email: string) => {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification code');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('tempRefreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, verify2FA, register, logout, resendOTP, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
