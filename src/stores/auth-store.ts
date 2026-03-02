import { create } from "zustand";
import type { UserResponse } from "@/lib/api/types";
import { fetchMe } from "@/lib/api/auth";

let _fetchController: AbortController | null = null;

interface AuthState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  isAdmin: () => boolean;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    _fetchController?.abort();
    const controller = new AbortController();
    _fetchController = controller;

    try {
      set({ isLoading: true });
      const user = await fetchMe({ signal: controller.signal });
      if (controller.signal.aborted) return;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === "admin";
  },

  logout: async () => {
    set({ user: null, isAuthenticated: false });
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/login" });
  },

  reset: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
