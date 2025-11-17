/**
 * Standardized API error handling utilities
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: string;
  details?: string;
  message?: string; // For backward compatibility
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error };
  
  if (details) {
    response.details = details;
  }
  
  // Include message for backward compatibility
  response.message = error;

  return NextResponse.json(response, { status });
}

/**
 * Handle errors and return standardized response
 * Extracts meaningful error messages from various error types
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

  let errorMessage = 'An unknown error occurred';
  let details: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    details = error.stack;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    const err = error as any;
    
    // Handle ethers.js errors
    if (err.reason) {
      errorMessage = err.reason; // Contract require() messages
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    if (err.code) {
      details = `Error code: ${err.code}`;
    }
  }

  return createErrorResponse(errorMessage, 500, details);
}

/**
 * Create validation error response
 */
export function createValidationError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400);
}

/**
 * Create not found error response
 */
export function createNotFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404);
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedError(): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Unauthorized', 401);
}

