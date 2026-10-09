"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SmoothScroll from "./SmoothScroll";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  // When visiting the landing page (/), render full-width without the dashboard sidebar
  if (isLanding) {
    return (
      <SmoothScroll>
        <div className="min-h-screen w-full bg-[#FBFBFA] text-[#0F172A] overflow-x-hidden selection:bg-[#0F766E]/15 selection:text-[#0F766E]">
          {children}
        </div>
      </SmoothScroll>
    );
  }

  // When visiting dashboard or internal routes, render sticky sidebar + full-document scrolling main area
  return (
    <SmoothScroll>
      <div className="flex min-h-screen w-full bg-[#FBFBFA] text-[#0F172A]">
        {/* 1. STICKY SIDEBAR: Pinned at left viewport height, non-scrolling with page content */}
        <Sidebar />

        {/* 2. MAIN AREA: Begins at sidebar right edge, natural full document height */}
        <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FBFBFA]">
          {children}
        </main>
      </div>
    </SmoothScroll>
  );
}
