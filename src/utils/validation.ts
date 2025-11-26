/**
 * Validation utilities for blockchain operations
 */

import { isAddress } from 'ethers';
import type { VoteInput, PositionInput } from '@/types/blockchain';

/**
 * Validate Ethereum address format
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
 * Validate vote input structure
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
 * Validate array of vote inputs
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
 * Validate position input structure
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
 * Validate array of position inputs
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
 * Sanitize string input by trimming whitespace and removing control characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Trim whitespace and remove null bytes and other control characters (except newlines/tabs for descriptions)
  return input.trim().replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize text input (for descriptions) - allows newlines and tabs
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Trim whitespace but preserve newlines and tabs for descriptions
  return input.trim().replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate that there are no duplicate candidate names within a position
 */
export function validateNoDuplicateCandidates(position: PositionInput): void {
  if (!position.candidates || !Array.isArray(position.candidates)) {
    return; // Will be caught by validatePositionInput
  }

  const candidateNames = position.candidates
    .map(c => sanitizeString(c.name).toLowerCase())
    .filter(name => name.length > 0); // Only check non-empty names

  const duplicates = candidateNames.filter((name, index) => 
    candidateNames.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    throw new Error(
      `Position "${position.name}" has duplicate candidates: ${uniqueDuplicates.join(', ')}`
    );
  }
}

/**
 * Validate all positions for duplicate candidates
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
 * Validate that there are no duplicate position names
 */
export function validateNoDuplicatePositions(positions: PositionInput[]): void {
  if (!Array.isArray(positions)) {
    return; // Will be caught by validatePositionsArray
  }

  const positionNames = positions
    .map(p => sanitizeString(p.name).toLowerCase())
    .filter(name => name.length > 0); // Only check non-empty names

  const duplicates = positionNames.filter((name, index) => 
    positionNames.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    throw new Error(
      `Duplicate position names found: ${uniqueDuplicates.join(', ')}`
    );
  }
}

