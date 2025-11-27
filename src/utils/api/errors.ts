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
 * Handles errors and returns a standardized error response.
 * Extracts meaningful error messages from various error types including ethers.js errors.
 * 
 * @param error - The error to handle (can be Error, string, or object)
 * @param context - Optional context string for logging (e.g., endpoint name)
 * @returns NextResponse with standardized error JSON
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
    // Type guard for ethers.js and similar error objects
    const err = error as Record<string, unknown>;
    
    // Handle ethers.js errors
    if (typeof err.reason === 'string') {
      errorMessage = err.reason; // Contract require() messages
    } else if (typeof err.message === 'string') {
      errorMessage = err.message;
    }
    
    if (typeof err.code === 'string' || typeof err.code === 'number') {
      details = `Error code: ${err.code}`;
    }
  }

  return createErrorResponse(errorMessage, 500, details);
}

/**
 * Creates a validation error response (400 status).
 * 
 * @param message - Validation error message
 * @returns NextResponse with 400 status and error message
 */
export function createValidationError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400);
}

/**
 * Creates a not found error response (404 status).
 * 
 * @param resource - Name of the resource that was not found
 * @returns NextResponse with 404 status and error message
 */
export function createNotFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404);
}

/**
 * Creates an unauthorized error response (401 status).
 * 
 * @returns NextResponse with 401 status and "Unauthorized" message
 */
export function createUnauthorizedError(): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Unauthorized', 401);
}

/**
 * Creates a forbidden error response (403 status).
 * 
 * @param message - Forbidden error message (default: "Forbidden")
 * @returns NextResponse with 403 status and error message
 */
export function createForbiddenError(message: string = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 403);
}

/**
 * Creates a bad request error response (400 status).
 * 
 * @param message - Bad request error message
 * @returns NextResponse with 400 status and error message
 */
export function createBadRequestError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400);
}

