export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  presentations?: Presentation[];
  _count?: {
    chatMessages: number;
    agentTraces: number;
  };
}

export interface Presentation {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  slides?: Slide[];
  _count?: {
    slides: number;
  };
}

export interface Slide {
  id: string;
  presentationId: string;
  index: number;
  templateId?: string;
  generatedSvg?: string;
  contentJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
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
