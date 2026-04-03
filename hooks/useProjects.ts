import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";

export interface Slide {
  id: string;
  presentationId: string;
  index: number;
  templateId: string | null;
  generatedSvg: string | null;
  contentJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationListItem {
  id: string;
  title: string;
  _count: { slides: number };
}

export interface Presentation {
  id: string;
  projectId: string;
  title: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  presentations?: PresentationListItem[];
  _count?: { chatMessages: number; agentTraces: number };
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  presentations?: Presentation[];
  _count?: { chatMessages: number; agentTraces: number };
}

export function useProjects() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<ProjectListItem[]>("/projects"),
    enabled: !!token,
  });
}

export function useProject(id: string) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id && !!token,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return api.post<Project>("/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string }) => {
      return api.patch<Project>(`/projects/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
