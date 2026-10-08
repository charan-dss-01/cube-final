"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Truck,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  LayoutDashboard,
  Layers,
} from "lucide-react";

const STATIONS = [
  { key: "rcv", num: "1", name: "Receiving", badge: "RCV", role: "Inbound Dock", href: "/agents/receiving", icon: Truck },
  { key: "prp", num: "2", name: "Prep", badge: "PRP", role: "FBA Packaging", href: "/agents/prep", icon: Sparkles },
  { key: "pck", num: "3", name: "Pack", badge: "PCK", role: "Carton Audit", href: "/agents/pack", icon: PackageCheck },
  { key: "rtn", num: "4", name: "Returns", badge: "RTN", role: "LPN Grading", href: "/agents/returns", icon: RotateCcw },
  { key: "rcy", num: "5", name: "Recovery", badge: "RCY", role: "Dispute Desk", href: "/agents/recovery", icon: ShieldAlert },
];

export default function AgentPipelineNav({ currentKey = "rcv", unitId = "" }) {
  const pathname = usePathname();
  const queryParam = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
        <span className="text-[10px] uppercase font-bold text-[#94A3B8] font-mono mr-2 px-1 hidden md:inline">
          5-Station Pipeline:
        </span>
        {STATIONS.map((s, idx) => {
          const isCurrent = currentKey.toLowerCase() === s.key.toLowerCase();
          const Icon = s.icon;

          return (
            <React.Fragment key={s.key}>
              <Link
                href={`${s.href}${queryParam}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isCurrent
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] hover:text-[#0F172A] border border-[#E2E8F0]"
                }`}
                title={`Go to Station ${s.num}: ${s.name} (${s.role})`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-white" : "text-[#0F766E]"}`} />
                <span>
                  {s.num}. {s.name}
                </span>
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                    isCurrent ? "bg-white/20 text-white" : "bg-white text-[#64748B] border border-[#E2E8F0]"
                  }`}
                >
                  {s.badge}
                </span>
              </Link>
              {idx < STATIONS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-[#CBD5E1] shrink-0 hidden sm:inline" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/orchestrator${queryParam}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline px-2 py-1 rounded bg-teal-50 border border-teal-200"
        >
          <Layers className="w-3 h-3" />
          <span>Full Matrix</span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#475569] hover:underline px-2 py-1 rounded bg-[#F8F9F6] border border-[#E2E8F0]"
        >
          <LayoutDashboard className="w-3 h-3 text-[#0F766E]" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
