"use client";

import React, { useState, useEffect } from "react";
import { getSuggestionsAction, deleteSuggestionAction, Suggestion } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Trash2, MessageSquare } from "lucide-react";

export default function SuggestionsList() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const result = await getSuggestionsAction();
      if (result.success && result.data) {
        setSuggestions(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
    
    // Optimistic Update
    setSuggestions(suggestions.filter((s) => s.id !== id));
    
    if (selectedSuggestion?.id === id) setIsDialogOpen(false);

    try {
      await deleteSuggestionAction(id);
    } catch (error) {
        console.error("Delete error", error);
        fetchSuggestions(); // Revert on error
    }
  };

  const openSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsDialogOpen(true);
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Suggestions</CardTitle>
          <CardDescription>Review feedback submitted by users.</CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
              <p>No suggestions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id} 
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors cursor-pointer w-full overflow-hidden"
                  onClick={() => openSuggestion(suggestion)}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="text-sm line-clamp-2 break-words whitespace-pre-wrap">
                      {suggestion.content}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                      {new Date(suggestion.createdAt).toLocaleDateString()} • {new Date(suggestion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8 transition-colors"
                      onClick={(e) => handleDelete(e, suggestion.id)}
                  >
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden bg-background">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Suggestion Details</DialogTitle>
            <DialogDescription>
                Submitted on {selectedSuggestion && new Date(selectedSuggestion.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto p-6">
              <p className="whitespace-pre-wrap break-words break-all text-sm leading-relaxed w-full">
                  {selectedSuggestion?.content}
              </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
