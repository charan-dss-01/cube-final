import "./globals.css";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "CUBE Operations Platform — Autonomous Logistics & Multi-Agent Evidence Command Center",
  description: "Enterprise Operations Command Center & 5-Agent Autonomous Logistics Evidence Orchestration Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FBFBFA] text-[#0F172A] min-h-screen antialiased">
        <WorkspaceProvider>
          <AppShell>
            {children}
          </AppShell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
