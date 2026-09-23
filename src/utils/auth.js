// src/utils/auth.js

const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';

// ─── Token helpers ───────────────────────────────────────────
export const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ─── User helpers ────────────────────────────────────────────
export const setUser = (user) => {
  if (!user) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Auth check (used by ProtectedRoute) ─────────────────────
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Check if the token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeToken();
      return false;
    }
    return true;
  } catch {
    // Malformed token → treat as unauthenticated
    return false;
  }
};

// ─── Logout ──────────────────────────────────────────────────
export const logout = () => {
  removeToken();
  window.location.href = '/login';
};
