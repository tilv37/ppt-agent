export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function apiResponse<T>(data: T, statusCode: number = 200): Response {
  return Response.json({ success: true, data }, { status: statusCode });
}

export function created<T>(data: T): Response {
  return apiResponse(data, 201);
}

export function ok<T>(data: T): Response {
  return apiResponse(data, 200);
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): Response {
  return Response.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
