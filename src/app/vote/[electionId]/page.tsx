"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { dummyBackend, Election } from "@/services/dummyBackend";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default function VoteElectionPage() {
  const params = useParams();
  const electionId = params?.electionId as string;
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchElection = async () => {
      if (!electionId) {
        toast({
          title: "Error",
          description: "Invalid election ID",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      const electionData = await dummyBackend.getElection(electionId);
      if (!electionData) {
        toast({
          title: "Error",
          description: "Election not found",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setElection(electionData);
      setLoading(false);
    };

    fetchElection();
  }, [electionId, router]);

  const handleVoteChange = (positionId: string, candidateName: string) => {
    setSelectedCandidates({
      ...selectedCandidates,
      [positionId]: candidateName,
    });
  };

  const validateVote = (): boolean => {
    if (!election) return false;

    for (const position of election.positions) {
      if (!selectedCandidates[position.id]) {
        toast({
          title: "Incomplete Ballot",
          description: `Please select a candidate for "${position.title}"`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmitVote = async () => {
    if (!validateVote() || !electionId) return;

    setIsSubmitting(true);

    try {
      await dummyBackend.submitVote({
        electionId,
        votes: selectedCandidates,
      });

      toast({
        title: "Vote Submitted!",
        description: "Your vote has been recorded on the blockchain",
      });

      setTimeout(() => {
        router.push(`/results/${electionId}`);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!election) return null;

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Election Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{election.title}</h1>
              <p className="text-muted-foreground">{election.description}</p>
              <div className="text-sm text-muted-foreground pt-2">
                <p>
                  <span className="font-semibold">Start:</span>{" "}
                  {format(election.startDate, "PPP p")} ({election.timezone})
                </p>
                <p>
                  <span className="font-semibold">End:</span>{" "}
                  {format(election.endDate, "PPP p")} ({election.timezone})
                </p>
              </div>
            </div>

            {/* Voting Section */}
            <div className="border-t pt-6 space-y-6">
              <h2 className="text-2xl font-semibold">Cast Your Ballot</h2>

              {election.positions.map((position) => (
                <Card key={position.id} className="p-4 space-y-4">
                  <h3 className="text-xl font-semibold">{position.title}</h3>
                  
                  <RadioGroup
                    value={selectedCandidates[position.id] || ""}
                    onValueChange={(value) => handleVoteChange(position.id, value)}
                  >
                    {position.candidates.map((candidate) => (
                      <div key={candidate.name} className="flex items-center space-x-2">
                        <RadioGroupItem value={candidate.name} id={`${position.id}-${candidate.name}`} />
                        <Label
                          htmlFor={`${position.id}-${candidate.name}`}
                          className="text-base cursor-pointer flex-1 py-2"
                        >
                          {candidate.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>
              ))}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting Vote..." : "Submit Vote"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-destructive">Warning:</span> Once your vote is cast, it cannot be changed. This action is permanent and will be recorded on the blockchain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitVote} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Confirm Vote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

