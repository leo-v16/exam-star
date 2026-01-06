import { Metadata } from "next";
import { getExamAction } from "@/app/actions";
import ExamView from "@/components/ExamView";

interface Props {
  params: Promise<{ examId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examId } = await params;
  const result = await getExamAction(examId);

  if (result.success && result.data) {
    const exam = result.data;
    const displayName = exam.name || exam.id.replace(/-/g, " ");
    return {
      title: `${displayName} Resources - Notes & PYQs | ExamEdge`,
      description: `Access previous year questions (PYQs) and study notes for ${displayName}. Prepare for your exams with ExamEdge.`,
      openGraph: {
        title: `${displayName} Preparation Resources`,
        description: `Get the best notes and PYQs for ${displayName} on ExamEdge.`,
        type: "article",
      },
    };
  }

  return {
    title: "Exam Not Found | ExamEdge",
    description: "The requested exam resources could not be found.",
  };
}

export default async function ExamPage({ params }: Props) {
  const { examId } = await params;
  const result = await getExamAction(examId);
  
  const displayName = result.success && result.data ? (result.data.name || examId.replace(/-/g, " ")) : examId;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://examstar.vercel.app';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${displayName} Resources`,
    "description": `Access previous year questions and notes for ${displayName}.`,
    "url": `${baseUrl}/exam/${examId}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": displayName,
          "item": `${baseUrl}/exam/${examId}`
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExamView examId={examId} />
    </>
  );
}