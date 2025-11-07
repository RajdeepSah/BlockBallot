import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Users, UserCheck, UserX, Upload, TrendingUp, Copy, Check } from 'lucide-react';

interface AdminPanelProps {
  electionId: string;
  onBack: () => void;
  onViewResults: (electionId: string) => void;
}

export function AdminPanel({ electionId, onBack, onViewResults }: AdminPanelProps) {
  const { token } = useAuth();
  const [election, setElection] = useState<any>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [voterList, setVoterList] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadElection();
    loadAccessRequests();
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

  const loadAccessRequests = async () => {
    try {
      const response = await api.getAccessRequests(electionId, token!);
      setAccessRequests(response.requests || []);
    } catch (err: any) {
      console.error('Failed to load access requests:', err);
    }
  };

  const handleUploadVoters = async () => {
    if (!voterList.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Parse emails from textarea (comma or newline separated)
      const emails = voterList
        .split(/[\n,]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      if (emails.length === 0) {
        setError('No valid email addresses found');
        setUploading(false);
        return;
      }

      await api.uploadEligibility(electionId, emails, token!);
      setSuccess(`Successfully added ${emails.length} voters to the eligibility list`);
      setVoterList('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload voter list');
    } finally {
      setUploading(false);
    }
  };

  const handleAccessRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      setError('');
      await api.updateAccessRequest(electionId, requestId, action, token!);
      await loadAccessRequests();
      setSuccess(`Access request ${action}d successfully`);
    } catch (err: any) {
      setError(err.message || `Failed to ${action} access request`);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getInvitationLink = () => {
    return `${window.location.origin}?election=${election.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl mb-2">Election Not Found</h3>
            <Button onClick={onBack}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{election.title}</CardTitle>
            <CardDescription>Admin Panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Election Code</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-lg">{election.code}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(election.code)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Starts</p>
                <p>{new Date(election.starts_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ends</p>
                <p>{new Date(election.ends_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => onViewResults(electionId)} className="w-full md:w-auto">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="voters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="voters">
              <Users className="w-4 h-4 mr-2" />
              Voter Eligibility
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserCheck className="w-4 h-4 mr-2" />
              Access Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="share">
              <Copy className="w-4 h-4 mr-2" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Upload Voter Eligibility List</CardTitle>
                <CardDescription>
                  Add voters who are pre-approved to participate in this election
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm">
                    Enter email addresses (one per line or comma-separated)
                  </label>
                  <Textarea
                    placeholder="voter1@example.com&#10;voter2@example.com&#10;voter3@example.com"
                    value={voterList}
                    onChange={(e) => setVoterList(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Voters with these email addresses will be automatically eligible to vote
                  </p>
                </div>

                <Button 
                  onClick={handleUploadVoters} 
                  disabled={uploading || !voterList.trim()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Voter List'}
                </Button>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm mb-2">📋 CSV/Excel Instructions</h4>
                  <p className="text-xs text-gray-700">
                    For large lists, prepare your emails in a spreadsheet, copy the email column, 
                    and paste it above. Each email should be on a new line.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Access Requests</CardTitle>
                <CardDescription>
                  Review and approve requests from voters not on the pre-approved list
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No access requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accessRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p>{request.user_name}</p>
                          <p className="text-sm text-gray-600">{request.user_email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested: {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' ? (
                            <>
                              <Button
                                onClick={() => handleAccessRequest(request.id, 'approve')}
                                size="sm"
                                variant="default"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleAccessRequest(request.id, 'deny')}
                                size="sm"
                                variant="outline"
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Deny
                              </Button>
                            </>
                          ) : (
                            <Badge
                              variant={request.status === 'approved' ? 'default' : 'outline'}
                            >
                              {request.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share">
            <Card>
              <CardHeader>
                <CardTitle>Share Election</CardTitle>
                <CardDescription>
                  Share the election code or invitation link with voters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Election Code</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-xl text-center">
                      {election.code}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(election.code)}
                      variant="outline"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Voters can enter this code on the dashboard to find your election
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Direct Link</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg text-sm break-all">
                      {getInvitationLink()}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(getInvitationLink())}
                      variant="outline"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this link directly with voters
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm mb-2">📧 Email Template</h4>
                  <div className="text-xs text-gray-700 space-y-2">
                    <p>Subject: You're invited to vote in {election.title}</p>
                    <p>
                      You've been invited to participate in the {election.title}. 
                    </p>
                    <p>
                      Election Code: <strong>{election.code}</strong>
                    </p>
                    <p>
                      Or use this direct link: {getInvitationLink()}
                    </p>
                    <p>
                      Voting Period: {new Date(election.starts_at).toLocaleString()} - {new Date(election.ends_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
