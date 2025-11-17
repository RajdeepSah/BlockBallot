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

