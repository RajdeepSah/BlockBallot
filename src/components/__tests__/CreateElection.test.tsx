import React from 'react';
import { render, screen, fireEvent } from '@/test-utils/render';
import { CreateElection } from '../CreateElection';
import { useAuth } from '../AuthContext';
import { createMockAuthContext } from '@/test-utils';

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/utils/validation', () => ({
  ...jest.requireActual('@/utils/validation'),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('CreateElection Component Validation', () => {
  const mockOnBack = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const mockAuth = createMockAuthContext();
    mockUseAuth.mockReturnValue(mockAuth);
  });

  test('detects and shows error for duplicate position names', () => {
    render(<CreateElection onBack={mockOnBack} onSuccess={mockOnSuccess} />);

    const addPositionBtn = screen.getByRole('button', { name: /add position/i });
    fireEvent.click(addPositionBtn);

    const positionInputs = screen.getAllByPlaceholderText(/e.g., President, Secretary/i);
    expect(positionInputs).toHaveLength(2);

    fireEvent.change(positionInputs[0], { target: { value: 'Chairperson' } });

    fireEvent.change(positionInputs[1], { target: { value: 'Chairperson' } });

    const errorMessages = screen.getAllByText(/This position name is already used/i);
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages[0]).toHaveClass('text-red-600');
  });

  test('detects and shows error for duplicate candidate names within the same position', () => {
    render(<CreateElection onBack={mockOnBack} onSuccess={mockOnSuccess} />);

    const addCandidateBtn = screen.getByRole('button', { name: /add candidate/i });
    fireEvent.click(addCandidateBtn);

    const candidateInput1 = screen.getByPlaceholderText(/Candidate 1 name/i);
    const candidateInput2 = screen.getByPlaceholderText(/Candidate 2 name/i);

    fireEvent.change(candidateInput1, { target: { value: 'Alice' } });

    fireEvent.change(candidateInput2, { target: { value: 'Alice' } });

    const errorMessages = screen.getAllByText(
      /This candidate name is already used in this position/i
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages[0]).toHaveClass('text-red-600');
  });

  test('does not show error for same candidate name in DIFFERENT positions', () => {
    render(<CreateElection onBack={mockOnBack} onSuccess={mockOnSuccess} />);

    const posInputs = screen.getAllByPlaceholderText(/e.g., President, Secretary/i);
    fireEvent.change(posInputs[0], { target: { value: 'Pos A' } });

    const candInputPos1 = screen.getByPlaceholderText(/Candidate 1 name/i);
    fireEvent.change(candInputPos1, { target: { value: 'Alice' } });

    const addPositionBtn = screen.getByRole('button', { name: /add position/i });
    fireEvent.click(addPositionBtn);

    const newPosInputs = screen.getAllByPlaceholderText(/e.g., President, Secretary/i);
    fireEvent.change(newPosInputs[1], { target: { value: 'Pos B' } });

    const allCand1Inputs = screen.getAllByPlaceholderText(/Candidate 1 name/i);
    fireEvent.change(allCand1Inputs[1], { target: { value: 'Alice' } });

    const errorMessages = screen.queryByText(/This candidate name is already used/i);
    expect(errorMessages).not.toBeInTheDocument();
  });
});
