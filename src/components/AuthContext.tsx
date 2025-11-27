"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { RegisterData } from '@/types/api';

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
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  resendOTP: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider component that manages authentication state and provides auth methods.
 * Handles user login, registration, 2FA verification, and session management.
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap with auth context
 * @returns Auth context provider
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth state from localStorage:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    
    if (response.requires2FA) {
      setToken(response.accessToken);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('tempToken', response.accessToken);
        }
      } catch (error) {
        console.error('Error storing temp token:', error);
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

   let tempToken: string | null = null;
   try {
     if (typeof window !== 'undefined') {
       tempToken = localStorage.getItem('tempToken');
     }
   } catch (error) {
     console.error('Error reading temp token:', error);
   }

   if (tempToken) {
     const me = await fetch('/api/auth/me', {
        headers: {
           'Authorization': `Bearer ${tempToken}`
        }
     });
     
     if (!me.ok) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('tempToken');
          }
        } catch (error) {
          console.error('Error removing temp token:', error);
        }
        return;
     }
     
     const { user } = await me.json();
     setToken(tempToken);
     setUser(user);
     try {
       if (typeof window !== 'undefined') {
         localStorage.setItem('accessToken', tempToken);
         localStorage.setItem('user', JSON.stringify(user));
         localStorage.removeItem('tempToken');
       }
     } catch (error) {
       console.error('Error storing auth data:', error);
     }
   }
  };

  const register = async (data: RegisterData) => {
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
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tempToken');
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, verify2FA, register, logout, resendOTP, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context.
 * 
 * @returns Authentication context with user, token, and auth methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
