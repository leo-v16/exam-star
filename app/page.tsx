"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Search, ChevronRight, BookOpen, Calendar as CalendarIcon, Clock } from "lucide-react";
import { getAllExams, getEvents, Exam, ExamEvent } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ModeToggle";
import FeedbackFab from "@/components/FeedbackFab";
import { differenceInCalendarDays, isSameDay, isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge";

const ENABLE_GLOW_ANIMATION = true;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [events, setEvents] = useState<ExamEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsData, eventsData] = await Promise.all([getAllExams(), getEvents()]);
        setExams(examsData);
        setEvents(eventsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const searchLower = query.toLowerCase();
    const name = exam.name || exam.id.replace(/-/g, " ");
    return name.toLowerCase().includes(searchLower);
  });

  const getExamStatus = (examId: string) => {
    // Filter events linked to this exam and type 'exam'
    const examEvents = events.filter(e => e.examId === examId && e.type === 'exam');
    if (examEvents.length === 0) return null;

    // Find the next upcoming or ongoing event
    const today = new Date();
    // Sort by date ascending
    const sortedEvents = examEvents.sort((a, b) => {
        const dateA = (a.date as any).toDate ? (a.date as any).toDate() : new Date(a.date);
        const dateB = (b.date as any).toDate ? (b.date as any).toDate() : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
    });

    // Find first event that is today or in future
    const upcomingEvent = sortedEvents.find(e => {
        const eventDate = (e.date as any).toDate ? (e.date as any).toDate() : new Date(e.date);
        // Reset time to start of day for comparison
        const d = new Date(eventDate); d.setHours(0,0,0,0);
        const t = new Date(today); t.setHours(0,0,0,0);
        return d >= t;
    });

    if (!upcomingEvent) return null;

    const eventDate = (upcomingEvent.date as any).toDate ? (upcomingEvent.date as any).toDate() : new Date(upcomingEvent.date);
    
    if (isSameDay(eventDate, today)) {
        return { label: "Exam Going On", color: "bg-green-500 hover:bg-green-600 text-white" };
    }

    const daysLeft = differenceInCalendarDays(eventDate, today);
    return { label: `${daysLeft} Days Left`, color: "bg-blue-500 hover:bg-blue-600 text-white" };
  };

  const gradients = [
    "from-blue-500 via-cyan-400 to-blue-500",
    "from-purple-500 via-pink-400 to-purple-500",
    "from-orange-400 via-red-400 to-orange-400",
    "from-emerald-400 via-green-500 to-emerald-400",
  ];

  const getShadowColor = (idx: number) => {
    const colors = [
      "shadow-blue-500/50", 
      "shadow-purple-500/50", 
      "shadow-orange-400/50", 
      "shadow-emerald-400/50"
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>

      {/* Hero Section */}
      <section className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-6 bg-muted/20 border-b">
        <div className="flex flex-col items-center gap-4">
          <div className="overflow-hidden flex items-center justify-center">
            <Image 
              src="/exam-star-main.png" 
              alt="ExamEdge Logo" 
              width={220} 
              height={220} 
              className="object-cover"
            />
          </div>
        </div>
        <div className="space-y-2 max-w-lg">
          <p className="text-muted-foreground text-lg">
            Access previous year questions and notes for your preparation.
          </p>
        </div>
        
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 h-12 text-base shadow-sm"
            placeholder="Search exams (e.g., JEE, NEET)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
            <div className="relative p-[2px] rounded-lg overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 via-violet-500 to-transparent bg-[length:400%_100%] animate-border-trace" />
                <Link href="/calendar" className="relative flex items-center bg-background hover:bg-accent/50 transition-colors rounded-lg px-4 py-2 text-sm font-medium text-foreground">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    View Exam Calendar
                </Link>
            </div>
        </div>
      </section>

      {/* Content Grid */}
      <main className="flex-1 p-6 container max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredExams.map((exam, idx) => {
              const displayName = exam.name || exam.id.replace(/-/g, " ");
              const gradient = gradients[idx % gradients.length];
              const shadowColor = getShadowColor(idx);
              const status = getExamStatus(exam.id);
              
              return (
                <Link href={`/exam/${exam.id}`} key={exam.id} className="block group h-full">
                  <Card className="h-full overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-hover:border-primary/50 relative">
                    
                    <div 
                      className={cn(
                        "h-2 w-full bg-gradient-to-r", 
                        "bg-[length:200%_auto]", 
                        gradient,
                        `shadow-[0_0_15px_-3px] ${shadowColor}`,
                        ENABLE_GLOW_ANIMATION && "animate-gradient-x"
                      )} 
                    />

                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="bg-muted p-2 rounded-md group-hover:bg-primary/10 transition-colors">
                          <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        {status && (
                            <Badge className={cn("text-[10px] px-2 py-0.5 shadow-sm font-semibold animate-in fade-in zoom-in duration-300", status.color)}>
                                {status.label === "Exam Going On" ? (
                                    <span className="flex items-center gap-1">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        Going On
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {status.label}
                                    </span>
                                )}
                            </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4 text-xl capitalize line-clamp-1">
                        {displayName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Comprehensive resources including notes, mindmaps, PYQs and many more.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      View Resources <ChevronRight className="ml-1 h-4 w-4" />
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="bg-muted p-4 rounded-full">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No exams found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                We couldn&apos;t find any exams matching &quot;{query}&quot;. Try searching for something else.
              </p>
            </div>
          </div>
        )}
      </main>
      <FeedbackFab />
    </div>
  );
}