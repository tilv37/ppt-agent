import { useAuthStore } from "@/store/authStore";

const API_BASE = "/api/v1";

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    if (!response.ok || !data.success) {
      const error: ApiError = data;
      throw new Error(error.error?.message || "An error occurred");
    }
    return data.data;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async postFormData<T>(endpoint: string, body: FormData): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers,
      body,
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
