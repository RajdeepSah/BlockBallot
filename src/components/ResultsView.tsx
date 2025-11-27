import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft, TrendingUp, Users, Award, Download, Loader2 } from 'lucide-react';
import { fetchEligibleVoters, type EligibleVoter } from '@/utils/eligible-voters';
import { Election, ElectionResults, PositionResult, CandidateResult } from '@/types/election';
import { LoadingSpinner } from './ui/loading-spinner';
import { PageContainer } from './layouts/PageContainer';

interface ResultsViewProps {
  electionId: string;
  onBack: () => void;
  onManage?: (electionId: string) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

interface ChartDataEntry {
  name: string;
  votes: number;
  percentage: number;
}

export function ResultsView({ electionId, onBack, onManage }: ResultsViewProps) {
  const { user } = useAuth();
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibleDialogOpen, setEligibleDialogOpen] = useState(false);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [eligibleError, setEligibleError] = useState('');
  const [eligibleVoters, setEligibleVoters] = useState<EligibleVoter[]>([]);

  const loadElection = useCallback(async () => {
    try {
      const response = await api.getElection(electionId);
      setElection(response);
    } catch (err) {
      console.error('Failed to load election:', err);
    }
  }, [electionId]);

  const loadResults = useCallback(async () => {
    try {
      const response = await api.getResults(electionId);
      setResults(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  const loadEligibleVoters = useCallback(async () => {
    setEligibleLoading(true);
    setEligibleError('');
    try {
      // Route now guarantees pure JSON (no stray logs), so a single res.json() call is safe here.
      const voters = await fetchEligibleVoters(electionId);
      setEligibleVoters(voters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load eligible voters.';
      setEligibleError(message);
      setEligibleVoters([]);
    } finally {
      setEligibleLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadResults();
    loadElection();
  }, [loadResults, loadElection]);

  useEffect(() => {
    if (eligibleDialogOpen) {
      void loadEligibleVoters();
    }
  }, [eligibleDialogOpen, loadEligibleVoters]);

  const exportResults = () => {
    if (!results) return;

    const data = {
      election: {
        id: results.election_id,
        title: results.election_title,
        total_votes: results.total_votes,
        eligible_voters: results.eligible_voters,
        turnout_percentage: results.turnout_percentage,
      },
      results: results.results,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-results-${results.election_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner message="Loading results..." />;
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Alert variant="destructive">
              <AlertDescription>{error || 'Failed to load results'}</AlertDescription>
            </Alert>
            <Button onClick={onBack} className="mt-4">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCreator = election?.creator_id === user?.id;

  return (
    <PageContainer maxWidth="6xl">
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{results.election_title}</CardTitle>
                <CardDescription>Election Results</CardDescription>
              </div>
              <div className="flex space-x-2">
                {isCreator && onManage && (
                  <Button onClick={() => onManage(electionId)} variant="outline">
                    Manage
                  </Button>
                )}
                <Button onClick={exportResults} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Total Votes Cast</CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{results.total_votes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Eligible Voters</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => setEligibleDialogOpen(true)}
                className="text-3xl font-semibold text-indigo-600 hover:underline focus:outline-none"
              >
                {results.eligible_voters}
              </button>
              <p className="text-xs text-gray-500 mt-1">Click to view eligible voters</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Voter Turnout</CardTitle>
              <Award className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{results.turnout_percentage}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Results by Position */}
        {Object.entries(results.results).map(([positionId, positionData]: [string, PositionResult]) => {
          const chartData: ChartDataEntry[] = positionData.candidates.map((candidate: CandidateResult) => ({
            name: candidate.name,
            votes: candidate.votes,
            percentage: parseFloat(candidate.percentage),
          }));

          const winner = positionData.candidates[0];

          return (
            <Card key={positionId} className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{positionData.position_name}</CardTitle>
                    <CardDescription>
                      {positionData.ballot_type === 'single' && 'Single Choice'}
                      {positionData.ballot_type === 'multiple' && 'Multiple Choice'}
                      {positionData.ballot_type === 'ranked' && 'Ranked Choice'}
                    </CardDescription>
                  </div>
                  {winner && winner.votes > 0 && (
                    <Badge className="bg-green-600">
                      <Award className="w-3 h-3 mr-1" />
                      Winner: {winner.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Bar Chart */}
                <div className="mb-8">
                  <h4 className="text-sm mb-4">Vote Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="votes" fill="#6366f1" name="Votes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="mb-8">
                  <h4 className="text-sm mb-4">Vote Share</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ name, percentage }) => `${name} ${(percentage || 0).toFixed(1)}%`}
                      >
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Candidate List */}
                <div className="space-y-4">
                  <h4 className="text-sm">Candidate Breakdown</h4>
                  {positionData.candidates.map((candidate: CandidateResult) => (
                    <div
                      key={candidate.id}
                      className="p-4 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-gray-500">{candidate.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{candidate.votes}</p>
                        <p className="text-sm text-gray-500">{candidate.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Dialog open={eligibleDialogOpen} onOpenChange={setEligibleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Eligible Voters</DialogTitle>
              <DialogDescription>
                These are the pre-approved voters uploaded for this election.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {eligibleLoading ? (
                <div className="flex items-center justify-center py-6 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading eligible voters...
                </div>
              ) : eligibleError ? (
                <Alert variant="destructive">
                  <AlertDescription>{eligibleError}</AlertDescription>
                </Alert>
              ) : eligibleVoters.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No pre-approved voters found for this election.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y">
                  {eligibleVoters.map((voter) => (
                    <div key={voter.id} className="py-3 text-sm text-gray-800">
                      <span className="font-medium">
                        {voter.full_name || 'Pending Registration'}
                      </span>{' '}
                      [{voter.email}]
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
    </PageContainer>
  );
}
