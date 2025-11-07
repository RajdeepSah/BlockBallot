import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Trash2, Vote } from 'lucide-react';

interface CreateElectionProps {
  onBack: () => void;
  onSuccess: (electionId: string) => void;
}

interface Candidate {
  id: string;
  name: string;
  description: string;
}

interface Position {
  id: string;
  name: string;
  description: string;
  ballot_type: 'single' | 'multiple' | 'ranked';
  candidates: Candidate[];
}

export function CreateElection({ onBack, onSuccess }: CreateElectionProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Election details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');

  // Positions
  const [positions, setPositions] = useState<Position[]>([
    {
      id: crypto.randomUUID(),
      name: 'President',
      description: '',
      ballot_type: 'single',
      candidates: []
    }
  ]);

  const addPosition = () => {
    setPositions([
      ...positions,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        ballot_type: 'single',
        candidates: []
      }
    ]);
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const updatePosition = (id: string, field: string, value: any) => {
    setPositions(positions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addCandidate = (positionId: string) => {
    setPositions(positions.map(p => 
      p.id === positionId 
        ? { 
            ...p, 
            candidates: [...p.candidates, { 
              id: crypto.randomUUID(), 
              name: '', 
              description: '' 
            }] 
          }
        : p
    ));
  };

  const removeCandidate = (positionId: string, candidateId: string) => {
    setPositions(positions.map(p => 
      p.id === positionId 
        ? { ...p, candidates: p.candidates.filter(c => c.id !== candidateId) }
        : p
    ));
  };

  const updateCandidate = (positionId: string, candidateId: string, field: string, value: string) => {
    setPositions(positions.map(p => 
      p.id === positionId 
        ? { 
            ...p, 
            candidates: p.candidates.map(c => 
              c.id === candidateId ? { ...c, [field]: value } : c
            ) 
          }
        : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
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
      if (!position.name) {
        setError('All positions must have a name');
        return;
      }
      if (position.candidates.length === 0) {
        setError(`Position "${position.name}" must have at least one candidate`);
        return;
      }
      for (const candidate of position.candidates) {
        if (!candidate.name) {
          setError(`All candidates in "${position.name}" must have a name`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const response = await api.createElection({
        title,
        description,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        time_zone: timeZone,
        positions: positions.map(p => ({
          name: p.name,
          description: p.description,
          ballot_type: p.ballot_type,
          candidates: p.candidates.map(c => ({
            name: c.name,
            description: c.description
          }))
        }))
      }, token!);

      onSuccess(response.election.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Vote className="w-6 h-6 text-white" />
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

              {/* Election Details */}
              <div className="space-y-4">
                <h3 className="text-lg">Election Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Student Council Election 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Positions & Candidates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg">Positions & Candidates</h3>
                  <Button type="button" onClick={addPosition} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
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
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Position Name *</Label>
                          <Input
                            placeholder="e.g., President, Secretary"
                            value={position.name}
                            onChange={(e) => updatePosition(position.id, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Ballot Type</Label>
                          <Select
                            value={position.ballot_type}
                            onValueChange={(value) => updatePosition(position.id, 'ballot_type', value)}
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
                          onChange={(e) => updatePosition(position.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Candidates */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Candidates</Label>
                          <Button
                            type="button"
                            onClick={() => addCandidate(position.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Candidate
                          </Button>
                        </div>

                        {position.candidates.map((candidate, candIndex) => (
                          <div key={candidate.id} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder={`Candidate ${candIndex + 1} name *`}
                                value={candidate.name}
                                onChange={(e) => updateCandidate(position.id, candidate.id, 'name', e.target.value)}
                                required
                              />
                              <Input
                                placeholder="Brief bio (optional)"
                                value={candidate.description}
                                onChange={(e) => updateCandidate(position.id, candidate.id, 'description', e.target.value)}
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeCandidate(position.id, candidate.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {position.candidates.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
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
