import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  mustChangePassword: boolean;
  theme: string;
  primaryColor: string;
  businessName: string;
  ocrAttemptsLeft: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialisation authentication au refresh
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('erp_user');
      const storedToken = localStorage.getItem('erp_token');

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (error) {
          console.error("Auth init error", error);
          logout();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    try {
      const data = await authApi.login({ email, password });

      localStorage.setItem('erp_token', data.access_token);
      localStorage.setItem('erp_user', JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);

      return data.user;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');

    setToken(null);
    setUser(null);
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updated = { ...prev, ...data };
      localStorage.setItem('erp_user', JSON.stringify(updated));

      return updated;
    });
  }, []);

  return (
      <AuthContext.Provider
          value={{
            user,
            token,
            isLoading,
            isAuthenticated: !!token,
            login,
            logout,
            updateUser
          }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};