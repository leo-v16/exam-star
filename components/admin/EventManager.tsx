"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
  Plus,
  CalendarDays,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addEvent, deleteEvent, getEvents, getAllExams, ExamEvent, Exam } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";

export default function EventManager() {
  const [events, setEvents] = useState<ExamEvent[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<"exam" | "registration" | "result" | "other">("exam");
  const [description, setDescription] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsData, examsData] = await Promise.all([getEvents(), getAllExams()]);
      
      // Sort events by date (newest/upcoming first)
      const sortedEvents = eventsData.sort((a: any, b: any) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });
      
      setEvents(sortedEvents);
      setExams(examsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !date) {
      alert("Please provide a title and date.");
      return;
    }

    setIsSaving(true);
    try {
      await addEvent({
        title,
        date,
        type,
        description,
        ...(selectedExamId && { examId: selectedExamId }),
      });

      // Reset form
      setTitle("");
      setDate(new Date());
      setDescription("");
      setType("exam");
      setSelectedExamId("");

      // Refresh list
      const data = await getEvents();
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });
      setEvents(sortedData);
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Failed to save event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <div className="grid gap-8 w-full">
      <Card className="max-w-2xl mx-auto border-dashed shadow-sm w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Manage Schedule
          </CardTitle>
          <CardDescription>
            Add important dates like exams, registrations, or results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Add Event Form */}
          <div className="space-y-4 border p-5 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                New Event
              </h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Event Title</Label>
                <Input
                  placeholder="e.g. JEE Mains Session 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(val: any) => setType(val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">Exam Date</SelectItem>
                      <SelectItem value="registration">Registration</SelectItem>
                      <SelectItem value="result">Result Declaration</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Link to Exam (Optional)</Label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select an exam to link..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>{exam.name || exam.id}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Brief details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-2"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Event
              </Button>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Upcoming Events</h3>
              <Badge variant="secondary">{events.length} Total</Badge>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading schedule...
                  </p>
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => {
                    const eventDate = (event.date as any).toDate
                      ? (event.date as any).toDate()
                      : new Date(event.date);

                    return (
                      <div
                        key={event.id}
                        className="group flex items-center gap-3 p-2.5 border rounded-lg bg-card hover:border-primary/30 transition-all"
                      >
                        {/* Compact Date Box */}
                        <div className="flex flex-col items-center justify-center min-w-[45px] h-11 bg-muted/30 rounded-md border">
                          <span className="text-base font-bold leading-none text-primary">
                            {format(eventDate, "d")}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {format(eventDate, "MMM")}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {event.title}
                            </h4>
                            <Badge
                              variant={
                                event.type === "exam"
                                  ? "destructive"
                                  : event.type === "registration"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[9px] h-4 px-1 shadow-none capitalize"
                            >
                              {event.type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            {event.examId && (
                                <span className="text-[10px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 truncate max-w-[120px]">
                                    {exams.find(e => e.id === event.examId)?.name || event.examId}
                                </span>
                            )}
                            {event.description && (
                              <span className="text-[11px] text-muted-foreground truncate italic">
                                {event.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete Action */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => event.id && handleDelete(event.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/5 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-sm">No events found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Your schedule is empty. Add an event above to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}