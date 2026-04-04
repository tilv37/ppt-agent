import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { layoutPatternsApi, uploadApi } from '../api/layoutPatterns';
import type {
  CreateLayoutPatternRequest,
  UpdateLayoutPatternRequest,
  ValidateLayoutPatternRequest,
} from '../api/layoutPatterns';

// Query keys
export const layoutPatternKeys = {
  all: ['layoutPatterns'] as const,
  lists: () => [...layoutPatternKeys.all, 'list'] as const,
  list: (filters: { category?: string; page?: number; pageSize?: number }) =>
    [...layoutPatternKeys.lists(), filters] as const,
  details: () => [...layoutPatternKeys.all, 'detail'] as const,
  detail: (id: string) => [...layoutPatternKeys.details(), id] as const,
};

// Hook to fetch layout patterns list
export function useLayoutPatterns(params?: {
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: layoutPatternKeys.list(params || {}),
    queryFn: () => layoutPatternsApi.getLayoutPatterns(params),
  });
}

// Hook to fetch a single layout pattern
export function useLayoutPattern(id: string) {
  return useQuery({
    queryKey: layoutPatternKeys.detail(id),
    queryFn: () => layoutPatternsApi.getLayoutPattern(id),
    enabled: !!id,
  });
}

// Hook to create a layout pattern
export function useCreateLayoutPattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLayoutPatternRequest) =>
      layoutPatternsApi.createLayoutPattern(data),
    onSuccess: () => {
      // Invalidate all list queries to refetch
      queryClient.invalidateQueries({ queryKey: layoutPatternKeys.lists() });
    },
  });
}

// Hook to update a layout pattern
export function useUpdateLayoutPattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLayoutPatternRequest }) =>
      layoutPatternsApi.updateLayoutPattern(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific pattern and all lists
      queryClient.invalidateQueries({ queryKey: layoutPatternKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: layoutPatternKeys.lists() });
    },
  });
}

// Hook to delete a layout pattern
export function useDeleteLayoutPattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => layoutPatternsApi.deleteLayoutPattern(id),
    onSuccess: () => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: layoutPatternKeys.lists() });
    },
  });
}

// Hook to validate a layout pattern
export function useValidateLayoutPattern() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ValidateLayoutPatternRequest }) =>
      layoutPatternsApi.validateLayoutPattern(id, data),
  });
}

// Hook to upload an image
export function useUploadLayoutImage() {
  return useMutation({
    mutationFn: (file: File) => uploadApi.uploadLayoutImage(file),
  });
}
