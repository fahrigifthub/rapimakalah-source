import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/auth/me')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    onUnauthorized(() => setUser(null));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post('/auth/register', payload);
    setUser(data.user);
    return data.user;
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const data = await api.post('/auth/google', { credential });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await api.patch('/auth/profile', payload);
    setUser((current) => ({ ...data.user, hasPassword: current?.hasPassword ?? data.user.hasPassword }));
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, googleLogin, logout, updateProfile, setUser }),
    [user, loading, login, register, googleLogin, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return context;
}
