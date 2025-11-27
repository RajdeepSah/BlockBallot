/**
 * Validation utilities for blockchain operations
 */

import { isAddress } from 'ethers';
import type { VoteInput, PositionInput } from '@/types/blockchain';

/**
 * Validates that a string is a valid Ethereum address format.
 *
 * @param address - The address string to validate
 * @throws Error if address is missing, not a string, or invalid format
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
 * @param vote - The vote input to validate
 * @throws Error if vote is missing position or candidate
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
 * @param votes - Array of vote inputs to validate
 * @throws Error if array is empty or any vote is invalid
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
 * @param position - The position input to validate
 * @throws Error if position is missing name or has no candidates
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
 * @param positions - Array of position inputs to validate
 * @throws Error if array is empty or any position is invalid
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
 * Preserves newlines and tabs for use in descriptions.
 *
 * @param input - The string to sanitize
 * @returns Sanitized string, or empty string if input is not a string
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
 * Removes control characters but keeps formatting characters.
 *
 * @param input - The text to sanitize
 * @returns Sanitized text, or empty string if input is not a string
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
 * Comparison is case-insensitive and uses sanitized names.
 *
 * @param position - The position to validate
 * @throws Error if duplicate candidate names are found
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
 * @param positions - Array of positions to validate
 * @throws Error if any position has duplicate candidates
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
 * Comparison is case-insensitive and uses sanitized names.
 *
 * @param positions - Array of positions to validate
 * @throws Error if duplicate position names are found
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
