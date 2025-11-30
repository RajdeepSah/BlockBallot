import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Upload,
  TrendingUp,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getElectionInvitePreview } from '@/emails/ElectionInviteEmail';
import { fetchEligibleVoters, type EligibleVoter } from '@/utils/eligible-voters';
import { Election, AccessRequest } from '@/types/election';
import { LoadingSpinner } from './ui/loading-spinner';
import { PageContainer } from './layouts/PageContainer';

interface AdminPanelProps {
  electionId: string;
  onBack: () => void;
  onViewResults: (electionId: string) => void;
}

/**
 * Admin panel component for managing election settings, voter eligibility, and access requests.
 *
 * @param props - Component props
 * @param props.electionId - The ID of the election to manage
 * @param props.onBack - Callback to navigate back
 * @param props.onViewResults - Callback to view election results
 * @returns The admin panel UI with tabs for voters, requests, and sharing
 */
export function AdminPanel({ electionId, onBack, onViewResults }: AdminPanelProps) {
  const { token } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [voterList, setVoterList] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [preapprovedVoters, setPreapprovedVoters] = useState<EligibleVoter[]>([]);
  const [loadingPreapproved, setLoadingPreapproved] = useState(false);

  const loadElection = useCallback(async () => {
    try {
      const response = await api.getElection(electionId);
      setElection(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load election';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  const loadAccessRequests = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.getAccessRequests(electionId, token);
      setAccessRequests(response.requests || []);
    } catch (err) {
      console.error('Failed to load access requests:', err);
    }
  }, [electionId, token]);

  const loadPreapprovedVoters = useCallback(async () => {
    setLoadingPreapproved(true);
    try {
      const voters = await fetchEligibleVoters(electionId);
      setPreapprovedVoters(voters);
    } catch (err) {
      console.error('Failed to load pre-approved voters:', err);
    } finally {
      setLoadingPreapproved(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadElection();
  }, [loadElection]);

  useEffect(() => {
    loadAccessRequests();
    loadPreapprovedVoters();
  }, [loadAccessRequests, loadPreapprovedVoters]);

  const handleUploadVoters = async () => {
    if (!voterList.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const emails = voterList
        .split(/[\n,\s]+/)
        .map((email) => email.trim())
        .filter((email) => email && email.includes('@'));
      if (emails.length === 0) {
        setError('No valid email addresses found');
        setUploading(false);
        return;
      }

      await api.uploadEligibility(electionId, emails, token!);
      setSuccess(`Successfully added ${emails.length} voters to the eligibility list`);
      setVoterList('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload voter list';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleAccessRequest = async (requestId: string, action: 'approve' | 'deny') => {
    try {
      setError('');
      await api.updateAccessRequest(electionId, requestId, action, token!);
      await loadAccessRequests();
      await loadPreapprovedVoters();
      setSuccess(`Access request ${action}d successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${action} access request`;
      setError(message);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getInvitationLink = () => {
    if (typeof window === 'undefined' || !election) {
      return '';
    }
    return `${window.location.origin}/vote/${election.id}`;
  };

  const invitationLink = getInvitationLink();
  const emailPreview = election
    ? getElectionInvitePreview({
        electionName: election.title,
        electionCode: election.code,
        directLink: invitationLink,
        startTime: election.starts_at,
        endTime: election.ends_at,
      })
    : '';

  const handleSendInvites = async () => {
    if (!election) {
      toast.error('Election data is still loading.');
      return;
    }
    if (!token) {
      toast.error('You must be signed in to send invitations.');
      return;
    }

    setSendingInvites(true);
    try {
      const response = await fetch('/api/send-election-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          electionId: election.id,
          electionName: election.title,
          electionCode: election.code,
          directLink: invitationLink,
          startTime: election.starts_at,
          endTime: election.ends_at,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations.');
      }

      const sentCount = data.sentCount ?? 0;
      toast.success(
        sentCount === 0
          ? (data.message as string) || 'No invitations were sent.'
          : `Sent ${sentCount} invitation${sentCount === 1 ? '' : 's'} successfully.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitations.';
      toast.error(message);
    } finally {
      setSendingInvites(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!election) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 page-container">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="mb-2 text-xl">Election Not Found</h3>
            <Button onClick={onBack}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = accessRequests.filter((r) => r.status === 'pending');

  return (
    <PageContainer maxWidth="6xl">
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{election.title}</CardTitle>
          <CardDescription>Admin Panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600">Election Code</p>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-lg">{election.code}</p>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(election.code)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
              <TrendingUp className="mr-2 h-4 w-4" />
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
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="voters" className="space-y-6">
        <TabsList>
          <TabsTrigger value="voters">
            <Users className="mr-2 h-4 w-4" />
            Voter Eligibility
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserCheck className="mr-2 h-4 w-4" />
            Access Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="share">
            <Copy className="mr-2 h-4 w-4" />
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
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload Voter List'}
              </Button>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 text-sm">📋 CSV/Excel Instructions</h4>
                <p className="text-xs text-gray-700">
                  For large lists, prepare your emails in a spreadsheet, copy the email column, and
                  paste it above. Each email should be on a new line.
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
                <div className="py-8 text-center text-gray-500">
                  <UserCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p>No access requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <p>{request.user_name}</p>
                        <p className="text-sm text-gray-600">{request.user_email}</p>
                        <p className="mt-1 text-xs text-gray-500">
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
                              <UserCheck className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAccessRequest(request.id, 'deny')}
                              size="sm"
                              variant="outline"
                            >
                              <UserX className="mr-1 h-4 w-4" />
                              Deny
                            </Button>
                          </>
                        ) : (
                          <Badge variant={request.status === 'approved' ? 'default' : 'outline'}>
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pre-Approved Voters</CardTitle>
              <CardDescription>
                These voters were uploaded in the eligibility list and can access the ballot
                immediately
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPreapproved ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading pre-approved voters...
                </div>
              ) : preapprovedVoters.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p>No pre-approved voters uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preapprovedVoters.map((voter) => (
                    <div key={voter.id} className="flex flex-col rounded-lg border p-4">
                      <span className="font-medium text-gray-900">
                        {voter.full_name || 'Pending Registration'} [{voter.email}]
                      </span>
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
                <label className="mb-2 block text-sm text-gray-600">Election Code</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 rounded-lg border bg-gray-50 p-3 text-center font-mono text-xl">
                    {election.code}
                  </div>
                  <Button onClick={() => copyToClipboard(election.code)} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Voters can enter this code on the dashboard to find your election
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-600">Direct Link</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 break-all rounded-lg border bg-gray-50 p-3 text-sm">
                    {invitationLink}
                  </div>
                  <Button onClick={() => copyToClipboard(invitationLink)} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Share this link directly with voters</p>
              </div>

              <div className="space-y-2">
                <Button onClick={handleSendInvites} disabled={sendingInvites || !token}>
                  {sendingInvites ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Email Invitation'
                  )}
                </Button>
                <p className="text-xs text-gray-500">
                  Emails are only sent to verified voters and include the latest election details.
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-1 text-sm">📧 Email Template</h4>
                <p className="mb-3 text-xs text-gray-600">
                  Preview of the invitation voters receive.
                </p>
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-800">
                  {emailPreview}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
