import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'));
  // If we have cached user/token, skip initial loading state for instant render
  const [loading, setLoading] = useState(() => {
    const hasToken = localStorage.getItem('sf_token');
    const hasUser = localStorage.getItem('sf_user');
    // Only show loading if there's a token but no cached user
    return !!(hasToken && !hasUser);
  });

  // Verify token in background (non-blocking)
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('sf_user', JSON.stringify(res.data.user));
        } catch {
          // Token invalid, clear auth state
          logout();
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sf_token', newToken);
    localStorage.setItem('sf_user', JSON.stringify(newUser));
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  const verifyRegister = async (email, otp) => {
    const res = await api.post('/auth/register/verify', { email, otp });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sf_token', newToken);
    localStorage.setItem('sf_user', JSON.stringify(newUser));
    return res.data;
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sf_token', newToken);
    localStorage.setItem('sf_user', JSON.stringify(newUser));
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    const updatedUser = res.data.user;
    setUser(updatedUser);
    localStorage.setItem('sf_user', JSON.stringify(updatedUser));
    return res.data;
  };

  const updateSecurity = async (data) => {
    const res = await api.put('/auth/security', data);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, verifyRegister, logout, updateProfile, updateSecurity, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
