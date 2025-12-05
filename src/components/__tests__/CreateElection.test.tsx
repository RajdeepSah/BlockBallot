import React from 'react';
import { render, screen, fireEvent } from '@/test-utils/render';
import { CreateElection } from '../CreateElection';
import { useAuth } from '../AuthContext';
import { createMockAuthContext } from '@/test-utils';

// Mock AuthContext using standardized test utilities
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Use actual validation logic since that's what we're testing
jest.mock('@/utils/validation', () => ({
  ...jest.requireActual('@/utils/validation'),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('CreateElection Component Validation', () => {
  const mockOnBack = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default authenticated user context using standardized mock
    const mockAuth = createMockAuthContext();
    mockUseAuth.mockReturnValue(mockAuth);
  });

  test('detects and shows error for duplicate position names', () => {
    render(<CreateElection onBack={mockOnBack} onSuccess={mockOnSuccess} />);

    // 1. Click "Add Position" to create a second input
    const addPositionBtn = screen.getByRole('button', { name: /add position/i });
    fireEvent.click(addPositionBtn);

    // 2. Find all Position Name inputs
    // The placeholder in your code is "e.g., President, Secretary"
    const positionInputs = screen.getAllByPlaceholderText(/e.g., President, Secretary/i);
    expect(positionInputs).toHaveLength(2);

    // 3. Type "Chairperson" into the first position
    fireEvent.change(positionInputs[0], { target: { value: 'Chairperson' } });

    // 4. Type "Chairperson" into the second position (triggering duplicate)
    fireEvent.change(positionInputs[1], { target: { value: 'Chairperson' } });

    // 5. Assert that the error message appears
    // When both positions have the same name, both show the error message
    const errorMessages = screen.getAllByText(/This position name is already used/i);
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages[0]).toHaveClass('text-red-600');
  });

  test('detects and shows error for duplicate candidate names within the same position', () => {
    render(<CreateElection onBack={mockOnBack} onSuccess={mockOnSuccess} />);

    // 1. Click "Add Candidate" on the default first position
    const addCandidateBtn = screen.getByRole('button', { name: /add candidate/i });
    fireEvent.click(addCandidateBtn);

    // 2. Find Candidate inputs
    // Your code generates placeholders like "Candidate 1 name *" and "Candidate 2 name *"
    const candidateInput1 = screen.getByPlaceholderText(/Candidate 1 name/i);
    const candidateInput2 = screen.getByPlaceholderText(/Candidate 2 name/i);

    // 3. Type "Alice" into the first candidate
    fireEvent.change(candidateInput1, { target: { value: 'Alice' } });

    // 4. Type "Alice" into the second candidate (triggering duplicate)
    fireEvent.change(candidateInput2, { target: { value: 'Alice' } });

    // 5. Assert that the error message appears
    // When both candidates have the same name, both show the error message
    const errorMessages = screen.getAllByText(/This candidate name is already used in this position/i);
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages[0]).toHaveClass('text-red-600');
  });

  test('does not show error for same candidate name in DIFFERENT positions', () => {
    render(<CreateElection onBack={mockOnBack} onSuccess={mockOnSuccess} />);

    // 1. Setup Position 1: Name it "Pos A" and Candidate "Alice"
    const posInputs = screen.getAllByPlaceholderText(/e.g., President, Secretary/i);
    fireEvent.change(posInputs[0], { target: { value: 'Pos A' } });
    
    const candInputPos1 = screen.getByPlaceholderText(/Candidate 1 name/i);
    fireEvent.change(candInputPos1, { target: { value: 'Alice' } });

    // 2. Add Position 2
    const addPositionBtn = screen.getByRole('button', { name: /add position/i });
    fireEvent.click(addPositionBtn);

    // 3. Setup Position 2: Name it "Pos B"
    const newPosInputs = screen.getAllByPlaceholderText(/e.g., President, Secretary/i);
    fireEvent.change(newPosInputs[1], { target: { value: 'Pos B' } });

    // 4. Setup Candidate for Position 2: Also name "Alice"
    // Since we added a position, there are now two inputs with placeholder "Candidate 1 name *"
    // We want the second one (index 1)
    const allCand1Inputs = screen.getAllByPlaceholderText(/Candidate 1 name/i);
    fireEvent.change(allCand1Inputs[1], { target: { value: 'Alice' } });

    // 5. Assert that NO error message appears
    const errorMessages = screen.queryByText(/This candidate name is already used/i);
    expect(errorMessages).not.toBeInTheDocument();
  });
});