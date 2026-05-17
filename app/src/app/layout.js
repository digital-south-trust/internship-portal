import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ReportIssue } from "@/components/ReportIssue";
import { SessionManager } from "@/components/SessionManager";
import { SystemCron } from "@/components/SystemCron";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InternPortal - Internship Management Platform",
  description: "Manage internships, projects, schedules, and more. A complete portal for interns and administrators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionManager />
        <SystemCron />
        {children}
        <Toaster position="top-center" />
        <ReportIssue />
      </body>
    </html>
  );
}
