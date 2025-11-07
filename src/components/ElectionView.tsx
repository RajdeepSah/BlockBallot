import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Vote, TrendingUp } from 'lucide-react';

interface ElectionViewProps {
  electionId: string;
  onBack: () => void;
  onViewResults: (electionId: string) => void;
}

export function ElectionView({ electionId, onBack, onViewResults }: ElectionViewProps) {
  const { token, user } = useAuth();
  const [election, setElection] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receipt, setReceipt] = useState('');

  // Vote selections
  const [selections, setSelections] = useState<Record<string, any>>({});

  useEffect(() => {
    loadElection();
    checkEligibility();
  }, [electionId]);

  const loadElection = async () => {
    try {
      const response = await api.getElection(electionId);
      setElection(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load election');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const response = await api.checkEligibility(electionId, token!);
      setEligibility(response);
    } catch (err: any) {
      console.error('Failed to check eligibility:', err);
    }
  };

  const handleRequestAccess = async () => {
    try {
      setError('');
      await api.requestAccess(electionId, token!);
      await checkEligibility();
      setSuccess('Access request submitted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to request access');
    }
  };

  const handleVote = async () => {
    setError('');
    setVoting(true);

    try {
      // Validate all positions have selections
      for (const position of election.positions) {
        if (!selections[position.id]) {
          setError(`Please make a selection for ${position.name}`);
          setVoting(false);
          return;
        }
      }

      const response = await api.castVote(electionId, selections, token!);
      setReceipt(response.receipt);
      setSuccess('Vote cast successfully!');
      await checkEligibility();
    } catch (err: any) {
      setError(err.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  const handleSingleChoice = (positionId: string, candidateId: string) => {
    setSelections({ ...selections, [positionId]: candidateId });
  };

  const handleMultipleChoice = (positionId: string, candidateId: string, checked: boolean) => {
    const current = selections[positionId] || [];
    if (checked) {
      setSelections({ ...selections, [positionId]: [...current, candidateId] });
    } else {
      setSelections({ ...selections, [positionId]: current.filter((id: string) => id !== candidateId) });
    }
  };

  const handleRankedChoice = (positionId: string, candidateId: string, rank: number) => {
    const current = selections[positionId] || [];
    const newRanking = [...current];
    
    // Remove if already ranked
    const existingIndex = newRanking.indexOf(candidateId);
    if (existingIndex !== -1) {
      newRanking.splice(existingIndex, 1);
    }
    
    // Add at rank position
    newRanking.splice(rank - 1, 0, candidateId);
    
    setSelections({ ...selections, [positionId]: newRanking });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading election...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl mb-2">Election Not Found</h3>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Election Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{election.title}</CardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Starts</p>
                  <p>{new Date(election.starts_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Ends</p>
                  <p>{new Date(election.ends_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Vote className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Code</p>
                  <p className="font-mono">{election.code}</p>
                </div>
              </div>
            </div>

            {isCreator && (
              <div className="mt-4 pt-4 border-t">
                <Button onClick={() => onViewResults(electionId)} variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Results & Manage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {receipt && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                Vote Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-2">
                Your vote has been recorded. Save this receipt for your records:
              </p>
              <div className="p-3 bg-white rounded border border-green-300 font-mono text-sm">
                {receipt}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not Eligible */}
        {!eligibility?.eligible && !eligibility?.accessRequest && !hasVoted && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl mb-2">Not Eligible</h3>
              <p className="text-gray-600 mb-4">
                You are not on the approved voter list for this election.
              </p>
              <Button onClick={handleRequestAccess}>
                Request Access
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Access Request */}
        {eligibility?.accessRequest?.status === 'pending' && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl mb-2">Access Request Pending</h3>
              <p className="text-gray-600">
                Your request is awaiting approval from the election administrator.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Already Voted */}
        {hasVoted && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl mb-2">You've Already Voted</h3>
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

        {/* Not Started Yet */}
        {hasNotStarted && eligibility?.eligible && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2">Election Hasn't Started</h3>
              <p className="text-gray-600">
                Voting will open on {new Date(election.starts_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Election Ended */}
        {hasEnded && eligibility?.eligible && !hasVoted && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2">Election Has Ended</h3>
              <p className="text-gray-600 mb-4">
                Voting closed on {new Date(election.ends_at).toLocaleString()}
              </p>
              <Button onClick={() => onViewResults(electionId)}>
                View Results
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ballot */}
        {canVote && election.positions.map((position: any) => (
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
                  value={selections[position.id]}
                  onValueChange={(value) => handleSingleChoice(position.id, value)}
                >
                  {position.candidates.map((candidate: any) => (
                    <div key={candidate.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                      <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-1" />
                      <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                        <p>{candidate.name}</p>
                        {candidate.description && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {position.ballot_type === 'multiple' && (
                <div className="space-y-3">
                  {position.candidates.map((candidate: any) => (
                    <div key={candidate.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200">
                      <Checkbox
                        id={candidate.id}
                        checked={(selections[position.id] || []).includes(candidate.id)}
                        onCheckedChange={(checked) => handleMultipleChoice(position.id, candidate.id, checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                        <p>{candidate.name}</p>
                        {candidate.description && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {position.ballot_type === 'ranked' && (
                <div className="space-y-3">
                  {position.candidates.map((candidate: any, index: number) => {
                    const currentRank = (selections[position.id] || []).indexOf(candidate.id) + 1;
                    return (
                      <div key={candidate.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="flex flex-col space-y-1">
                          {[1, 2, 3].map((rank) => (
                            <button
                              key={rank}
                              type="button"
                              onClick={() => handleRankedChoice(position.id, candidate.id, rank)}
                              className={`px-2 py-1 text-xs rounded ${
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
                            <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
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
              <p className="text-xs text-gray-500 text-center mt-4">
                Your vote is final and cannot be changed after submission
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
