"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Assuming we don't have a specific Textarea component yet, I'll use standard or check if available.
import { MessageSquarePlus, Loader2, Send } from "lucide-react";
import { submitSuggestionAction } from "@/app/actions";

export default function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const result = await submitSuggestionAction(content);
      if (result.success) {
        setSubmitted(true);
        setContent("");
        setTimeout(() => {
            setOpen(false);
            setSubmitted(false);
        }, 2000);
      } else {
        alert("Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:scale-110 hover:rotate-6 active:scale-95 transition-all duration-300 border-2 border-background bg-primary text-primary-foreground"
          >
            <MessageSquarePlus className="h-6 w-6" />
            <span className="sr-only">Give Feedback</span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Have a suggestion?</DialogTitle>
          <DialogDescription>
            We'd love to hear your thoughts on how to improve ExamStar.
          </DialogDescription>
        </DialogHeader>
        
        {!submitted ? (
            <div className="grid gap-4 py-4">
            <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type your suggestion here..."
                value={content}
                maxLength={500}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end">
                <span className={`text-xs ${content.length >= 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {content.length}/500
                </span>
            </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Send className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">Thank You!</h3>
                <p className="text-muted-foreground text-sm">Your feedback has been received.</p>
            </div>
        )}

        {!submitted && (
            <DialogFooter>
            <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    "Submit Suggestion"
                )}
            </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
