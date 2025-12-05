/**
 * @module utils/validation
 * @category Validation
 *
 * Validation utilities for blockchain operations and election data.
 *
 * This module provides comprehensive validation functions for:
 * - Ethereum contract addresses
 * - Vote inputs and arrays
 * - Position and candidate data
 * - Input sanitization
 * - Duplicate detection
 *
 * All validation functions throw descriptive errors when validation fails,
 * making them suitable for use in API routes and form validation.
 *
 * ## Usage
 *
 * ```typescript
 * import { validateContractAddress, validateVotesArray } from '@/utils/validation';
 *
 * // Validate contract address
 * validateContractAddress('0x1234...');
 *
 * // Validate votes before submission
 * validateVotesArray(votes);
 * ```
 */

import { isAddress } from 'ethers';
import type { VoteInput, PositionInput } from '@/types/blockchain';

/**
 * Validates that a string is a valid Ethereum address format.
 *
 * Uses ethers.js `isAddress` function to verify the address follows the
 * Ethereum address format (0x followed by 40 hexadecimal characters).
 *
 * @param address - The address string to validate (must be checksummed or lowercase)
 * @throws {Error} If address is missing, not a string, or invalid format
 *
 * @example
 * ```typescript
 * // Valid address
 * validateContractAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 *
 * // Invalid - will throw
 * try {
 *   validateContractAddress('invalid-address');
 * } catch (error) {
 *   console.error(error.message); // "Invalid contract address format: invalid-address"
 * }
 * ```
 *
 * @see {@link validateVotesArray} to validate vote data
 * @category Validation
 */
export function validateContractAddress(address: string): void {
  if (!address || typeof address !== 'string') {
    throw new Error('Contract address is required and must be a string');
  }

  if (!isAddress(address)) {
    throw new Error(`Invalid contract address format: ${address}`);
  }
}

/**
 * Validates that a vote input has the required position and candidate fields.
 *
 * Ensures a vote object contains both `position` and `candidate` as non-empty strings.
 * This is the basic validation for a single vote before it can be submitted to the blockchain.
 *
 * @param vote - The vote input object to validate
 * @param vote.position - Position name (must be non-empty string)
 * @param vote.candidate - Candidate name (must be non-empty string)
 * @throws {Error} If vote is missing position or candidate, or if they are not strings
 *
 * @example
 * ```typescript
 * // Valid vote
 * validateVoteInput({ position: 'President', candidate: 'John Doe' });
 *
 * // Invalid - missing candidate
 * try {
 *   validateVoteInput({ position: 'President' });
 * } catch (error) {
 *   console.error(error.message); // "Vote must have a 'candidate' (string)"
 * }
 * ```
 *
 * @see {@link validateVotesArray} to validate multiple votes
 * @category Validation
 */
export function validateVoteInput(vote: VoteInput): void {
  if (!vote.position || typeof vote.position !== 'string') {
    throw new Error("Vote must have a 'position' (string)");
  }

  if (!vote.candidate || typeof vote.candidate !== 'string') {
    throw new Error("Vote must have a 'candidate' (string)");
  }
}

/**
 * Validates an array of vote inputs, ensuring all votes are valid.
 *
 * Validates that the array is non-empty and that each vote in the array
 * passes individual vote validation. Provides detailed error messages
 * indicating which vote (by index) failed validation.
 *
 * @param votes - Array of vote inputs to validate (must be non-empty)
 * @throws {Error} If array is empty, not an array, or any vote is invalid
 *
 * @example
 * ```typescript
 * // Valid votes array
 * validateVotesArray([
 *   { position: 'President', candidate: 'John Doe' },
 *   { position: 'Vice President', candidate: 'Jane Smith' }
 * ]);
 *
 * // Invalid - empty array
 * try {
 *   validateVotesArray([]);
 * } catch (error) {
 *   console.error(error.message); // "At least one vote is required"
 * }
 *
 * // Invalid - one vote has missing candidate
 * try {
 *   validateVotesArray([
 *     { position: 'President', candidate: 'John Doe' },
 *     { position: 'Vice President' } // Missing candidate
 *   ]);
 * } catch (error) {
 *   console.error(error.message); // "Vote at index 1 is invalid: Vote must have a 'candidate' (string)"
 * }
 * ```
 *
 * @see {@link validateVoteInput} for individual vote validation
 * @see {@link validateContractAddress} to validate contract address
 * @category Validation
 */
export function validateVotesArray(votes: VoteInput[]): void {
  if (!Array.isArray(votes) || votes.length === 0) {
    throw new Error('At least one vote is required');
  }

  votes.forEach((vote, index) => {
    try {
      validateVoteInput(vote);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Vote at index ${index} is invalid: ${message}`);
    }
  });
}

/**
 * Validates that a position input has required name and candidates.
 *
 * Ensures a position object has:
 * - A non-empty `name` string
 * - A `candidates` array with at least one candidate
 * - Each candidate has a non-empty `name` string
 *
 * @param position - The position input object to validate (must have `name` string and `candidates` array)
 * @throws {Error} If position is missing name, has no candidates, or any candidate is invalid
 *
 * @example
 * ```typescript
 * // Valid position
 * validatePositionInput({
 *   name: 'President',
 *   candidates: [
 *     { name: 'John Doe' },
 *     { name: 'Jane Smith' }
 *   ]
 * });
 *
 * // Invalid - no candidates
 * try {
 *   validatePositionInput({
 *     name: 'President',
 *     candidates: []
 *   });
 * } catch (error) {
 *   console.error(error.message); // "Position \"President\" must have at least one candidate"
 * }
 * ```
 *
 * @see {@link validatePositionsArray} to validate multiple positions
 * @category Validation
 */
export function validatePositionInput(position: PositionInput): void {
  if (!position.name || typeof position.name !== 'string') {
    throw new Error('All positions must have a name');
  }

  if (!position.candidates || !Array.isArray(position.candidates)) {
    throw new Error(`Position "${position.name}" must have a candidates array`);
  }

  if (position.candidates.length === 0) {
    throw new Error(`Position "${position.name}" must have at least one candidate`);
  }

  position.candidates.forEach((candidate, index) => {
    if (!candidate.name || typeof candidate.name !== 'string') {
      throw new Error(
        `All candidates in "${position.name}" must have a name ` +
          `(candidate at index ${index} is missing name)`
      );
    }
  });
}

/**
 * Validates an array of position inputs, ensuring all positions are valid.
 *
 * Validates that the array is non-empty and that each position in the array
 * passes individual position validation. Provides detailed error messages
 * indicating which position (by index) failed validation.
 *
 * @param positions - Array of position inputs to validate (must be non-empty)
 * @throws {Error} If array is empty, not an array, or any position is invalid
 *
 * @example
 * ```typescript
 * // Valid positions array
 * validatePositionsArray([
 *   {
 *     name: 'President',
 *     candidates: [{ name: 'John Doe' }, { name: 'Jane Smith' }]
 *   },
 *   {
 *     name: 'Vice President',
 *     candidates: [{ name: 'Bob Johnson' }]
 *   }
 * ]);
 * ```
 *
 * @see {@link validatePositionInput} for individual position validation
 * @see {@link validateNoDuplicatePositions} to check for duplicate position names
 * @category Validation
 */
export function validatePositionsArray(positions: PositionInput[]): void {
  if (!Array.isArray(positions) || positions.length === 0) {
    throw new Error('Positions array is required and must not be empty');
  }

  positions.forEach((position, index) => {
    try {
      validatePositionInput(position);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Position at index ${index} is invalid: ${message}`);
    }
  });
}

/**
 * Sanitizes a string by trimming whitespace and removing control characters.
 *
 * Preserves newlines (`\n`) and tabs (`\t`) for use in descriptions, but removes
 * other control characters that could cause issues. Returns empty string if input
 * is not a string type.
 *
 * @param input - The string to sanitize
 * @returns Sanitized string with trimmed whitespace and control characters removed, or empty string if input is not a string
 *
 * @example
 * ```typescript
 * // Removes control characters but preserves newlines
 * sanitizeString('Hello\nWorld\tTab'); // Returns: 'Hello\nWorld\tTab'
 * sanitizeString('  Hello\x00World  '); // Returns: 'HelloWorld'
 * sanitizeString(null); // Returns: '' (not a string)
 * ```
 *
 * @see {@link sanitizeText} for text sanitization that preserves more formatting
 * @category Validation
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Trim whitespace and remove null bytes and other control characters (except newlines/tabs for descriptions)
  return input.trim().replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitizes text input for descriptions, preserving newlines and tabs.
 *
 * Similar to {@link sanitizeString}, but designed specifically for longer text
 * descriptions. Removes control characters but keeps formatting characters like
 * newlines and tabs to preserve text structure.
 *
 * @param input - The text to sanitize
 * @returns Sanitized text with trimmed whitespace and control characters removed, or empty string if input is not a string
 *
 * @example
 * ```typescript
 * // Preserves formatting for descriptions
 * const description = sanitizeText('  This is a\nmulti-line\tdescription  ');
 * // Returns: 'This is a\nmulti-line\tdescription'
 * ```
 *
 * @see {@link sanitizeString} for basic string sanitization
 * @category Validation
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Trim whitespace but preserve newlines and tabs for descriptions
  return input.trim().replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
}

/**
 * Validates that a position has no duplicate candidate names.
 *
 * Checks for duplicate candidate names within a single position. Comparison is
 * case-insensitive and uses sanitized names, so "John Doe" and "john doe" would
 * be considered duplicates.
 *
 * @param position - The position to validate
 * @param position.candidates - Array of candidates to check for duplicates
 * @throws {Error} If duplicate candidate names are found (case-insensitive)
 *
 * @example
 * ```typescript
 * // Valid - no duplicates
 * validateNoDuplicateCandidates({
 *   name: 'President',
 *   candidates: [
 *     { name: 'John Doe' },
 *     { name: 'Jane Smith' }
 *   ]
 * });
 *
 * // Invalid - duplicate names (case-insensitive)
 * try {
 *   validateNoDuplicateCandidates({
 *     name: 'President',
 *     candidates: [
 *       { name: 'John Doe' },
 *       { name: 'john doe' } // Duplicate!
 *     ]
 *   });
 * } catch (error) {
 *   console.error(error.message); // "Position \"President\" has duplicate candidates: john doe"
 * }
 * ```
 *
 * @see {@link validateNoDuplicateCandidatesInPositions} to check all positions
 * @category Validation
 */
export function validateNoDuplicateCandidates(position: PositionInput): void {
  if (!position.candidates || !Array.isArray(position.candidates)) {
    return; // Will be caught by validatePositionInput
  }

  const candidateNames = position.candidates
    .map((c) => sanitizeString(c.name).toLowerCase())
    .filter((name) => name.length > 0); // Only check non-empty names

  const duplicates = candidateNames.filter((name, index) => candidateNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    throw new Error(
      `Position "${position.name}" has duplicate candidates: ${uniqueDuplicates.join(', ')}`
    );
  }
}

/**
 * Validates that all positions have no duplicate candidate names.
 *
 * Applies {@link validateNoDuplicateCandidates} to each position in the array.
 * Ensures no position has duplicate candidate names within itself.
 *
 * @param positions - Array of positions to validate
 * @throws {Error} If any position has duplicate candidates
 *
 * @see {@link validateNoDuplicateCandidates} for single position validation
 * @see {@link validateNoDuplicatePositions} to check for duplicate position names
 * @category Validation
 */
export function validateNoDuplicateCandidatesInPositions(positions: PositionInput[]): void {
  if (!Array.isArray(positions)) {
    return; // Will be caught by validatePositionsArray
  }

  positions.forEach((position) => {
    try {
      validateNoDuplicateCandidates(position);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  });
}

/**
 * Validates that there are no duplicate position names across all positions.
 *
 * Checks for duplicate position names across the entire array. Comparison is
 * case-insensitive and uses sanitized names, so "President" and "president"
 * would be considered duplicates.
 *
 * @param positions - Array of positions to validate
 * @throws {Error} If duplicate position names are found (case-insensitive)
 *
 * @example
 * ```typescript
 * // Valid - no duplicate positions
 * validateNoDuplicatePositions([
 *   { name: 'President', candidates: [...] },
 *   { name: 'Vice President', candidates: [...] }
 * ]);
 *
 * // Invalid - duplicate position names
 * try {
 *   validateNoDuplicatePositions([
 *     { name: 'President', candidates: [...] },
 *     { name: 'president', candidates: [...] } // Duplicate!
 *   ]);
 * } catch (error) {
 *   console.error(error.message); // "Duplicate position names found: president"
 * }
 * ```
 *
 * @see {@link validateNoDuplicateCandidatesInPositions} to check for duplicate candidates
 * @category Validation
 */
export function validateNoDuplicatePositions(positions: PositionInput[]): void {
  if (!Array.isArray(positions)) {
    return; // Will be caught by validatePositionsArray
  }

  const positionNames = positions
    .map((p) => sanitizeString(p.name).toLowerCase())
    .filter((name) => name.length > 0); // Only check non-empty names

  const duplicates = positionNames.filter((name, index) => positionNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    throw new Error(`Duplicate position names found: ${uniqueDuplicates.join(', ')}`);
  }
}
