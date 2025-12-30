"use client";

import React, { useState, useEffect } from "react";
import { getAllExams, Exam, addResource } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Link as LinkIcon, Save } from "lucide-react";

export default function ResourceUploader() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // Selection States
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  // Form States
  const [resourceType, setResourceType] = useState<"note" | "pyq">("note");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [driveLink, setDriveLink] = useState("");

  // Action States
  const [isSaving, setIsSaving] = useState(false);

  // Derived Data (Cascading Logic)
  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const subjects = selectedExam?.structure.subjects || [];
  
  const selectedSubjectData = subjects.find((s) => s.name === selectedSubject);
  const classes = selectedSubjectData?.classes || [];

  const selectedClassData = classes.find((c) => c.name === selectedClass);
  const chapters = selectedClassData?.chapters || [];

  // Fetch exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await getAllExams();
        setExams(data);
      } catch (error) {
        console.error("Failed to load exams:", error);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  const resetForm = () => {
    setTitle("");
    setYear("");
    setDriveLink("");
  };

  const handleSave = async () => {
    if (!selectedExamId || !selectedSubject || !selectedClass || !selectedChapter || !title || !driveLink) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);

    try {
      // --- NEW LOGIC START ---
      // Convert "view" links to "preview" for embedding
      let finalUrl = driveLink;
      if (finalUrl.includes("drive.google.com") && finalUrl.includes("/view")) {
        finalUrl = finalUrl.replace("/view", "/preview");
      }
      // --- NEW LOGIC END ---

      // 2. Add Resource Document
      await addResource({
        examId: selectedExamId,
        subject: selectedSubject,
        class: selectedClass,
        chapter: selectedChapter,
        type: resourceType,
        title: title,
        fileUrl: finalUrl,
        ...(resourceType === "pyq" && { year }),
      });

      alert("Resource saved successfully!");
      resetForm();

    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save resource.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingExams) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-dashed shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-6 w-6" />
          Add Resource Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* 1. Hierarchy Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Exam</Label>
            <Select value={selectedExamId} onValueChange={(val) => {
              setSelectedExamId(val);
              setSelectedSubject("");
              setSelectedClass("");
              setSelectedChapter("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name || exam.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select 
              value={selectedSubject} 
              onValueChange={(val) => {
                setSelectedSubject(val);
                setSelectedClass("");
                setSelectedChapter("");
              }}
              disabled={!selectedExamId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((sub) => (
                  <SelectItem key={sub.name} value={sub.name}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select 
              value={selectedClass} 
              onValueChange={(val) => {
                setSelectedClass(val);
                setSelectedChapter("");
              }}
              disabled={!selectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.name} value={cls.name}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chapter</Label>
            <Select 
              value={selectedChapter} 
              onValueChange={setSelectedChapter}
              disabled={!selectedClass}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chap) => (
                  <SelectItem key={chap} value={chap}>{chap}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t my-4" />

        {/* 2. Resource Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Resource Type</Label>
            <RadioGroup 
              defaultValue="note" 
              value={resourceType} 
              onValueChange={(val: "note" | "pyq") => setResourceType(val)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="note" id="r-note" />
                <Label htmlFor="r-note">Notes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pyq" id="r-pyq" />
                <Label htmlFor="r-pyq">PYQ (Past Year Question)</Label>
              </div>
            </RadioGroup>
          </div>

          {resourceType === "pyq" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Year</Label>
              <Input 
                type="number" 
                placeholder="e.g. 2023" 
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              placeholder="e.g. Chapter 1 Summary or 2023 Question Paper" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Google Drive Link</Label>
            <Input 
                type="text" 
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
                Make sure the file permission in Drive is set to <strong>&quot;Anyone with the link&quot;</strong>.
            </p>
          </div>
        </div>

        {/* 3. Action */}
        <div className="pt-4">
            <Button 
                onClick={handleSave} 
                className="w-full gap-2"
                disabled={isSaving || !selectedChapter || !title || !driveLink}
            >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Resource"}
            </Button>
        </div>

      </CardContent>
    </Card>
  );
}