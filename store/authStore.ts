import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: { id: string; email: string; name: string } | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: { id: string; email: string; name: string }) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
