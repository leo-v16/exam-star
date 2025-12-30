"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, BookOpen, Loader2, Eye } from "lucide-react";
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

  const ResourceItem = ({ item }: { item: Resource }) => (
    <Card 
        className="mb-3 hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => openViewer(item)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
            {item.type === "note" ? (
              <BookOpen className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-orange-500" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            {item.year && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit mt-0.5">
                {item.year}
              </span>
            )}
          </div>
        </div>
        <div className="text-muted-foreground">
            <Eye className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold truncate">{chapter}</h3>
                <p className="text-sm text-muted-foreground">
                    {subject} • {classLevel}
                </p>
            </div>

            <Tabs defaultValue="notes" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                <TabsTrigger value="pyqs">PYQs ({pyqs.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="notes" className="flex-1 min-h-0">
                    <ScrollArea className="h-[50vh] pr-4">
                        {notes.length > 0 ? (
                            notes.map((note) => <ResourceItem key={note.id} item={note} />)
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                                <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                                No notes available.
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
                
                <TabsContent value="pyqs" className="flex-1 min-h-0">
                    <ScrollArea className="h-[50vh] pr-4">
                        {pyqs.length > 0 ? (
                            pyqs.map((pyq) => <ResourceItem key={pyq.id} item={pyq} />)
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                                <FileText className="h-8 w-8 mb-2 opacity-20" />
                                No PYQs available.
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>

        {/* PDF Viewer Dialog */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col bg-background">
                <DialogHeader className="px-4 py-2 border-b">
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
                    {/* Transparent overlay to discourage right-clicks, but allow scrolling/interaction if possible via pointer-events logic.
                        However, for an iframe, pointer-events: none disables interaction entirely.
                        Since we want them to SCROLL the PDF, we cannot block pointer events on the iframe.
                        We can just rely on the sandbox and 'preview' mode for now. 
                    */}
                </div>
                <div className="p-2 border-t flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsViewerOpen(false)}>
                        Close Viewer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}