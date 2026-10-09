"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  FolderSync,
  Activity,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "OPERATIONS",
    items: [
      { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { name: "5-Agent Hub", href: "/agents", icon: Boxes },
      { name: "Unit Lifecycle Trace", href: "/orchestrator", icon: Activity },
      { name: "Forensic Evidence", href: "/evidence", icon: FolderSync },
    ],
  },
  {
    title: "WAREHOUSE AGENTS",
    items: [
      { name: "1. Receiving Manager", href: "/agents/receiving", icon: Truck, badge: "RCV" },
      { name: "2. Prep Compliance", href: "/agents/prep", icon: Sparkles, badge: "PRP" },
      { name: "3. Pack Station", href: "/agents/pack", icon: PackageCheck, badge: "PCK" },
      { name: "4. Returns Manager", href: "/agents/returns", icon: RotateCcw, badge: "RTN" },
      { name: "5. Recovery Manager", href: "/agents/recovery", icon: ShieldAlert, badge: "RCY" },
    ],
  },
  {
    title: "DISPUTES & AUDIT",
    items: [
      { name: "Claims & Settlement", href: "/claims", icon: FileCheck2 },
      { name: "Central PostgreSQL", href: "/data-sources", icon: Database },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } sticky top-0 h-screen self-start bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          className={`h-16 border-b border-[#E2E8F0] flex items-center ${
            collapsed ? "justify-center px-2" : "px-5 space-x-3"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Boxes className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#0F172A] tracking-tight text-sm font-sans">
                  CUBE LOGISTICS
                </span>
                <span className="text-[10px] bg-[#ECFDF5] text-[#065F46] font-mono px-1.5 py-0.5 rounded border border-[#A7F3D0] font-semibold">
                  POD 7
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-medium truncate">
                Central Operations Platform
              </p>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase font-mono">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center ${
                      collapsed ? "justify-center px-2" : "px-3"
                    } py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-teal-50/70 text-[#0F766E] font-semibold border border-teal-200/50 shadow-xs"
                        : "text-[#475569] hover:bg-[#F8F9F6] hover:text-[#0F172A]"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#0F766E] rounded-r" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-[#0F766E]"
                          : "text-[#64748B] group-hover:text-[#0F172A]"
                      }`}
                    />
                    {!collapsed && (
                      <span className="ml-3 truncate flex-1">{item.name}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold transition-colors ${
                          isActive
                            ? "bg-teal-100 text-[#0F766E]"
                            : "bg-[#F1F5F9] text-[#64748B] group-hover:bg-[#E2E8F0]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer & Collapse Toggle */}
      <div className="p-3 border-t border-[#E2E8F0] space-y-2 bg-[#FAFAF8]">
        {!collapsed && (
          <div className="px-3 py-2 bg-white rounded-xl border border-[#E2E8F0] text-[11px] shadow-xs">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-[#0F172A]">All Pods Live</span>
              </span>
              <span className="font-mono text-[10px] text-[#0F766E] font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                Neon DB
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={`flex items-center text-xs text-[#64748B] hover:text-[#0F766E] p-2 rounded-lg hover:bg-white transition-colors ${
              collapsed ? "w-full justify-center" : ""
            }`}
            title="Landing Page"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            {!collapsed && <span>Portal Home</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
