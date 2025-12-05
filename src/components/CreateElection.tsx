import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { authenticatedFetch } from '../utils/auth/errorHandler';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Logo } from './Logo';
import { getEtherscanUrl } from '@/utils/blockchain/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Position } from '@/types/election';
import {
  sanitizeString,
  sanitizeText,
  validateNoDuplicateCandidatesInPositions,
  validateNoDuplicatePositions,
} from '@/utils/validation';
const generateTempId = (() => {
  let counter = 0;
  return () => `temp-${Date.now()}-${counter++}`;
})();

/**
 * Formats a date to local datetime-local input format.
 *
 * @param date - The date to format
 * @returns Formatted date string in YYYY-MM-DDTHH:mm format
 */
function currentLocalTime(date: Date): string {
  return `${date.toLocaleDateString('en-CA')}T${date.toTimeString().slice(0, 5)}`;
}

/**
 * Props for the CreateElection component.
 * @internal
 */
interface CreateElectionProps {
  onBack: () => void;
  onSuccess: (electionId: string) => void;
}

/**
 * Create election component for setting up new elections with positions and candidates.
 * Handles form validation, sanitization, and blockchain contract deployment.
 *
 * @param props - Component props
 * @param props.onBack - Callback to navigate back
 * @param props.onSuccess - Callback when election is successfully created
 * @returns The create election form UI
 */
export function CreateElection({ onBack, onSuccess }: CreateElectionProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState(currentLocalTime(new Date()));
  const [endsAt, setEndsAt] = useState('');
  const [timeZone] = useState('UTC');
  const [deployInfo, setDeployInfo] = useState<{ txHash: string; contractAddress: string } | null>(
    null
  );
  const [electionID, setElectionID] = useState('');

  const [positions, setPositions] = useState<Position[]>([
    {
      id: generateTempId(),
      name: 'President',
      description: '',
      ballot_type: 'single',
      candidates: [
        {
          id: generateTempId(),
          name: '',
          description: '',
        },
      ],
    },
  ]);

  const addPosition = () => {
    setPositions([
      ...positions,
      {
        id: generateTempId(),
        name: '',
        description: '',
        ballot_type: 'single',
        candidates: [
          {
            id: generateTempId(),
            name: '',
            description: '',
          },
        ],
      },
    ]);
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  const updatePosition = (id: string, field: string, value: string | Position['ballot_type']) => {
    setPositions(positions.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handlePositionBlur = (id: string, field: string) => {
    setPositions(
      positions.map((p) => {
        if (p.id !== id) return p;

        if (field === 'name' && typeof p[field as keyof Position] === 'string') {
          return { ...p, [field]: sanitizeString(p[field as keyof Position] as string) };
        }
        if (field === 'description' && typeof p[field as keyof Position] === 'string') {
          return { ...p, [field]: sanitizeText(p[field as keyof Position] as string) };
        }

        return p;
      })
    );
  };

  const addCandidate = (positionId: string) => {
    setPositions(
      positions.map((p) =>
        p.id === positionId
          ? {
              ...p,
              candidates: [
                ...p.candidates,
                {
                  id: generateTempId(),
                  name: '',
                  description: '',
                },
              ],
            }
          : p
      )
    );
  };

  const removeCandidate = (positionId: string, candidateId: string) => {
    setPositions(
      positions.map((p) =>
        p.id === positionId
          ? { ...p, candidates: p.candidates.filter((c) => c.id !== candidateId) }
          : p
      )
    );
  };

  const updateCandidate = (
    positionId: string,
    candidateId: string,
    field: string,
    value: string
  ) => {
    setPositions(
      positions.map((p) =>
        p.id === positionId
          ? {
              ...p,
              candidates: p.candidates.map((c) =>
                c.id === candidateId ? { ...c, [field]: value } : c
              ),
            }
          : p
      )
    );
  };

  const handleCandidateBlur = (positionId: string, candidateId: string, field: string) => {
    setPositions(
      positions.map((p) => {
        if (p.id !== positionId) return p;

        return {
          ...p,
          candidates: p.candidates.map((c) => {
            if (c.id !== candidateId) return c;

            if (field === 'name' && typeof c.name === 'string') {
              return { ...c, name: sanitizeString(c.name) };
            }
            if (field === 'description' && typeof c.description === 'string') {
              return { ...c, description: sanitizeText(c.description) };
            }

            return c;
          }),
        };
      })
    );
  };

  const getDuplicateCandidates = (position: Position): string[] => {
    const candidateNames = position.candidates
      .map((c) => sanitizeString(c.name).toLowerCase())
      .filter((name) => name.length > 0);

    const duplicates: string[] = [];
    const seen = new Set<string>();

    candidateNames.forEach((name) => {
      if (seen.has(name) && !duplicates.includes(name)) {
        duplicates.push(name);
      }
      seen.add(name);
    });

    return duplicates;
  };

  const isCandidateDuplicate = (position: Position, candidateId: string): boolean => {
    const candidate = position.candidates.find((c) => c.id === candidateId);
    if (!candidate) return false;

    const candidateName = sanitizeString(candidate.name).toLowerCase();
    if (!candidateName) return false;

    const duplicates = getDuplicateCandidates(position);
    return duplicates.includes(candidateName);
  };

  const getDuplicatePositions = (): string[] => {
    const positionNames = positions
      .map((p) => sanitizeString(p.name).toLowerCase())
      .filter((name) => name.length > 0);

    const duplicates: string[] = [];
    const seen = new Set<string>();

    positionNames.forEach((name) => {
      if (seen.has(name) && !duplicates.includes(name)) {
        duplicates.push(name);
      }
      seen.add(name);
    });

    return duplicates;
  };

  const isPositionDuplicate = (positionId: string): boolean => {
    const position = positions.find((p) => p.id === positionId);
    if (!position) return false;

    const positionName = sanitizeString(position.name).toLowerCase();
    if (!positionName) return false;

    const duplicates = getDuplicatePositions();
    return duplicates.includes(positionName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDeployInfo(null);

    if (!title || !startsAt || !endsAt) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(startsAt) >= new Date(endsAt)) {
      setError('End date must be after start date');
      return;
    }

    if (positions.length === 0) {
      setError('Add at least one position');
      return;
    }

    for (const position of positions) {
      if (!position.name || !sanitizeString(position.name)) {
        setError('All positions must have a name');
        return;
      }
      if (position.candidates.length === 0) {
        setError(`Position "${position.name}" must have at least one candidate`);
        return;
      }
      for (const candidate of position.candidates) {
        const sanitizedName = sanitizeString(candidate.name);
        if (!sanitizedName) {
          setError(`All candidates in "${position.name}" must have a name`);
          return;
        }
      }
    }

    try {
      const positionsForValidation = positions.map((p) => ({
        name: sanitizeString(p.name),
        description: sanitizeText(p.description || ''),
        ballot_type: p.ballot_type,
        candidates: p.candidates.map((c) => ({
          name: sanitizeString(c.name),
          description: sanitizeText(c.description || ''),
        })),
      }));
      validateNoDuplicatePositions(positionsForValidation);
    } catch (validationError) {
      const message =
        validationError instanceof Error
          ? validationError.message
          : 'Duplicate position names found';
      setError(message);
      return;
    }

    try {
      const positionsForValidation = positions.map((p) => ({
        name: sanitizeString(p.name),
        description: sanitizeText(p.description || ''),
        ballot_type: p.ballot_type,
        candidates: p.candidates.map((c) => ({
          name: sanitizeString(c.name),
          description: sanitizeText(c.description || ''),
        })),
      }));
      validateNoDuplicateCandidatesInPositions(positionsForValidation);
    } catch (validationError) {
      const message =
        validationError instanceof Error
          ? validationError.message
          : 'Duplicate candidates found in one or more positions';
      setError(message);
      return;
    }

    if (!token) {
      setError('You must be signed in to deploy an election');
      return;
    }

    setLoading(true);

    try {
      const electionPayload = {
        title: sanitizeString(title),
        description: sanitizeText(description),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        time_zone: timeZone,
        positions: positions.map((p) => ({
          name: sanitizeString(p.name),
          description: sanitizeText(p.description || ''),
          ballot_type: p.ballot_type,
          candidates: p.candidates.map((c) => ({
            name: sanitizeString(c.name),
            description: sanitizeText(c.description || ''),
          })),
        })),
        contractAddress: undefined,
      };

      const deployResponse = await authenticatedFetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(electionPayload),
      });

      const data = await deployResponse.json();

      if (deployResponse.ok) {
        const { txHash, contractAddress, electionId } = data;

        setElectionID(electionId);

        setDeployInfo({
          txHash: txHash,
          contractAddress: contractAddress,
        });
      } else {
        throw new Error(data.message || `Deployment request failed: ${data.message}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to deploy election contract: ' + message);
    } finally {
      setLoading(false);
    }
  };
  const handleContinue = () => {
    if (electionID) {
      onSuccess(electionID);
    }
    setDeployInfo(null);
    setElectionID('');
  };

  return (
    <div className="page-container min-h-screen bg-gray-50 dark:bg-gray-900">
      <Dialog open={deployInfo !== null && electionID !== ''} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Election Created Successfully!</DialogTitle>
            <DialogDescription>Your election has been deployed to the blockchain</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {deployInfo && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transaction Hash
                  </p>
                  <a
                    href={getEtherscanUrl(deployInfo.txHash, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {deployInfo.txHash}
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contract Address
                  </p>
                  <a
                    href={getEtherscanUrl(deployInfo.contractAddress, 'address')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {deployInfo.contractAddress}
                  </a>
                </div>
              </>
            )}
          </div>
          <Button onClick={handleContinue} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-900">
                <Logo size="sm" className="h-12 w-12" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create New Election</CardTitle>
                <CardDescription>Set up a secure voting election</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <h3 className="text-lg text-gray-900 dark:text-white">Election Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Student Council Election 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={(e) => setTitle(sanitizeString(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the election..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={(e) => setDescription(sanitizeText(e.target.value))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Start Date & Time *</Label>
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endsAt">End Date & Time *</Label>
                    <Input
                      id="endsAt"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-gray-900 dark:text-white">Positions & Candidates</h3>
                  <Button type="button" onClick={addPosition} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Position
                  </Button>
                </div>

                {positions.map((position, posIndex) => (
                  <Card key={position.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">Position {posIndex + 1}</CardTitle>
                        {positions.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removePosition(position.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Position Name *</Label>
                          <div className="space-y-1">
                            <Input
                              placeholder="e.g., President, Secretary"
                              value={position.name}
                              onChange={(e) => updatePosition(position.id, 'name', e.target.value)}
                              onBlur={() => handlePositionBlur(position.id, 'name')}
                              required
                              className={
                                isPositionDuplicate(position.id)
                                  ? 'border-red-500 focus-visible:ring-red-500'
                                  : ''
                              }
                            />
                            {isPositionDuplicate(position.id) && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                This position name is already used
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Ballot Type</Label>
                          <Select
                            value={position.ballot_type}
                            onValueChange={(value) =>
                              updatePosition(position.id, 'ballot_type', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single Choice</SelectItem>
                              <SelectItem value="multiple">Multiple Choice</SelectItem>
                              <SelectItem value="ranked">Ranked Choice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Position Description</Label>
                        <Textarea
                          placeholder="Brief description..."
                          value={position.description}
                          onChange={(e) =>
                            updatePosition(position.id, 'description', e.target.value)
                          }
                          onBlur={() => handlePositionBlur(position.id, 'description')}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Candidates</Label>
                          <Button
                            type="button"
                            onClick={() => addCandidate(position.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Candidate
                          </Button>
                        </div>

                        {position.candidates.map((candidate, candIndex) => {
                          const isDuplicate = isCandidateDuplicate(position, candidate.id);
                          return (
                            <div
                              key={candidate.id}
                              className="flex items-start space-x-2 rounded-lg border p-3"
                            >
                              <div className="flex-1 space-y-2">
                                <div className="space-y-1">
                                  <Input
                                    placeholder={`Candidate ${candIndex + 1} name *`}
                                    value={candidate.name}
                                    onChange={(e) =>
                                      updateCandidate(
                                        position.id,
                                        candidate.id,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                    onBlur={() =>
                                      handleCandidateBlur(position.id, candidate.id, 'name')
                                    }
                                    required
                                    className={
                                      isDuplicate ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }
                                  />
                                  {isDuplicate && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                      This candidate name is already used in this position
                                    </p>
                                  )}
                                </div>
                                <Input
                                  placeholder="Brief bio (optional)"
                                  value={candidate.description}
                                  onChange={(e) =>
                                    updateCandidate(
                                      position.id,
                                      candidate.id,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                  onBlur={() =>
                                    handleCandidateBlur(position.id, candidate.id, 'description')
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => removeCandidate(position.id, candidate.id)}
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}

                        {position.candidates.length === 0 && (
                          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No candidates added yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex space-x-4">
                <Button type="button" onClick={onBack} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Election'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
