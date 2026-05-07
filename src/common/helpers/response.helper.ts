// src/common/helpers/response.helper.ts
import { HttpStatus } from '@nestjs/common';
import { ErrorResponse, PaginatedResponse, SuccessResponse } from '../types/response-controller.type';
export class ResponseHelper {
  static success<T>(
    data: T,
    message = 'Success',
    status = HttpStatus.OK,
  ): SuccessResponse<T> {
    return {
      status,
      success: true,
      message,
      data,
    };
  }
  static paginated<T>( data: T[], total: number, page: number, limit: number, message = 'Success', status = HttpStatus.OK,): PaginatedResponse<T> {
    return {
      status,
      success: true,
      message,
      data,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }
  static error(error: string,status = HttpStatus.BAD_REQUEST, details?: any,): ErrorResponse {
    return {
      status,
      success: false,
      error,
      ...(details && { details }),
    };
  }
}
