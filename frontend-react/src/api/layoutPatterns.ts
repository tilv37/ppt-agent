import apiClient from './client';

// Types
export interface LayoutPattern {
  id: string;
  name: string;
  description?: string;
  category: 'content' | 'cover' | 'section' | 'conclusion';
  imageUrl?: string;
  patternJson: string;
  createdBy: 'ai' | 'manual';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLayoutPatternRequest {
  mode: 'ai' | 'manual';
  name: string;
  description?: string;
  category: 'content' | 'cover' | 'section' | 'conclusion';
  imageUrl?: string;
  userPrompt?: string;
  patternJson?: string;
}

export interface UpdateLayoutPatternRequest {
  name?: string;
  description?: string;
  category?: string;
  patternJson?: string;
}

export interface ValidateLayoutPatternRequest {
  patternJson: string;
  userFeedback?: string;
}

export interface ValidationResult {
  valid: boolean;
  correctedDsl: string;
  issues: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  suggestions?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// API functions
export const layoutPatternsApi = {
  // Get all layout patterns with optional filters
  getLayoutPatterns: async (params?: {
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<LayoutPattern>> => {
    const response = await apiClient.get<PaginatedResponse<LayoutPattern>>('/layout-patterns', {
      params,
    });
    return response.data;
  },

  // Get a single layout pattern by ID
  getLayoutPattern: async (id: string): Promise<ApiResponse<LayoutPattern>> => {
    const response = await apiClient.get<ApiResponse<LayoutPattern>>(`/layout-patterns/${id}`);
    return response.data;
  },

  // Create a new layout pattern
  createLayoutPattern: async (
    data: CreateLayoutPatternRequest
  ): Promise<ApiResponse<LayoutPattern>> => {
    const response = await apiClient.post<ApiResponse<LayoutPattern>>('/layout-patterns', data);
    return response.data;
  },

  // Update a layout pattern
  updateLayoutPattern: async (
    id: string,
    data: UpdateLayoutPatternRequest
  ): Promise<ApiResponse<LayoutPattern>> => {
    const response = await apiClient.patch<ApiResponse<LayoutPattern>>(
      `/layout-patterns/${id}`,
      data
    );
    return response.data;
  },

  // Delete a layout pattern
  deleteLayoutPattern: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/layout-patterns/${id}`
    );
    return response.data;
  },

  // Validate and correct a layout pattern
  validateLayoutPattern: async (
    id: string,
    data: ValidateLayoutPatternRequest
  ): Promise<ApiResponse<ValidationResult>> => {
    const response = await apiClient.post<ApiResponse<ValidationResult>>(
      `/layout-patterns/${id}/validate`,
      data
    );
    return response.data;
  },
};

// Upload API
export const uploadApi = {
  // Upload a layout reference image
  uploadLayoutImage: async (file: File): Promise<ApiResponse<{
    url: string;
    filename: string;
    size: number;
  }>> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<ApiResponse<{
      url: string;
      filename: string;
      size: number;
    }>>('/uploads/layout-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
