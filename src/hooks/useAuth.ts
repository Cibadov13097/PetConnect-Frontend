import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface User {
  id?: string;
  email: string;
  fullname?: string;
  userName?: string;
  role?: string;
  budget?: number;
  name?: string; // Added to handle backend responses with 'name'
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth", // açarın adı
      storage: {
        getItem: (name) => {
          const item = sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);

// Login funksiyası
export async function login(email: string, password: string) {
  try {
    const response = await axios.post<{ success: boolean; token: string; user: any }>("/api/account/login", { email, password });
    let { token, user } = response.data;

    // Əgər user.name varsa, onu userName kimi əlavə et
    if (user.name && !user.userName) {
      user.userName = user.name;
    }

    useAuth.getState().setAuth(user, token);

    // Token-i ayrıca sessionStorage-da saxla
    sessionStorage.setItem("token", token);
  } catch (error) {
    console.error("Login failed:", error);
  }
}
