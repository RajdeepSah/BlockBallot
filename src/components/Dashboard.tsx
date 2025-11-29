import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { WelcomeGuide } from './WelcomeGuide';
import { Vote, Plus, Search, LogOut, Calendar, Users, TrendingUp } from 'lucide-react';
import { Election } from '@/types/election';
import { LoadingSpinner } from './ui/loading-spinner';

interface DashboardProps {
  onCreateElection: () => void;
  onViewElection: (electionId: string) => void;
  onManageElection: (electionId: string) => void;
}

/**
 * Dashboard component displaying user's elections and election search functionality.
 *
 * @param props - Component props
 * @param props.onCreateElection - Callback to navigate to election creation
 * @param props.onViewElection - Callback to view an election by ID
 * @param props.onManageElection - Callback to manage an election by ID
 * @returns The dashboard UI with election listings and search
 */
export function Dashboard({ onCreateElection, onViewElection, onManageElection }: DashboardProps) {
  const { user, token, logout } = useAuth();
  const [searchCode, setSearchCode] = useState('');
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadElections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.searchElections(undefined, token!);
      setElections(response.elections || []);
    } catch (err) {
      console.error('Failed to load elections:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadElections();
  }, [loadElections]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearching(true);
    setError('');

    try {
      const response = await api.searchElections(searchCode.trim().toUpperCase());

      if (response.elections && response.elections.length > 0) {
        const election = response.elections[0];
        if (election.id) {
          onViewElection(election.id);
        }
      } else {
        setError('Election not found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search election';
      setError(message);
    } finally {
      setSearching(false);
    }
  };

  /**
   * Determines the status badge for an election based on current time.
   *
   * @param election - The election to check status for
   * @returns Object with label and variant for the status badge
   */
  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const starts = new Date(election.starts_at);
    const ends = new Date(election.ends_at);

    if (now < starts) return { label: 'Upcoming', variant: 'secondary' as const };
    if (now > ends) return { label: 'Ended', variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const myElections = elections.filter((e) => e.creator_id === user?.id);
  const participatingElections = elections.filter((e) => e.creator_id !== user?.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <WelcomeGuide />
      <div className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-indigo-600 p-2">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl dark:text-white">BlockBallot</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user?.name}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
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
                <Plus className="mr-2 h-5 w-5" />
                Create Election
              </CardTitle>
              <CardDescription>Host your own secure election</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onCreateElection} className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                New Election
              </Button>
              <p className="mt-4 text-xs text-gray-500">
                Create elections for clubs, organizations, or communities
              </p>
            </CardContent>
          </Card>
        </div>

        {myElections.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center text-xl">
              <Calendar className="mr-2 h-5 w-5" />
              Elections I&apos;m Hosting
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myElections.map((election) => {
                const status = getElectionStatus(election);
                return (
                  <Card key={election.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 min-w-0 flex-1 text-lg">
                          {election.title}
                        </CardTitle>
                        <Badge variant={status.variant} className="flex-shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {election.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(election.starts_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <span className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs">
                            Code: <strong>{election.code}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => election.id && onManageElection(election.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Manage
                        </Button>
                        <Button
                          onClick={() => election.id && onViewElection(election.id)}
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

        {participatingElections.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center text-xl">
              <Users className="mr-2 h-5 w-5" />
              Elections I Can Vote In
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {participatingElections.map((election) => {
                const status = getElectionStatus(election);
                return (
                  <Card key={election.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 min-w-0 flex-1 text-lg">
                          {election.title}
                        </CardTitle>
                        <Badge variant={status.variant} className="flex-shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {election.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(election.starts_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        onClick={() => election.id && onViewElection(election.id)}
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

        {!loading && elections.length === 0 && (
          <Card className="py-12 text-center">
            <CardContent>
              <Vote className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
              <h3 className="mb-2 text-xl dark:text-white">No Elections Yet</h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Create your first election or join one using a code
              </p>
              <Button onClick={onCreateElection}>
                <Plus className="mr-2 h-5 w-5" />
                Create Election
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="py-12">
            <LoadingSpinner message="Loading elections..." fullScreen={false} />
          </div>
        )}
      </div>
    </div>
  );
}
