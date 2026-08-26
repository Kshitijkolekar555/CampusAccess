import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const normalizeRole = (role: UserRole): UserRole => {
  return role === 'GUARD' ? 'SECURITY_GUARD' : role;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) => {
        const normalizedUser = user
          ? { ...user, role: normalizeRole(user.role) }
          : user;
        set({
          user: normalizedUser,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setTokens: (token, refreshToken) =>
        set({
          token,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) => {
        const normalizedUser = user
          ? { ...user, role: normalizeRole(user.role) }
          : user;
        set({ user: normalizedUser });
      },

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'campus-access-auth',
    }
  )
);
