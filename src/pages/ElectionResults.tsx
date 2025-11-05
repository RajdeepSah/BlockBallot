import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { dummyBackend, Election, Position } from "@/services/dummyBackend";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Trophy, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ElectionResults = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!electionId) {
        toast({
          title: "Error",
          description: "Invalid election ID",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const electionData = await dummyBackend.getElection(electionId);
      if (!electionData) {
        toast({
          title: "Error",
          description: "Election not found",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const resultsData = await dummyBackend.getElectionResults(electionId);
      
      setElection(electionData);
      setResults(resultsData);
      setLoading(false);
    };

    fetchResults();
  }, [electionId, navigate]);

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

  const getTotalVotes = (position: Position): number => {
    return position.candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
  };

  const getVotePercentage = (votes: number, total: number): number => {
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Election Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Election Results</h1>
              </div>
              <h2 className="text-2xl font-semibold text-muted-foreground">{election.title}</h2>
              <p className="text-muted-foreground">{election.description}</p>
              
              <div className="text-sm text-muted-foreground pt-2 space-y-1">
                <p>
                  <span className="font-semibold">Started:</span>{" "}
                  {format(election.startDate, "PPP p")}
                </p>
                <p>
                  <span className="font-semibold">Ended:</span>{" "}
                  {format(election.endDate, "PPP p")}
                </p>
                <p>
                  <span className="font-semibold">Timezone:</span> {election.timezone}
                </p>
              </div>
            </div>

            {/* Results Section */}
            <div className="border-t pt-6 space-y-6">
              <h3 className="text-xl font-semibold">Results by Position</h3>

              {results.map((position) => {
                const totalVotes = getTotalVotes(position);
                const winner = position.candidates[0]; // Candidates are already sorted by votes

                return (
                  <Card key={position.id} className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">{position.title}</h4>
                      <span className="text-sm text-muted-foreground">
                        {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {position.candidates.map((candidate, index) => {
                        const votes = candidate.votes || 0;
                        const percentage = getVotePercentage(votes, totalVotes);
                        const isWinner = index === 0 && votes > 0;

                        return (
                          <div
                            key={candidate.name}
                            className={`p-3 rounded-lg border ${
                              isWinner ? 'bg-primary/5 border-primary' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isWinner && (
                                  <Trophy className="h-4 w-4 text-primary" />
                                )}
                                <span className={`font-medium ${isWinner ? 'text-primary' : ''}`}>
                                  {candidate.name}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-semibold">{votes}</span>{" "}
                                <span className="text-muted-foreground">
                                  ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/")}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate("/create-election")}
              >
                Create New Election
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ElectionResults;
