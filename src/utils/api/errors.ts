/**
 * @module utils/api/errors
 * @category Error Handling
 *
 * Standardized API error handling utilities for Next.js API routes.
 *
 * This module provides functions to create consistent error responses across
 * all API endpoints. All error responses follow the same structure:
 * ```json
 * {
 *   "error": "Error message",
 *   "details": "Optional details",
 *   "message": "Backward compatibility field"
 * }
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { createValidationError, handleApiError } from '@/utils/api/errors';
 *
 * // Create specific error responses
 * if (!data) {
 *   return createValidationError('Missing required field');
 * }
 *
 * // Handle unexpected errors
 * try {
 *   // ... operation
 * } catch (error) {
 *   return handleApiError(error, 'endpoint-name');
 * }
 * ```
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: string;
  details?: string;
  message?: string; // For backward compatibility
}

/**
 * Creates a standardized error response with custom status code.
 *
 * This is the base function for creating error responses. Other functions
 * in this module are convenience wrappers that set specific status codes.
 *
 * @param error - Error message to return to the client
 * @param status - HTTP status code (default: `500`)
 * @param details - Optional additional error details (e.g., stack trace, error code)
 * @returns NextResponse with standardized error JSON
 *
 * @example
 * ```typescript
 * return createErrorResponse('Custom error', 418, 'Additional context');
 * ```
 *
 * @see {@link createValidationError} for 400 errors
 * @see {@link createNotFoundError} for 404 errors
 * @see {@link createUnauthorizedError} for 401 errors
 * @see {@link createForbiddenError} for 403 errors
 * @category Error Handling
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
 *
 * Extracts meaningful error messages from various error types including:
 * - Standard JavaScript `Error` objects
 * - String error messages
 * - ethers.js error objects (extracts `reason` or `message`)
 * - Generic error objects
 *
 * Automatically logs errors to console with optional context. Always returns
 * a 500 status code (use specific error functions for other status codes).
 *
 * @param error - The error to handle (can be `Error`, `string`, or `object`)
 * @param context - Optional context string for logging (e.g., endpoint name like `'vote'`, `'deploy'`)
 * @returns NextResponse with standardized error JSON and 500 status
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   return handleApiError(error, 'vote-endpoint');
 *   // Logs: "API Error in vote-endpoint: ..."
 * }
 * ```
 *
 * @see {@link createErrorResponse} for custom status codes
 * @category Error Handling
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
 * Use this when request data fails validation (missing fields, invalid format, etc.).
 *
 * @param message - Validation error message describing what failed validation
 * @returns NextResponse with 400 status and error message
 *
 * @example
 * ```typescript
 * if (!email || !isValidEmail(email)) {
 *   return createValidationError('Invalid email address');
 * }
 * ```
 *
 * @category Error Handling
 */
export function createValidationError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400);
}

/**
 * Creates a not found error response (404 status).
 *
 * Use this when a requested resource (election, user, etc.) doesn't exist.
 *
 * @param resource - Name of the resource that was not found (e.g., `'Election'`, `'User'`, `'User data'`)
 * @returns NextResponse with 404 status and error message in format: `"{resource} not found"`
 *
 * @example
 * ```typescript
 * const election = await getElection(id);
 * if (!election) {
 *   return createNotFoundError('Election');
 *   // Returns: { error: "Election not found" }
 * }
 * ```
 *
 * @category Error Handling
 */
export function createNotFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource} not found`, 404);
}

/**
 * Creates an unauthorized error response (401 status).
 *
 * Use this when authentication is required but missing or invalid.
 *
 * @returns NextResponse with 401 status and "Unauthorized" message
 *
 * @example
 * ```typescript
 * if (!authHeader || !isValidToken(authHeader)) {
 *   return createUnauthorizedError();
 * }
 * ```
 *
 * @see {@link createForbiddenError} for when user is authenticated but lacks permission
 * @category Error Handling
 */
export function createUnauthorizedError(): NextResponse<ApiErrorResponse> {
  return createErrorResponse('Unauthorized', 401);
}

/**
 * Creates a forbidden error response (403 status).
 *
 * Use this when the user is authenticated but lacks permission to perform
 * the requested action (e.g., not eligible to vote, not election admin).
 *
 * @param message - Forbidden error message (default: `"Forbidden"`)
 * @returns NextResponse with 403 status and error message
 *
 * @example
 * ```typescript
 * if (!isEligible(user, election)) {
 *   return createForbiddenError('You are not eligible to vote in this election');
 * }
 * ```
 *
 * @see {@link createUnauthorizedError} for when authentication is missing
 * @category Error Handling
 */
export function createForbiddenError(
  message: string = 'Forbidden'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 403);
}

/**
 * Creates a bad request error response (400 status).
 *
 * Use this for general client errors that aren't validation-specific
 * (e.g., election hasn't started, election has ended, business logic violations).
 *
 * @param message - Bad request error message describing the issue
 * @returns NextResponse with 400 status and error message
 *
 * @example
 * ```typescript
 * if (now < election.startsAt) {
 *   return createBadRequestError('Election has not started yet');
 * }
 * ```
 *
 * @see {@link createValidationError} for data validation errors
 * @category Error Handling
 */
export function createBadRequestError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400);
}
