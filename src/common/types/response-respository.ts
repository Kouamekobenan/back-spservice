
export type PaginatedResponseRepository<T = any> = {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type ErrorResponse = {
  error: string;
  details?: any;
};

export type ApiResponse<T = any> =
  | PaginatedResponseRepository<T>
  | ErrorResponse;
