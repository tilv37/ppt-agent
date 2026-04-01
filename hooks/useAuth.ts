import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setAuth } = require("@/store/authStore").useAuthStore();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      return response;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { setAuth } = require("@/store/authStore").useAuthStore();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = require("@/store/authStore").useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => api.get<User>("/users/me"),
    retry: false,
  });
}
