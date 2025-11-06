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
import { dummyBackend } from "@/services/dummyBackend";

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
  const [voterEmails, setVoterEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  // Checks if a string is a valid email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      return false;
    } else {
      return emailRegex.test(email);
    }
  };

  // Reads emails from the input text area and adds valid ones to the whitelist
  const addEmails = () => {
    // Split the string by commas and newlines
    const emailList = emailInput
      .split(/[,\n\r\s]+/)
      .filter(email => email.length > 0);

    // Get valid emails
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    for (const email of emailList) {
      if (isValidEmail(email)) {
        // Don't include duplicates
        if (!voterEmails.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    }

    // Add all valid emails to voterEmails
    if (validEmails.length > 0) {
      setVoterEmails([...voterEmails, ...validEmails]);
    }

    setEmailInput(invalidEmails.join('\n'));
  };

  // Remove an email from the whitelist by its index
  const removeEmail = (index: number) => {
    const removedEmail = voterEmails[index];
    console.log(voterEmails);
    setVoterEmails(voterEmails.filter((email, i) => i !== index));

    // Show notification that an email was removed
    toast({
      title: "Email Removed",
      description: `${removedEmail} removed from whitelist`,
    });
  };

  // Allows the user to upload a txt or csv file, adding its content to the text area
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get the file from the event
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // I don't think this stops people from renaming a file to a .csv/.txt
    // and then uploading it. But nobody is gonna do that right? :)
    const fileName = file.name.toLowerCase();
    const isValidFileType = 
      file.type.includes('text') || 
      fileName.endsWith('.csv') || 
      fileName.endsWith('.txt');

    if (!isValidFileType) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Text file (.csv, .txt)",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => { // the function called when the FileReader loads the file for reading
      try {
        const text = e.target?.result as string;
        if (text) {
          setEmailInput((emailInput + '\n' + text).trim()); // this is kinda wacky but its okay for now
          toast({
            title: "File Loaded",
            description: "File content loaded.",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read file content.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => { // the function called when the reader fails to load the file
      toast({
        title: "Error",
        description: "Failed to read file.",
        variant: "destructive",
      });
      event.target.value = "";
    };

    reader.readAsText(file); // load the file and try to read it
  };
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
    if (voterEmails.length === 0) {
      toast({ title: "Error", description: "At least one voter email is required", variant: "destructive" });
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
      voterEmails,
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

            {/* Authorized Voters Section */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Authorized Voters</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Only users with accounts linked to these email addresses will be authorized to participate in this election.
                </p>
              </div>
              {/* Upload File Button */}
              <div className="space-y-2">
                <Label htmlFor="emailFile">Upload Email List (CSV/Text)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="emailFile"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a .csv or .txt file containing email addresses (one per line or comma-separated)
                </p>
              </div>
              {/* Email Entry */}
              <div className="space-y-2">
                <Label htmlFor="bulkEmails">Email Addresses</Label>
                <Textarea
                  id="bulkEmails"
                  placeholder="Enter email addresses separated by commas or newlines (e.g., user1@example.com, user2@example.com)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  rows={6}
                />
                <Button onClick={addEmails} className="w-full">
                  Add All Emails
                </Button>
              </div>

              {/* List of Whitelisted Emails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Authorized Emails ({voterEmails.length})</Label>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {voterEmails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
                      <span className="text-sm">{email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEmail(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
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

