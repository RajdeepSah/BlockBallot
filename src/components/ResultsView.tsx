import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, Users, Award, Download } from 'lucide-react';

interface ResultsViewProps {
  electionId: string;
  onBack: () => void;
  onManage?: (electionId: string) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export function ResultsView({ electionId, onBack, onManage }: ResultsViewProps) {
  const { token, user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResults();
    loadElection();
  }, [electionId]);

  const loadElection = async () => {
    try {
      const response = await api.getElection(electionId);
      setElection(response);
    } catch (err: any) {
      console.error('Failed to load election:', err);
    }
  };

  const loadResults = async () => {
    try {
      const response = await api.getResults(electionId, token);
      setResults(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!results) return;

    const data = {
      election: {
        id: results.election_id,
        title: results.election_title,
        total_votes: results.total_votes,
        eligible_voters: results.eligible_voters,
        turnout_percentage: results.turnout_percentage
      },
      results: results.results
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={onBack} className="mt-4">Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCreator = election?.creator_id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="text-3xl">{results.eligible_voters}</div>
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
        {Object.entries(results.results).map(([positionId, positionData]: [string, any]) => {
          const chartData = positionData.candidates.map((candidate: any) => ({
            name: candidate.name,
            votes: candidate.votes,
            percentage: parseFloat(candidate.percentage)
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
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="votes" fill="#6366f1" name="Votes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="mb-8">
                  <h4 className="text-sm mb-4">Vote Percentage</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="votes"
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Candidate Details Table */}
                <div>
                  <h4 className="text-sm mb-4">Detailed Results</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Candidate
                          </th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Votes
                          </th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {positionData.candidates.map((candidate: any, index: number) => (
                          <tr key={candidate.id} className={index === 0 && candidate.votes > 0 ? 'bg-green-50' : ''}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {index === 0 && candidate.votes > 0 && (
                                  <Award className="w-4 h-4 text-green-600 mr-2" />
                                )}
                                <span>{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p>{candidate.name}</p>
                                {candidate.description && (
                                  <p className="text-xs text-gray-500">{candidate.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{candidate.votes}</td>
                            <td className="px-4 py-3">{candidate.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {results.total_votes === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Votes Yet</h3>
              <p className="text-gray-600">
                Results will appear here once voters start casting their ballots
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
