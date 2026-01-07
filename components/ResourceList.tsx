"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, BookOpen, Loader2, Eye, PenTool } from "lucide-react";
import { getResources, Resource } from "@/lib/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface ResourceListProps {
  examId: string;
  subject: string;
  classLevel: string;
  chapter: string;
}

export default function ResourceList({ examId, subject, classLevel, chapter }: ResourceListProps) {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // Viewer State
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchResources = async () => {
      setLoading(true);
      try {
        const data = await getResources(examId, subject, classLevel, chapter);
        if (isMounted) {
          setResources(data);
        }
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      isMounted = false;
    };
  }, [examId, subject, classLevel, chapter]);

  const notes = resources.filter((r) => r.type === "note");
  const pyqs = resources.filter((r) => r.type === "pyq");
  const practice = resources.filter((r) => r.type === "practice");

  // Determine which tabs to show
  const showNotes = notes.length > 0;
  const showPyqs = pyqs.length > 0;
  const showPractice = practice.length > 0;

  // Calculate default tab (priority: notes -> pyqs -> practice)
  const defaultTab = showNotes ? "notes" : showPyqs ? "pyqs" : showPractice ? "practice" : "";
  
  // Calculate grid columns
  const visibleTabsCount = [showNotes, showPyqs, showPractice].filter(Boolean).length;
  const gridColsClass = visibleTabsCount === 1 ? "grid-cols-1" : visibleTabsCount === 2 ? "grid-cols-2" : "grid-cols-3";

  const openViewer = (resource: Resource) => {
    setSelectedResource(resource);
    setIsViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- UPDATED RESOURCE ITEM (Flattened Structure) ---
  const ResourceItem = ({ item }: { item: Resource }) => (
    <div 
      className="flex items-center gap-3 p-3 mb-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.99] w-full"
      onClick={() => openViewer(item)}
    >
      {/* 1. Icon: Fixed width (shrink-0) */}
      <div className="bg-primary/10 p-2 rounded-full shrink-0 flex items-center justify-center h-9 w-9">
        {item.type === "note" ? (
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        ) : item.type === "practice" ? (
          <PenTool className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
        ) : (
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
        )}
      </div>

      {/* 2. Text: Grid + min-w-0 ensures truncation works perfectly */}
      <div className="flex-1 min-w-0 grid gap-0.5">
        <h4 className="font-medium text-sm leading-tight truncate" title={item.title}>
          {item.title}
        </h4>
        {item.year && (
          <div className="flex">
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
              {item.year}
            </span>
          </div>
        )}
      </div>

      {/* 3. Action Icon: Fixed width (shrink-0) */}
      <div className="text-muted-foreground shrink-0">
        <Eye className="h-4 w-4" />
      </div>
    </div>
  );

  return (
    <>
        <div className="h-full flex flex-col w-full max-w-full overflow-hidden">
            <div className="mb-4 shrink-0">
                <h3 className="text-lg font-semibold truncate">{chapter}</h3>
                <p className="text-sm text-muted-foreground truncate">
                    {subject} • {classLevel}
                </p>
            </div>

            {visibleTabsCount > 0 ? (
                <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col min-h-0">
                    <TabsList className={`grid w-full ${gridColsClass} mb-4 shrink-0`}>
                      {showNotes && <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>}
                      {showPyqs && <TabsTrigger value="pyqs">PYQs ({pyqs.length})</TabsTrigger>}
                      {showPractice && <TabsTrigger value="practice">Practice ({practice.length})</TabsTrigger>}
                    </TabsList>
                    
                    {/* Notes Tab Content */}
                    {showNotes && (
                        <TabsContent value="notes" className="flex-1 min-h-0 w-full mt-0">
                            <ScrollArea className="h-full w-full">
                                <div className="flex flex-col p-1 pr-3 w-full">
                                    {notes.map((note) => <ResourceItem key={note.id} item={note} />)}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    )}
                    
                    {/* PYQs Tab Content */}
                    {showPyqs && (
                        <TabsContent value="pyqs" className="flex-1 min-h-0 w-full mt-0">
                            <ScrollArea className="h-full w-full">
                                <div className="flex flex-col p-1 pr-3 w-full">
                                    {pyqs.map((pyq) => <ResourceItem key={pyq.id} item={pyq} />)}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    )}

                    {/* Practice Tab Content */}
                    {showPractice && (
                        <TabsContent value="practice" className="flex-1 min-h-0 w-full mt-0">
                            <ScrollArea className="h-full w-full">
                                <div className="flex flex-col p-1 pr-3 w-full">
                                    {practice.map((prac) => <ResourceItem key={prac.id} item={prac} />)}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    )}
                </Tabs>
            ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm flex-1">
                    <BookOpen className="h-10 w-10 mb-2 opacity-20" />
                    <p>No resources available for this chapter yet.</p>
                </div>
            )}
        </div>

        {/* PDF Viewer Dialog */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col bg-background w-[95vw] sm:w-full">
                <DialogHeader className="px-4 py-2 border-b shrink-0">
                    <DialogTitle className="truncate pr-8 text-base">
                        {selectedResource?.title}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 w-full bg-black/5 relative overflow-hidden">
                    {selectedResource && (
                        <iframe
                            src={selectedResource.fileUrl}
                            className="w-full h-full border-none"
                            title="PDF Viewer"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                            loading="lazy"
                        />
                    )}
                </div>
                <div className="p-2 border-t flex justify-end shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setIsViewerOpen(false)}>
                        Close Viewer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}