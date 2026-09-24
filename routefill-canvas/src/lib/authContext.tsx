import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserProfile } from './api';

interface AuthContextType {
  user: UserProfile | null;
  role: 'FLEET_OWNER' | 'ADMIN' | 'SHIPPER';
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const token = api.getToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          return;
        } catch {
          // Token expired or invalid, clear it
          api.setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Authentication initialization failed:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      api.setToken(null);
      setUser(null);
    };

    window.addEventListener('routefill:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('routefill:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password = 'password123'): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const rawRole = (user?.roles && user.roles[0]) || user?.role;
  const effectiveRole: 'FLEET_OWNER' | 'ADMIN' | 'SHIPPER' =
    rawRole === 'ADMIN'
      ? 'ADMIN'
      : rawRole === 'LOAD_POSTER' || rawRole === 'SHIPPER'
      ? 'SHIPPER'
      : 'FLEET_OWNER';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: effectiveRole,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
