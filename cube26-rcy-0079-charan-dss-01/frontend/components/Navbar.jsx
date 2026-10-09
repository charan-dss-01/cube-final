"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Activity,
  Layers,
  Database,
  Building2,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function Navbar({
  title = "Operations Platform",
  subtitle = "Autonomous Logistics & Multi-Agent Evidence Command Center",
}) {
  const router = useRouter();
  const [searchUnit, setSearchUnit] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchUnit.trim()) {
      router.push(`/orchestrator?unit=${encodeURIComponent(searchUnit.trim().toUpperCase())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 backdrop-blur-md bg-white/95">
      {/* Title & Subtitle */}
      <div className="min-w-0 pr-4">
        <h1 className="text-sm font-bold text-[#0F172A] tracking-tight font-sans truncate">
          {title}
        </h1>
        <p className="text-[11px] text-[#64748B] font-medium hidden sm:block truncate mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Search Input for Unit Lifecycle */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search UNIT-0001, PO..."
            value={searchUnit}
            onChange={(e) => setSearchUnit(e.target.value)}
            className="w-56 lg:w-64 h-9 pl-9 pr-8 text-xs bg-[#FBFBFA] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-[#94A3B8] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] select-none pointer-events-none">
            ↵
          </kbd>
        </form>

        {/* Live System Status Badges */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-teal-50/70 border border-teal-200/60 rounded-xl text-[#0F766E] text-[11px] font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse" />
            <span className="hidden sm:inline">5 Pods</span>
            <span>Synchronized</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl text-[#475569] font-mono text-[11px] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Neon DB</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] text-[11px] font-semibold shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="font-mono">org_demo_alpha</span>
          </div>
        </div>
      </div>
    </header>
  );
}
