import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TimeThemeSetter } from "@/components/time-theme-setter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "Exam Star";
const SITE_URL = "https://exam-star.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Exam Star – Notes, PYQs & Exam Resources",
    template: "%s | Exam Star",
  },
  description:
    "Access previous year questions, notes, and exam resources for competitive exams in one place.",
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/exam-star.png",
    apple: "/exam-star.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Exam Star – Find Your Exam Resources",
    description:
      "Previous year questions, notes, and exam resources for your preparation.",
    siteName: SITE_NAME,
    images: [
      {
        url: "/exam-star.png",
        width: 512,
        height: 512,
        alt: "Exam Star Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Structured data: Site name + logo */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: "ExamStar",
              url: SITE_URL,
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/exam-star.png`,
            }),
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TimeThemeSetter />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
