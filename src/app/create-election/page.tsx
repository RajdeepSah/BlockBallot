"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { dummyBackend, Position } from "@/services/dummyBackend";

export const dynamic = 'force-dynamic';

interface PositionForm {
  id: string;
  title: string;
  candidates: string[];
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function CreateElectionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState("17:00");
  const [positions, setPositions] = useState<PositionForm[]>([]);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [newCandidates, setNewCandidates] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPosition = () => {
    if (!newPositionTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a position title",
        variant: "destructive",
      });
      return;
    }

    const newPosition: PositionForm = {
      id: `pos-${Date.now()}`,
      title: newPositionTitle,
      candidates: [],
    };

    setPositions([...positions, newPosition]);
    setNewPositionTitle("");
    toast({
      title: "Position added",
      description: `"${newPositionTitle}" has been added`,
    });
  };

  const removePosition = (positionId: string) => {
    setPositions(positions.filter(p => p.id !== positionId));
    const newCands = { ...newCandidates };
    delete newCands[positionId];
    setNewCandidates(newCands);
  };

  const addCandidate = (positionId: string) => {
    const candidateName = newCandidates[positionId]?.trim();
    if (!candidateName) {
      toast({
        title: "Error",
        description: "Please enter a candidate name",
        variant: "destructive",
      });
      return;
    }

    setPositions(positions.map(p => {
      if (p.id === positionId) {
        return {
          ...p,
          candidates: [...p.candidates, candidateName],
        };
      }
      return p;
    }));

    setNewCandidates({
      ...newCandidates,
      [positionId]: "",
    });
  };

  const removeCandidate = (positionId: string, candidateIndex: number) => {
    setPositions(positions.map(p => {
      if (p.id === positionId) {
        return {
          ...p,
          candidates: p.candidates.filter((_, i) => i !== candidateIndex),
        };
      }
      return p;
    }));
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Election title is required", variant: "destructive" });
      return false;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "Election description is required", variant: "destructive" });
      return false;
    }
    if (!startDate || !endDate) {
      toast({ title: "Error", description: "Start and end dates are required", variant: "destructive" });
      return false;
    }
    if (positions.length === 0) {
      toast({ title: "Error", description: "At least one position is required", variant: "destructive" });
      return false;
    }
    for (const pos of positions) {
      if (pos.candidates.length < 2) {
        toast({ title: "Error", description: `Position "${pos.title}" needs at least 2 candidates`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    const startDateTime = new Date(startDate!);
    const [startHour, startMinute] = startTime.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

    const endDateTime = new Date(endDate!);
    const [endHour, endMinute] = endTime.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

    const electionData = {
      title,
      description,
      timezone,
      startDate: startDateTime,
      endDate: endDateTime,
      positions: positions.map(p => ({
        id: p.id,
        title: p.title,
        candidates: p.candidates.map(name => ({ name })),
      })),
    };

    try {
      const electionId = await dummyBackend.createElection(electionData);
      toast({
        title: "Election Created!",
        description: "Your election has been successfully created on the blockchain",
      });
      setTimeout(() => {
        router.push(`/vote/${electionId}`);
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create election. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Election Details</h1>
          
          <div className="space-y-6">
            {/* Election Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Election Title</Label>
              <Input
                id="title"
                placeholder="e.g., Student Council Election 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Election Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Election Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and context of this election..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Election Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date/Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            {/* End Date/Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Candidate Details Section */}
            <div className="border-t pt-6 space-y-4">
              <h2 className="text-2xl font-semibold">Candidate Details</h2>
              
              {/* Add Position */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter position title (e.g., President, Vice President)"
                  value={newPositionTitle}
                  onChange={(e) => setNewPositionTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                />
                <Button onClick={addPosition} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Positions List */}
              {positions.map((position) => (
                <Card key={position.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{position.title}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePosition(position.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Candidates for this position */}
                  <div className="space-y-2">
                    {position.candidates.map((candidate, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
                        <span>{candidate}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCandidate(position.id, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add candidate to this position */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter candidate name"
                      value={newCandidates[position.id] || ""}
                      onChange={(e) =>
                        setNewCandidates({
                          ...newCandidates,
                          [position.id]: e.target.value,
                        })
                      }
                      onKeyPress={(e) => e.key === 'Enter' && addCandidate(position.id)}
                    />
                    <Button onClick={() => addCandidate(position.id)} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
                {isSubmitting ? "Creating Election..." : "Create Election"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Election Creation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create this election? This will deploy a smart contract to the blockchain and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

