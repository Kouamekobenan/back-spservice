export type SuccessResponse<T = any> = {
  status: number;
  success: true;
  message: string;
  data: T;
};
export type PaginatedResponse<T = any> = {
  status: number;
  success: true;
  message: string;
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type ErrorResponse = {
  status: number;
  success: false;
  error: string;
  details?: any;
};

export type ApiResponse<T = any> =
  | SuccessResponse<T>
  | PaginatedResponse<T>
  | ErrorResponse;
