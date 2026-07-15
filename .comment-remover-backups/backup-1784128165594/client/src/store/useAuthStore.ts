import { create } from "zustand";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  languages?: string[];
  favourites?: string[];
  likes?: any[];
  followers?: any[];
  follows?: any[];
  views?: any[];
}

interface UserStore {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false, error: null }),
}));
