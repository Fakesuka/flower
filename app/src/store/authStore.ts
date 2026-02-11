import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { http } from '@/lib/http';
import type { StaffUser } from '@/types/api';

interface AuthState {
  token: string | null;
  user: StaffUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (username, password) => {
        const data = await http<{ token: string; user: StaffUser }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        set({ token: data.token, user: data.user });
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'staff-auth' }
  )
);
