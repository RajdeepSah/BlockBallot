import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { WelcomeGuide } from './WelcomeGuide';
import { Vote, Plus, Search, LogOut, Calendar, Users, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onCreateElection: () => void;
  onViewElection: (electionId: string) => void;
  onManageElection: (electionId: string) => void;
}

export function Dashboard({ onCreateElection, onViewElection, onManageElection }: DashboardProps) {
  const { user, token, logout } = useAuth();
  const [searchCode, setSearchCode] = useState('');
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const response = await api.searchElections(undefined, token!);
      setElections(response.elections || []);
    } catch (err: any) {
      console.error('Failed to load elections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearching(true);
    setError('');

    try {
      const response = await api.searchElections(searchCode.trim().toUpperCase());
      
      if (response.elections && response.elections.length > 0) {
        const election = response.elections[0];
        onViewElection(election.id);
      } else {
        setError('Election not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search election');
    } finally {
      setSearching(false);
    }
  };

  const getElectionStatus = (election: any) => {
    const now = new Date();
    const starts = new Date(election.starts_at);
    const ends = new Date(election.ends_at);

    if (now < starts) return { label: 'Upcoming', variant: 'secondary' as const };
    if (now > ends) return { label: 'Ended', variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const myElections = elections.filter(e => e.creator_id === user?.id);
  const participatingElections = elections.filter(e => e.creator_id !== user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <WelcomeGuide />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">BlockBallot</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Create Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Join Election
              </CardTitle>
              <CardDescription>Enter a 7-digit election code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Input
                  type="text"
                  placeholder="ABC1234"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="text-center text-lg tracking-wider"
                />
                <Button type="submit" className="w-full" disabled={searching}>
                  {searching ? 'Searching...' : 'Search Election'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create Election
              </CardTitle>
              <CardDescription>Host your own secure election</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onCreateElection} className="w-full" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                New Election
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Create elections for clubs, organizations, or communities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* My Elections */}
        {myElections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Elections I'm Hosting
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myElections.map((election) => {
                const status = getElectionStatus(election);
                return (
                  <Card key={election.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{election.title}</CardTitle>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {election.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(election.starts_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Code: <strong>{election.code}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => onManageElection(election.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                        <Button 
                          onClick={() => onViewElection(election.id)}
                          size="sm"
                          className="flex-1"
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Participating Elections */}
        {participatingElections.length > 0 && (
          <div>
            <h2 className="text-xl mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Elections I Can Vote In
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participatingElections.map((election) => {
                const status = getElectionStatus(election);
                return (
                  <Card key={election.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{election.title}</CardTitle>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {election.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(election.starts_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button 
                        onClick={() => onViewElection(election.id)}
                        className="w-full"
                        size="sm"
                      >
                        Enter Election
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && elections.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Elections Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first election or join one using a code
              </p>
              <Button onClick={onCreateElection}>
                <Plus className="w-5 h-5 mr-2" />
                Create Election
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading elections...</p>
          </div>
        )}
      </div>
    </div>
  );
}
