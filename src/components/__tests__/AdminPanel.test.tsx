/**
 * @fileoverview Unit tests for AdminPanel component's handleUploadVoters functionality.
 *
 * These tests verify that the voter upload feature correctly:
 * - Validates input (empty lists, invalid emails)
 * - Parses emails from various formats (newlines, commas, spaces)
 * - Handles API calls and responses
 * - Manages loading and error states
 * - Cleans up state appropriately
 */

import React from 'react';
import { render, screen, waitFor, act, userEvent } from '@/test-utils/render';
import { AdminPanel } from '../AdminPanel';
import { api } from '@/utils/api';
import { fetchEligibleVoters } from '@/utils/eligible-voters';
import { useAuth } from '../AuthContext';
import {
  createMockElection,
  createMockAuthContext,
  createMockFetchEligibleVoters,
  createMockEligibleVoter,
} from '@/test-utils';

// Mock all external dependencies to isolate component behavior
jest.mock('@/utils/api');
jest.mock('@/utils/eligible-voters');
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockFetchEligibleVoters = fetchEligibleVoters as jest.MockedFunction<
  typeof fetchEligibleVoters
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock election data using test utilities
const mockElection = createMockElection();

describe('AdminPanel - handleUploadVoters', () => {
  // Test fixtures
  const mockOnBack = jest.fn();
  const mockOnViewResults = jest.fn();
  const testElectionId = 'test-election-id';

  /**
   * Setup before each test:
   * - Clear all mocks to ensure test isolation
   * - Configure default API responses
   * - Setup authentication context
   */
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure default API responses
    mockApi.getElection.mockResolvedValue(mockElection);
    mockApi.getAccessRequests.mockResolvedValue({ requests: [] });
    mockFetchEligibleVoters.mockResolvedValue([]);
    
    // Setup default authenticated user context
    const mockAuth = createMockAuthContext();
    mockUseAuth.mockReturnValue(mockAuth);
  });

  /**
   * Helper function to render AdminPanel and wait for it to fully load.
   * 
   * This ensures the component has finished loading election data before
   * tests try to interact with it, preventing race conditions.
   * 
   * @param token - Optional authentication token (defaults to 'test-token')
   * @returns Rendered component instance
   */
  const renderAdminPanel = async (token: string = 'test-token') => {
    // Update useAuth mock with the provided token using test utilities
    const mockAuth = createMockAuthContext({ token });
    mockUseAuth.mockReturnValue(mockAuth);

    const component = render(
      <AdminPanel
        electionId={testElectionId}
        onBack={mockOnBack}
        onViewResults={mockOnViewResults}
      />
    );

    // Wait for the API call to be made
    await waitFor(() => {
      expect(mockApi.getElection).toHaveBeenCalledWith(testElectionId);
    });

    // Wait for the component to finish loading (loading spinner should disappear)
    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Wait for the main content to appear (election title)
    await waitFor(() => {
      expect(screen.getByText(mockElection.title)).toBeInTheDocument();
    });

    return component;
  };

  /**
   * Test suite: Input validation for empty voter lists
   * 
   * Ensures the component properly handles empty or whitespace-only input
   * and prevents invalid submissions.
   */
  describe('Empty voter list validation', () => {
    it('should disable upload button when voterList is empty', async () => {
      await renderAdminPanel();

      // The upload button should be disabled when there's no input
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });
      expect(uploadButton).toBeDisabled();

      // Try to trigger with empty input (button should be disabled)
      // But let's test by enabling the textarea, entering nothing, and trying
      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      await userEvent.clear(textarea);

      // Button should remain disabled
      expect(uploadButton).toBeDisabled();
    });

    it('should disable upload button when input contains only whitespace', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      // Enter only whitespace (spaces, newlines, tabs)
      await userEvent.type(textarea, '   \n\t  ');

      // Button should remain disabled because trim() removes whitespace
      expect(uploadButton).toBeDisabled();
    });
  });

  /**
   * Test suite: Email validation and filtering
   * 
   * Verifies that invalid email addresses are filtered out and appropriate
   * error messages are shown when no valid emails are found.
   */
  describe('Invalid email addresses', () => {
    it('should filter out invalid emails and show error when no valid emails found', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      // Enter text that looks like emails but lacks @ symbol (will be filtered out)
      await userEvent.type(textarea, 'notanemail\nalsonotanemail');

      // Click upload - should trigger validation
      await userEvent.click(uploadButton);

      // Should show error message and NOT call the API
      await waitFor(() => {
        expect(screen.getByText(/no valid email addresses found/i)).toBeInTheDocument();
      });
      expect(mockApi.uploadEligibility).not.toHaveBeenCalled();
    });

    it('should filter out empty lines and invalid formats, keeping only valid emails', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      // Mix of valid emails, empty lines, and invalid formats
      await userEvent.type(
        textarea,
        'valid@example.com\n\ninvalid\n  \nanother@valid.com\nno-at-symbol'
      );

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      // Should only send the valid emails to the API
      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          ['valid@example.com', 'another@valid.com'],
          'test-token'
        );
      });
    });
  });

  /**
   * Test suite: Successful upload scenarios
   * 
   * Verifies that valid email lists are correctly parsed, sent to the API,
   * and success messages are displayed.
   */
  describe('Successful upload', () => {
    it('should parse emails, show loading state, call API, and display success message', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      // Enter valid email addresses
      const emails = ['voter1@example.com', 'voter2@example.com', 'voter3@example.com'];
      await userEvent.type(textarea, emails.join('\n'));

      // Create a controllable promise to test loading state
      let resolveUpload: () => void;
      const uploadPromise = new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
      mockApi.uploadEligibility.mockReturnValue(uploadPromise);

      // Trigger upload
      await userEvent.click(uploadButton);

      // Verify loading state appears
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });

      // Complete the upload
      resolveUpload!();
      await uploadPromise;

      // Verify API was called with correct parameters
      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          emails,
          'test-token'
        );
      });

      // Verify success message appears
      await waitFor(() => {
        expect(
          screen.getByText(/successfully added 3 voters to the eligibility list/i)
        ).toBeInTheDocument();
      });

      // Verify textarea is cleared after successful upload
      expect(textarea).toHaveValue('');
    });

    it('should clear error and success messages before upload', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      // First, trigger an error
      await userEvent.type(textarea, 'invalid');
      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/no valid email addresses found/i)).toBeInTheDocument();
      });

      // Now enter valid email and upload
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'valid@example.com');
      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      // Error should be cleared, success should show
      await waitFor(() => {
        expect(screen.queryByText(/no valid email addresses found/i)).not.toBeInTheDocument();
        expect(
          screen.getByText(/successfully added 1 voters to the eligibility list/i)
        ).toBeInTheDocument();
      });
    });
  });

  /**
   * Test suite: Email parsing from various input formats
   * 
   * Verifies that the component correctly parses emails from different
   * separator formats (newlines, commas, spaces) and handles edge cases
   * like whitespace trimming.
   */
  describe('Email parsing', () => {
    it('should parse newline-separated emails correctly', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      const emails = ['email1@test.com', 'email2@test.com', 'email3@test.com'];
      await userEvent.type(textarea, emails.join('\n'));

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          emails,
          'test-token'
        );
      });
    });

    it('should parse comma-separated emails correctly', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      const emails = ['email1@test.com', 'email2@test.com', 'email3@test.com'];
      await userEvent.type(textarea, emails.join(','));

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          emails,
          'test-token'
        );
      });
    });

    it('should parse space-separated emails correctly', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      const emails = ['email1@test.com', 'email2@test.com', 'email3@test.com'];
      await userEvent.type(textarea, emails.join(' '));

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          emails,
          'test-token'
        );
      });
    });

    it('should handle mixed separators', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'email1@test.com,email2@test.com\nemail3@test.com email4@test.com');

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          ['email1@test.com', 'email2@test.com', 'email3@test.com', 'email4@test.com'],
          'test-token'
        );
      });
    });

    it('should trim whitespace from emails', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, '  email1@test.com  \n  email2@test.com  ');

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalledWith(
          testElectionId,
          ['email1@test.com', 'email2@test.com'],
          'test-token'
        );
      });
    });
  });

  /**
   * Test suite: Error handling for API failures
   * 
   * Ensures that API errors are caught, displayed to the user,
   * and handled gracefully (including non-Error exceptions).
   */
  describe('API error handling', () => {
    it('should catch and display API errors', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'valid@example.com');

      const errorMessage = 'Failed to upload eligibility list';
      mockApi.uploadEligibility.mockRejectedValue(new Error(errorMessage));

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockApi.uploadEligibility).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'valid@example.com');

      mockApi.uploadEligibility.mockRejectedValue('String error');

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to upload voter list/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * Test suite: Loading state management
   * 
   * Verifies that the component correctly shows/hides loading indicators
   * and manages button states during async operations.
   */
  describe('Loading state management', () => {
    it('should set uploading state during async operation', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'valid@example.com');

      // Create a promise that we can control
      let resolveUpload: () => void;
      const uploadPromise = new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
      mockApi.uploadEligibility.mockReturnValue(uploadPromise);

      await userEvent.click(uploadButton);

      // Check that button shows uploading state
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      expect(uploadButton).toBeDisabled();

      // Resolve the promise
      resolveUpload!();
      await uploadPromise;

      await waitFor(() => {
        expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
      });
    });

    it('should reset uploading state on error', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'valid@example.com');

      mockApi.uploadEligibility.mockRejectedValue(new Error('API Error'));

      await userEvent.click(uploadButton);

      // Should show uploading briefly, then error
      await waitFor(() => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      });

      // Button should be enabled again
      await waitFor(() => {
        expect(uploadButton).not.toBeDisabled();
      });
    });
  });

  /**
   * Test suite: State cleanup after operations
   * 
   * Ensures that component state is properly reset after successful
   * operations and preserved after errors (so users don't lose their input).
   */
  describe('State cleanup', () => {
    it('should clear voterList on successful upload', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'valid@example.com');
      expect(textarea).toHaveValue('valid@example.com');

      mockApi.uploadEligibility.mockResolvedValue({});

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should not clear voterList on error', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      const emailText = 'valid@example.com';
      await userEvent.type(textarea, emailText);

      mockApi.uploadEligibility.mockRejectedValue(new Error('API Error'));

      await userEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      });

      // Textarea should still have the value
      expect(textarea).toHaveValue(emailText);
    });
  });

  /**
   * Test suite: Eligible voters fetching
   * 
   * Verifies that the component correctly fetches and displays eligible voters
   * using the mock utility function.
   */
  describe('Eligible voters fetching', () => {
    it('should fetch and display eligible voters using mock utility', async () => {
      // Use createMockFetchEligibleVoters to create test data
      const mockVoters = createMockFetchEligibleVoters([
        createMockEligibleVoter({ email: 'voter1@example.com', full_name: 'Voter One' }),
        createMockEligibleVoter({ email: 'voter2@example.com', full_name: 'Voter Two' }),
      ]);

      // Override the mock to use our test utility
      mockFetchEligibleVoters.mockImplementation(mockVoters);

      await renderAdminPanel();

      // Wait for eligible voters to be fetched
      // Note: fetchEligibleVoters only takes electionId, not a token
      await waitFor(() => {
        expect(mockFetchEligibleVoters).toHaveBeenCalledWith(testElectionId);
      });
    });

    it('should handle async state updates with act wrapper', async () => {
      await renderAdminPanel();

      const textarea = screen.getByPlaceholderText(/voter1@example.com/i);
      const uploadButton = screen.getByRole('button', { name: /upload voter list/i });

      await userEvent.type(textarea, 'test@example.com');

      // Use act to wrap async state updates
      await act(async () => {
        mockApi.uploadEligibility.mockResolvedValue({});
        await userEvent.click(uploadButton);
      });

      // Verify the state was updated correctly
      await waitFor(() => {
        expect(mockApi.uploadEligibility).toHaveBeenCalled();
      });
    });
  });
});

