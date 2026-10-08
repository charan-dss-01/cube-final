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
} from "lucide-react";

export default function Navbar({ title = "Operations Platform", subtitle = "Autonomous Logistics & Multi-Agent Evidence Command Center" }) {
  const router = useRouter();
  const [searchUnit, setSearchUnit] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchUnit.trim()) {
      router.push(`/orchestrator?unit=${encodeURIComponent(searchUnit.trim().toUpperCase())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-bold text-[#0F172A] tracking-tight font-sans">
          {title}
        </h1>
        <p className="text-xs text-[#64748B] font-medium hidden sm:block">
          {subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Search Input for Unit Lifecycle */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search UNIT-0001, PO..."
            value={searchUnit}
            onChange={(e) => setSearchUnit(e.target.value)}
            className="w-56 h-8.5 pl-9 pr-3 text-xs bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
          />
        </form>

        {/* Live System Status Badges */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg text-[#0F766E] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse"></span>
            <span className="hidden sm:inline">5 Pods</span> Synchronized
          </div>

          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg text-[#475569] font-mono text-[11px]">
            <Database className="w-3 h-3 text-[#0F766E]" />
            <span>Neon DB</span>
          </div>

          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs font-semibold">
            <Building2 className="w-3 h-3 text-[#64748B]" />
            <span>org_demo_alpha</span>
          </div>
        </div>
      </div>
    </header>
  );
}
