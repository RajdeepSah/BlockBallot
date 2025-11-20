import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Election } from '@/types/election';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Trash2, Vote } from 'lucide-react';
import { getEtherscanUrl } from '@/utils/blockchain/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Position, Candidate } from '@/types/election';
interface CreateElectionProps {
  onBack: () => void;
  onSuccess: (electionId: string) => void;
}

export function CreateElection({ onBack, onSuccess }: CreateElectionProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // api error messages

  // Election details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');
  const [deployInfo, setDeployInfo] = useState<{ txHash: string; contractAddress: string } | null>(null);
  const [electionID, setElectionID] = useState('');


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
    // Clear any previous state
    setError('');
    setDeployInfo(null); 

    // Validate required form info
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
    
    // Ensure user is authenticated before deployment
    if (!token) {
      setError('You must be signed in to deploy an election');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare the full payload for the Next.js API Route
      // This payload contains all the data needed for BOTH contract deployment
      // AND eventually saving to the Supabase database.
      const electionPayload = {
         title,
         description,
         starts_at: new Date(startsAt).toISOString(),
         ends_at: new Date(endsAt).toISOString(),
         time_zone: timeZone,
         token: token, // Pass the user's auth token for server-side user verification
         positions: positions.map(p => ({ // creates an array of Positions containing the list of candidate for that position
            name: p.name,
            description: p.description,
            ballot_type: p.ballot_type,
            candidates: p.candidates.map(c => ({name: c.name, description: c.description}))
         })),
         contractAddress: undefined // If deployed successfully, this will be replaces with the actual address  
      };
      console.log(electionPayload)
      // 2. Client -> Backend: POST /api/create-election
      // This initiates the DEPLOYMENT process on the server side.
      // The API route will handle the communication with Ethereum.
      const deployResponse = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Ensure auth token is passed
        },
        body: JSON.stringify(electionPayload)
      });
      
      const data = await deployResponse.json();

      if (deployResponse.ok) { // YAY
         const { txHash, contractAddress } = data;
         console.log("Deploy response: ", data);

         //put the deployed contract address into the election payload
         electionPayload.contractAddress = contractAddress;

         // Set the information for the success message display
         setDeployInfo({
            txHash: txHash,
            contractAddress: contractAddress
         });
         // debug print
         console.log("deployInfo: ", deployInfo)
         // currently this will just redirect to the admin page for the election.
         // should instead send back the deployInfo to display a message with the address
         console.log(`contract deployment transaction: ${getEtherscanUrl(txHash, 'tx')}`)
         console.log(`deployed contract address: ${getEtherscanUrl(contractAddress, 'address')}`)
         try { // to store election info in db
            const dbResponse = await api.createElection(electionPayload, token!);
            console.log("DB store response: ", dbResponse);
            setElectionID(dbResponse.election.id); // store in state so continue button can redirect
         } catch (err: any) {
            setError(`Error storing election in db: ${err}`);
         }
      } else {
         // If the server returns an error (e.g., failed deployment, missing key)
         throw new Error(data.message || `Deployment request failed: ${data.message}`);
      }
    } catch (err: any) {
      setError('Failed to deploy election contract: '+err.message );
    } finally {
      setLoading(false);
    }
  };
  const handleContinue = () => {
   if (electionID) {
      onSuccess(electionID);
   }
   setDeployInfo(null);
   setElectionID('')
   };
   

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Modal */}
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
                  <p className="text-sm font-medium text-gray-700">Transaction Hash</p>
                  <a href={getEtherscanUrl(deployInfo.txHash, 'tx')} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">
                    {deployInfo.txHash}
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Contract Address</p>
                  <a href={getEtherscanUrl(deployInfo.contractAddress, 'address')} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">
                    {deployInfo.contractAddress}
                  </a>
                </div>
              </>
            )}
          </div>
          <Button onClick={handleContinue} className="w-full">Continue</Button>
        </DialogContent>
      </Dialog>
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
