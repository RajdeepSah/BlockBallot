import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; userId?: string; devOTP?: string }>;
  verify2FA: (userId: string, otp: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  resendOTP: (userId: string) => Promise<string>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    
    if (response.requires2FA) {
      // Store temporary token
      setToken(response.accessToken);
      localStorage.setItem('tempToken', response.accessToken);
      return { 
        requires2FA: true, 
        userId: response.userId,
        devOTP: response.devOTP 
      };
    }

    return { requires2FA: false };
  };

  const verify2FA = async (userId: string, otp: string) => {
    const response = await api.verify2FA({ userId, otp });
    
    const tempToken = localStorage.getItem('tempToken');
    if (tempToken) {
      setToken(tempToken);
      setUser(response.user);
      localStorage.setItem('accessToken', tempToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.removeItem('tempToken');
    }
  };

  const register = async (data: any) => {
    await api.register(data);
  };

  const resendOTP = async (userId: string) => {
    const response = await api.resendOTP({ userId });
    return response.devOTP;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
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
