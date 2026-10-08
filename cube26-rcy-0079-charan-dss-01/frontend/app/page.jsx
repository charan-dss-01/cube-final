"use client";
import React from "react";
import Link from "next/link";
import {
  Boxes,
  Truck,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Database,
  Activity,
  CheckCircle2,
  FileText,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Eye,
  Server,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const agents = [
    {
      num: "01",
      id: "rcv",
      badge: "RCV",
      title: "Receiving Manager",
      subtitle: "Inbound Verification & Dock Intake",
      desc: "Analyzes bill-of-lading PO specifications, counts carton quantities, detects freight crushing/tears, and records tamper-evident receiving proofs.",
      icon: Truck,
      model: "Gemini 3.5 Flash VLM",
      dbTable: "rcv_inspections (100 rows)",
      href: "/agents/receiving",
      metrics: "100 Units Inspected",
    },
    {
      num: "02",
      id: "prp",
      badge: "PRP",
      title: "Prep Compliance Manager",
      subtitle: "FBA Prep & Geometry Audits",
      desc: "Evaluates polybag heat-seals, performs OCR validation on suffocation hazard warnings, and checks curved barcode geometry to prevent vendor defect fees.",
      icon: Sparkles,
      model: "Gemini 3.5 Flash Vision",
      dbTable: "prp_inspections (20 rules)",
      href: "/agents/prep",
      metrics: "6 Compliance Checks",
    },
    {
      num: "03",
      id: "pck",
      badge: "PCK",
      title: "Pack Manager",
      subtitle: "Pack Station & Manifest Reconciliation",
      desc: "Conducts multi-instance camera inspection against immutable order lines using a deterministic 9-check reconciliation policy to decide carton seal vs stop-and-fix.",
      icon: PackageCheck,
      model: "Gemini 3.5 Flash Hosted",
      dbTable: "pck_records",
      href: "/agents/pack",
      metrics: "9-Check Reconciliation",
    },
    {
      num: "04",
      id: "rtn",
      badge: "RTN",
      title: "Returns Manager",
      subtitle: "Customer Intake & AI Disposition",
      desc: "Grades returned item condition across 7 grades, evaluates completeness, and matches customer claims against upstream Receiving, Prep, and Pack evidence.",
      icon: RotateCcw,
      model: "Gemini 3.5 Flash Vision",
      dbTable: "rtn_records (24 returns)",
      href: "/agents/returns",
      metrics: "4-Tier Disposition Engine",
    },
    {
      num: "05",
      id: "rcy",
      badge: "RCY",
      title: "Recovery Manager",
      subtitle: "Forensic Dispute Claims & ROI",
      desc: "Correlates operational proofs from all upstream agents to detect invalid marketplace fee deductions, producing auditable dispute claim packages with SHA-256 integrity.",
      icon: ShieldAlert,
      model: "Gemini Forensic Reasoner",
      dbTable: "rcy_evidence_records (359 items)",
      href: "/agents/recovery",
      metrics: "$75.50 Disputed Fee Saved",
    },
  ];

  const highlights = [
    { label: "Centralized PostgreSQL", value: "33 Unified Tables", sub: "Neon Cloud DB Pool" },
    { label: "Orchestrated Agents", value: "5 Distinct Pods", sub: "100% Core Logic Intact" },
    { label: "Multimodal AI Vision", value: "Gemini 3.5 Flash", sub: "Zero Simulated Fixtures" },
    { label: "Operational Proofs", value: "359+ Records", sub: "Cross-Agent Cryptographic Trail" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#0F172A] flex flex-col font-sans">
      {/* 1. Global Navigation Bar */}
      <header className="h-18 border-b border-[#E2E8F0] bg-white sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shadow-sm">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-[#0F172A]">
                CUBE LOGISTICS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] font-semibold border border-[#A7F3D0]">
                ENTERPRISE 5-POD
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
              Multi-Agent Operations & Evidence Platform
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/agents"
            className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-[#F8F9F6] transition-colors"
          >
            Agent Directory
          </Link>
          <Link
            href="/orchestrator"
            className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-[#F8F9F6] transition-colors hidden sm:block"
          >
            Unit Lifecycle
          </Link>
          <Link
            href="/evidence"
            className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-[#F8F9F6] transition-colors hidden md:block"
          >
            Forensic Evidence
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 sm:px-12 pt-16 pb-20 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#F0FDFA] border border-[#CCFBF1] rounded-full text-xs font-semibold text-[#0F766E] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse"></span>
            <span>Centralized PostgreSQL Architecture Active</span>
            <span className="text-[#94A3B8]">|</span>
            <span className="font-mono text-[11px]">Neon 18.6</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15] mb-5">
            Autonomous Logistics Command & Forensic Evidence Platform.
          </h1>

          <p className="text-base sm:text-lg text-[#475569] leading-relaxed mb-8">
            Orchestrating five specialized warehouse AI agents—from receiving dock inspection and visual FBA compliance to real-time packing reconciliation, returns disposition, and marketplace fee recovery—anchored in a single source of truth.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-all"
            >
              <span>Open Operations Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/orchestrator"
              className="inline-flex items-center space-x-2 bg-white hover:bg-[#F8F9F6] text-[#0F172A] border border-[#E2E8F0] font-semibold text-sm px-5 py-3 rounded-xl shadow-card transition-all"
            >
              <Activity className="w-4 h-4 text-[#0F766E]" />
              <span>Trace Unit Lifecycle</span>
            </Link>
            <Link
              href="/agents"
              className="inline-flex items-center space-x-2 bg-white hover:bg-[#F8F9F6] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] font-semibold text-sm px-4 py-3 rounded-xl shadow-card transition-all"
            >
              <Boxes className="w-4 h-4 text-[#64748B]" />
              <span>Explore 5 Agents</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-card"
            >
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                {h.label}
              </div>
              <div className="text-2xl font-extrabold text-[#0F172A] mt-1 font-sans">
                {h.value}
              </div>
              <div className="text-xs text-[#0F766E] font-medium mt-1">
                {h.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 5-Agent Pipeline Visual Flow */}
      <section className="bg-white border-y border-[#E2E8F0] py-16 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F766E]">
                CROSS-AGENT DEPENDENCY GRAPH
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-1">
                End-to-End Operational Pipeline
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mt-2 md:mt-0">
              Each unit flows through discrete custody stages. Downstream agents verify facts against upstream tables, preventing false claims and preserving evidence.
            </p>
          </div>

          {/* Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {agents.map((agent, idx) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  className="bg-[#FBFBFA] border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between hover:border-[#CBD5E1] hover:bg-white transition-all shadow-card group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#94A3B8]">
                        {agent.num}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                        {agent.badge}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] mb-3 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">
                      {agent.title}
                    </h3>
                    <p className="text-xs text-[#0F766E] font-medium mb-2">
                      {agent.subtitle}
                    </p>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {agent.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0]/80">
                    <div className="text-[10px] font-mono text-[#64748B] mb-1">
                      {agent.model}
                    </div>
                    <Link
                      href={agent.href}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#115E59]"
                    >
                      <span>Access Pod</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Architecture & Evidence Integrity */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F766E]">
              SYSTEM ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-1 mb-4">
              Single Centralized Database. Zero Fragmented Data.
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed mb-6">
              All 5 warehouse agents have been refactored to read and write to the same Neon PostgreSQL instance using dedicated schema prefixes. No agent core decision logic was modified, ensuring complete backward compatibility while enabling instant cross-pod correlation.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start space-x-3 p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-card">
                <CheckCircle2 className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Upstream Cross-Querying</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Returns Manager queries Receiving dock photos, Prep heat-seals, and Pack scan logs to verify whether customer return defects existed prior to customer shipment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-card">
                <CheckCircle2 className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Forensic Proof Aggregation</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Recovery Manager syncs operational evidence from all 4 upstream pods, enabling automated chargeback dispute generation against Amazon or retail marketplace fee deductions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3.5 bg-white border border-[#E2E8F0] rounded-xl shadow-card">
                <CheckCircle2 className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Gemini 3.5 Flash Vision Acceleration</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Industrial computer vision calls execute in under 3 seconds with native structured JSON output and strict anti-hallucination guardrails.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Visual Preview Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-[#0F766E]" />
                <span className="font-bold text-xs font-mono text-[#0F172A]">DATABASE TOPOLOGY</span>
              </div>
              <span className="text-[11px] font-mono text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                Connected: Neon US-East-2
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                <span className="text-[#0F172A] font-semibold">rcv_units / rcv_inspections</span>
                <span className="text-[#0F766E] text-[11px]">Inbound Receiving</span>
              </div>
              <div className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                <span className="text-[#0F172A] font-semibold">prp_products / prp_inspections</span>
                <span className="text-[#0F766E] text-[11px]">Visual Prep Audits</span>
              </div>
              <div className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                <span className="text-[#0F172A] font-semibold">pck_records / pck_attempts</span>
                <span className="text-[#0F766E] text-[11px]">Packing Station</span>
              </div>
              <div className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                <span className="text-[#0F172A] font-semibold">rtn_records / rtn_overrides</span>
                <span className="text-[#0F766E] text-[11px]">Returns Disposition</span>
              </div>
              <div className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                <span className="text-[#0F172A] font-semibold">rcy_charges / rcy_claims</span>
                <span className="text-[#0F766E] text-[11px]">Recovery Ledger</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>SSL Require + Channel Binding</span>
              <Link href="/data-sources" className="text-[#0F766E] font-semibold hover:underline">
                View Schema Docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-[#E2E8F0] bg-white py-8 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <div className="flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-[#0F766E]" />
            <span className="font-bold text-[#0F172A]">CUBE Logistics</span>
            <span>— Autonomous 5-Agent Warehouse Orchestration Platform</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="hover:text-[#0F172A]">Dashboard</Link>
            <Link href="/agents" className="hover:text-[#0F172A]">Agents</Link>
            <Link href="/orchestrator" className="hover:text-[#0F172A]">Lifecycle</Link>
            <Link href="/evidence" className="hover:text-[#0F172A]">Evidence</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
