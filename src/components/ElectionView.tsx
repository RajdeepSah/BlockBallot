import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Logo } from './Logo';
import { Election, EligibilityStatus, Position, Candidate } from '@/types/election';
import { VoteSelections } from '@/types/api';
import { LoadingSpinner } from './ui/loading-spinner';
import { PageContainer } from './layouts/PageContainer';

interface ElectionViewProps {
  electionId: string;
  onBack: () => void;
  onViewResults: (electionId: string) => void;
}

/**
 * Election view component for displaying election details and casting votes.
 * Handles eligibility checking, access requests, and different ballot types.
 *
 * @param props - Component props
 * @param props.electionId - The ID of the election to display
 * @param props.onBack - Callback to navigate back
 * @param props.onViewResults - Callback to view election results
 * @returns The election view UI with ballot interface
 */
export function ElectionView({ electionId, onBack, onViewResults }: ElectionViewProps) {
  const { token, user } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receipt, setReceipt] = useState('');
  const [requestingAccess, setRequestingAccess] = useState(false);

  const [selections, setSelections] = useState<VoteSelections>({});

  const loadElection = useCallback(async () => {
    try {
      const response = await api.getElection(electionId);
      if (response.positions && Array.isArray(response.positions)) {
        response.positions = response.positions.map(
          (position: Partial<Position>, posIndex: number) => {
            const positionId = position.id || `pos-${posIndex}`;
            const candidates = (position.candidates || []).map(
              (candidate: Partial<Candidate>, candIndex: number) => ({
                ...candidate,
                id: candidate.id || `pos-${posIndex}-cand-${candIndex}`,
              })
            );
            return {
              ...position,
              id: positionId,
              candidates,
            };
          }
        );
      }
      setElection(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load election';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  const checkEligibility = useCallback(async () => {
    try {
      const response = await api.checkEligibility(electionId, token!);
      setEligibility(response);
    } catch (err) {
      console.error('Failed to check eligibility:', err);
    }
  }, [electionId, token]);

  useEffect(() => {
    loadElection();
    checkEligibility();
  }, [loadElection, checkEligibility]);

  const handleRequestAccess = async () => {
    try {
      setError('');
      setSuccess('');
      setRequestingAccess(true);
      const response = await api.requestAccess(electionId, token!);

      if (response?.status === 'already-approved') {
        setSuccess('You are already approved — you may cast your vote.');
      } else if (response?.success) {
        setSuccess('Access request submitted successfully');
      } else if (response?.status === 'pending') {
        setSuccess(response.message || 'Your access request is already pending review.');
      } else if (response?.status) {
        setError(response.message || 'Could not submit access request.');
      } else {
        setSuccess('Access request submitted successfully');
      }

      await checkEligibility();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request access';
      setError(message);
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleVote = async () => {
    if (!election) return;
    setError('');
    setVoting(true);

    try {
      for (const position of election.positions) {
        if (!selections[position.id]) {
          setError(`Please make a selection for ${position.name}`);
          setVoting(false);
          return;
        }
      }

      const response = await api.castVote(electionId, selections, election, token!);
      setReceipt(response.receipt);
      setSuccess('Vote cast successfully!');
      await checkEligibility();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cast vote';
      setError(message);
    } finally {
      setVoting(false);
    }
  };

  const handleSingleChoice = (positionId: string, candidateId: string) => {
    setSelections({ ...selections, [positionId]: candidateId });
  };

  const handleMultipleChoice = (positionId: string, candidateId: string, checked: boolean) => {
    const currentValue = selections[positionId];
    const current = Array.isArray(currentValue) ? currentValue : [];
    if (checked) {
      setSelections({ ...selections, [positionId]: [...current, candidateId] });
    } else {
      setSelections({
        ...selections,
        [positionId]: current.filter((id: string) => id !== candidateId),
      });
    }
  };

  const handleRankedChoice = (positionId: string, candidateId: string, rank: number) => {
    const currentValue = selections[positionId];
    const current = Array.isArray(currentValue) ? currentValue : [];
    const newRanking = [...current];

    const existingIndex = newRanking.indexOf(candidateId);
    if (existingIndex !== -1) {
      newRanking.splice(existingIndex, 1);
    }

    newRanking.splice(rank - 1, 0, candidateId);

    setSelections({ ...selections, [positionId]: newRanking });
  };

  if (loading) {
    return <LoadingSpinner message="Loading election..." />;
  }

  if (!election) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 page-container">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-xl">Election Not Found</h3>
            <Button onClick={onBack}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const starts = new Date(election.starts_at);
  const ends = new Date(election.ends_at);
  const isActive = now >= starts && now <= ends;
  const hasEnded = now > ends;
  const hasNotStarted = now < starts;

  const canVote = eligibility?.eligible && !eligibility?.hasVoted && isActive;
  const hasVoted = eligibility?.hasVoted;

  const isCreator = election.creator_id === user?.id;

  return (
    <PageContainer maxWidth="4xl">
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="mb-2 text-2xl">{election.title}</CardTitle>
              <CardDescription className="text-base">
                {election.description || 'No description provided'}
              </CardDescription>
            </div>
            <div className="ml-4">
              {hasEnded && <Badge variant="outline">Ended</Badge>}
              {isActive && <Badge>Active</Badge>}
              {hasNotStarted && <Badge variant="secondary">Upcoming</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-600">Starts</p>
                <p>{new Date(election.starts_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-600">Ends</p>
                <p>{new Date(election.ends_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Logo size="sm" className="h-10 w-10 opacity-60" />
              <div>
                <p className="text-gray-600">Code</p>
                <p className="font-mono">{election.code}</p>
              </div>
            </div>
          </div>

          {isCreator && (
            <div className="mt-4 border-t pt-4">
              <Button onClick={() => onViewResults(electionId)} variant="outline" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Results & Manage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {receipt && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="mr-2 h-5 w-5" />
              Vote Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-gray-700">
              Your vote has been recorded. Save this receipt for your records:
            </p>
            <div className="rounded border border-green-300 bg-white p-3 font-mono text-sm">
              {receipt}
            </div>
          </CardContent>
        </Card>
      )}

      {!eligibility?.eligible && !eligibility?.accessRequest && !hasVoted && (
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="mb-2 text-xl">Not Eligible</h3>
            <p className="mb-4 text-gray-600">
              You are not on the approved voter list for this election.
            </p>
            <Button onClick={handleRequestAccess} disabled={requestingAccess}>
              {requestingAccess ? 'Requesting...' : 'Request Access'}
            </Button>
          </CardContent>
        </Card>
      )}

      {eligibility?.accessRequest?.status === 'pending' && (
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-blue-500" />
            <h3 className="mb-2 text-xl">Access Request Pending</h3>
            <p className="text-gray-600">
              Your request is awaiting approval from the election administrator.
            </p>
          </CardContent>
        </Card>
      )}

      {hasVoted && (
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h3 className="mb-2 text-xl">You&apos;ve Already Voted</h3>
            <p className="text-gray-600">
              Thank you for participating! You can only vote once per election.
            </p>
            {hasEnded && (
              <Button onClick={() => onViewResults(electionId)} className="mt-4">
                View Results
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {hasNotStarted && eligibility?.eligible && (
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-xl">Election Hasn&apos;t Started</h3>
            <p className="text-gray-600">
              Voting will open on {new Date(election.starts_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {hasEnded && eligibility?.eligible && !hasVoted && (
        <Card className="mb-6">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-xl">Election Has Ended</h3>
            <p className="mb-4 text-gray-600">
              Voting closed on {new Date(election.ends_at).toLocaleString()}
            </p>
            <Button onClick={() => onViewResults(electionId)}>View Results</Button>
          </CardContent>
        </Card>
      )}

      {canVote &&
        election.positions.map((position: Position) => (
          <Card key={position.id} className="mb-6">
            <CardHeader>
              <CardTitle>{position.name}</CardTitle>
              <CardDescription>
                {position.description || `Select a candidate for ${position.name}`}
              </CardDescription>
              <Badge variant="outline" className="w-fit">
                {position.ballot_type === 'single' && 'Single Choice'}
                {position.ballot_type === 'multiple' && 'Multiple Choice'}
                {position.ballot_type === 'ranked' && 'Ranked Choice'}
              </Badge>
            </CardHeader>
            <CardContent>
              {position.ballot_type === 'single' && (
                <RadioGroup
                  value={selections[position.id] as string | undefined}
                  onValueChange={(value) => handleSingleChoice(position.id, value)}
                >
                  {position.candidates.map((candidate: Candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-start space-x-3 rounded-lg border border-transparent p-3 hover:border-gray-200 hover:bg-gray-50"
                    >
                      <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-1" />
                      <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                        <p>{candidate.name}</p>
                        {candidate.description && (
                          <p className="mt-1 text-sm text-gray-600">{candidate.description}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {position.ballot_type === 'multiple' && (
                <div className="space-y-3">
                  {position.candidates.map((candidate: Candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-start space-x-3 rounded-lg border border-transparent p-3 hover:border-gray-200 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={candidate.id}
                        checked={((selections[position.id] as string[] | undefined) || []).includes(
                          candidate.id
                        )}
                        onCheckedChange={(checked) =>
                          handleMultipleChoice(position.id, candidate.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                        <p>{candidate.name}</p>
                        {candidate.description && (
                          <p className="mt-1 text-sm text-gray-600">{candidate.description}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {position.ballot_type === 'ranked' && (
                <div className="space-y-3">
                  {position.candidates.map((candidate: Candidate) => {
                    const currentRank =
                      ((selections[position.id] as string[] | undefined) || []).indexOf(
                        candidate.id
                      ) + 1;
                    return (
                      <div
                        key={candidate.id}
                        className="flex items-start space-x-3 rounded-lg border p-3"
                      >
                        <div className="flex flex-col space-y-1">
                          {[1, 2, 3].map((rank) => (
                            <button
                              key={rank}
                              type="button"
                              onClick={() => handleRankedChoice(position.id, candidate.id, rank)}
                              className={`rounded px-2 py-1 text-xs ${
                                currentRank === rank
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {rank}
                            </button>
                          ))}
                        </div>
                        <div className="flex-1">
                          <p>{candidate.name}</p>
                          {candidate.description && (
                            <p className="mt-1 text-sm text-gray-600">{candidate.description}</p>
                          )}
                          {currentRank > 0 && (
                            <Badge variant="secondary" className="mt-2">
                              Rank {currentRank}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

      {canVote && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleVote}
              disabled={voting || Object.keys(selections).length !== election.positions.length}
              className="w-full"
              size="lg"
            >
              {voting ? 'Submitting Vote...' : 'Cast Vote'}
            </Button>
            <p className="mt-4 text-center text-xs text-gray-500">
              Your vote is final and cannot be changed after submission
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
