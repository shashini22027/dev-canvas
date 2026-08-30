import { create } from 'zustand';

const safeSessionStorage = {
  getItem: (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Ignore storage write failures in restricted browser contexts.
    }
  },
  removeItem: (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage removal failures in restricted browser contexts.
    }
  },
};

const useAuthStore = create((set) => ({
  user: null,
  token: safeSessionStorage.getItem('token') || null,
  isAuthenticated: !!safeSessionStorage.getItem('token'),
  loading: true,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      safeSessionStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    } else {
      safeSessionStorage.removeItem('token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },
  setLoading: (loading) => set({ loading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  resetAuth: () => {
    safeSessionStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, loading: false });
  }
}));

export default useAuthStore;
