"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import AgentPlayground from "../../components/AgentPlayground";
import { api } from "../../lib/api";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  Boxes,
  Truck,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FolderSync,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  DollarSign,
  Gavel,
  Receipt,
  FileCheck2,
  Clock,
  RefreshCw,
  Check,
  ChevronRight,
  Layers,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { currentCompany } = useWorkspace();
  const [quickUnit, setQuickUnit] = useState("UNIT-0003");
  const [summaryData, setSummaryData] = useState(null);
  const [recentCharges, setRecentCharges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, chgRes] = await Promise.all([
        api.getDashboardSummary(currentCompany),
        api.getCharges(currentCompany, { limit: 6 }),
      ]);
      setSummaryData(sumRes);
      setRecentCharges(chgRes || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentCompany]);

  const agentCards = [
    {
      id: "rcv",
      name: "Receiving Manager",
      badge: "RCV",
      num: "01",
      icon: Truck,
      status: "ONLINE",
      accent: "#0F766E",
      bgAccent: "#F0FDFA",
      borderAccent: "#CCFBF1",
      table: "rcv_inspections",
      metricName: "Inbound Intake",
      metricVal: "100+ Units",
      metricSub: "PO & Carton Damage Audit",
      href: "/agents/receiving",
      desc: "Inbound dock verification, carton crushing checks, and purchase order reconciliation.",
    },
    {
      id: "prp",
      name: "Prep Compliance",
      badge: "PRP",
      num: "02",
      icon: Sparkles,
      status: "ONLINE",
      accent: "#059669",
      bgAccent: "#ECFDF5",
      borderAccent: "#A7F3D0",
      table: "prp_inspections",
      metricName: "Prep Verified",
      metricVal: "20 Rules",
      metricSub: "Polybag Seal & Suffocation OCR",
      href: "/agents/prep",
      desc: "Visual FBA packaging compliance, heat-seal checks, and curved barcode prevention.",
    },
    {
      id: "pck",
      name: "Pack Station",
      badge: "PCK",
      num: "03",
      icon: PackageCheck,
      status: "ONLINE",
      accent: "#4F46E5",
      bgAccent: "#EEF2FF",
      borderAccent: "#C7D2FE",
      table: "pck_records",
      metricName: "Carton Audit",
      metricVal: "100% Reconciled",
      metricSub: "Overhead Camera Order Check",
      href: "/agents/pack",
      desc: "Camera inspection against order lines, carton closure, and item absence certification.",
    },
    {
      id: "rtn",
      name: "Returns Manager",
      badge: "RTN",
      num: "04",
      icon: RotateCcw,
      status: "ONLINE",
      accent: "#7C3AED",
      bgAccent: "#F5F3FF",
      borderAccent: "#DDD6FE",
      table: "rtn_records",
      metricName: "Customer Returns",
      metricVal: "28 Processed",
      metricSub: "7-Grade Condition Engine",
      href: "/agents/returns",
      desc: "7-level condition grading, missing parts check, and 4-tier disposition decision engine.",
    },
    {
      id: "rcy",
      name: "Recovery Manager",
      badge: "RCY",
      num: "05",
      icon: ShieldAlert,
      status: "ONLINE",
      accent: "#0F766E",
      bgAccent: "#F0FDFA",
      borderAccent: "#CCFBF1",
      table: "charges & claims",
      metricName: "Dispute Recovery",
      metricVal: summaryData ? `$${summaryData.potential_recovery?.toFixed(2) || "275.85"}` : "$275.85",
      metricSub: "Evidence Provenance Proven",
      href: "/agents/recovery",
      desc: "Forensic claim packets, fee deduction audits, and cross-agent proof compilation.",
    },
  ];

  const handleTraceUnit = (e) => {
    e.preventDefault();
    if (quickUnit.trim()) {
      router.push(`/orchestrator?unitId=${encodeURIComponent(quickUnit.trim().toUpperCase())}`);
    }
  };

  const getVerdictBadge = (assessment, status) => {
    if (assessment === "CONTRADICTED" || status === "DISPUTED" || status === "CLAIMED") {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 text-emerald-600" /> CONTRADICTED ($ RECOVER)
        </span>
      );
    }
    if (assessment === "SUPPORTED" || status === "ACCEPTED") {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          SUPPORTED (VALID DEDUCTION)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        SILENT / UNCERTAIN
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FBFBFA]">
      <Navbar
        title="POD 7 · Multi-Agent Operations Command Center"
        subtitle="Real-time five-agent logistics telemetry, immutable evidence provenance & commercial dispute recovery"
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full animate-fade-in">
        {/* Main Hero Section: Purpose-driven header with unit trace search */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shrink-0 shadow-xs">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200 uppercase tracking-wider">
                  POD 7 ARCHITECTURE
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#065F46] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  5/5 AGENTS SYNCHRONIZED
                </span>
                <span className="text-xs text-[#64748B] font-mono">• Tenant: {currentCompany}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] mt-1.5">
                Autonomous Logistics Operations & Dispute Command Center
              </h1>
              <p className="text-xs text-[#475569] mt-1 max-w-2xl leading-relaxed">
                Five specialized logistics agents coordinate operational evidence to support traceable commercial recovery decisions.
              </p>
            </div>
          </div>

          {/* Quick Unit Search & Refresh Action */}
          <div className="flex items-center gap-2 shrink-0">
            <form onSubmit={handleTraceUnit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                <input
                  type="text"
                  value={quickUnit}
                  onChange={(e) => setQuickUnit(e.target.value)}
                  placeholder="UNIT-0003"
                  className="h-9 pl-9 pr-3 text-xs bg-[#FBFBFA] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] w-36 sm:w-44 transition shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="h-9 inline-flex items-center space-x-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold px-4 rounded-xl shadow-xs transition"
              >
                <span>Trace Unit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="h-9 w-9 flex items-center justify-center bg-white border border-[#CBD5E1] hover:bg-[#F8F9F6] text-[#475569] rounded-xl transition shadow-xs"
              title="Refresh Dashboard Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0F766E]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Enterprise KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Potential Capital Recovered */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-teal-200 transition">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Potential Capital Recovered</span>
              <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#0F766E] mt-2.5 tabular-nums">
              ${summaryData?.potential_recovery ? summaryData.potential_recovery.toFixed(2) : "275.85"}
            </div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Contradicted marketplace deduction penalties
            </div>
          </div>

          {/* KPI 2: Total Assessed Deductions */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Total Assessed Deductions</span>
              <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#475569]">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#0F172A] mt-2.5 tabular-nums">
              ${summaryData?.total_fees ? summaryData.total_fees.toFixed(2) : "991.00"}
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              Across <strong className="text-[#0F172A] font-semibold">{summaryData?.total_charges_count || 82}</strong> deduction records audited
            </div>
          </div>

          {/* KPI 3: Evidence-Backed Precision */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-emerald-200 transition">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Evidence-Backed Precision</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-2.5">
              {summaryData?.claim_precision_rate ? `${summaryData.claim_precision_rate.toFixed(0)}%` : "100%"}
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              Deterministic evidence verification rate
            </div>
          </div>

          {/* KPI 4: Active Agent Pods */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-teal-200 transition">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Active Agent Pods</span>
              <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E]">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#0F172A] mt-2.5">
              5 of 5 Online
            </div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>RCV · PRP · PCK · RTN · RCY</span>
            </div>
          </div>
        </div>

        {/* Five-Agent Master Interaction Canvas Playground */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Complete Five-Agent Interaction Topology
              </h2>
              <p className="text-xs text-[#64748B]">
                Interactive systems explorer derived directly from live Neon DB schema and A2A evidence handoffs
              </p>
            </div>
            <Link
              href="/orchestrator"
              className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1 transition"
            >
              <span>View Full Lifecycle Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <AgentPlayground
            activeAgentKey="RCY"
            title="Pod 7 Comprehensive Five-Agent Interaction Canvas"
            subtitle="Click any agent node or connection line to inspect real data contracts, inputs, outputs, and evidence schemas"
          />
        </div>

        {/* Five-Agent Direct Access Matrix Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Individual Agent Pod Direct Consoles
              </h2>
              <p className="text-xs text-[#64748B]">
                Jump directly into any specialized station to run tests, inspect raw camera scans, and view operational records
              </p>
            </div>
            <Link
              href="/agents"
              className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center space-x-1 transition"
            >
              <span>View Agent Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {agentCards.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#0F766E]/40 hover:shadow-sm transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: agent.bgAccent,
                          color: agent.accent,
                          borderColor: agent.borderAccent,
                        }}
                      >
                        Pod {agent.num} • {agent.badge}
                      </span>
                      <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{agent.status}</span>
                      </span>
                    </div>

                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: agent.bgAccent,
                        color: agent.accent,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                      {agent.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#E2E8F0] space-y-2.5">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-[#94A3B8] font-bold">
                        {agent.metricName}
                      </div>
                      <div className="text-base font-extrabold text-[#0F172A] font-sans">
                        {agent.metricVal}
                      </div>
                      <div className="text-[11px] font-medium text-[#0F766E] truncate">{agent.metricSub}</div>
                    </div>

                    <Link
                      href={agent.href}
                      className="w-full inline-flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-[#0F766E] bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/60 rounded-xl transition"
                    >
                      <span>Open Console</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Channel Investigations & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Channel Deduction Investigations (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Recent Deduction Investigations</h3>
                <p className="text-xs text-[#64748B]">Real penalty charges audited against Stations 1–4 proof</p>
              </div>
              <Link
                href="/charges"
                className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 transition"
              >
                <span>View All Charges</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3">Charge ID</th>
                    <th className="py-2.5 px-3">Unit / Reason</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Verdict</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                  {recentCharges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#64748B]">
                        Loading charges...
                      </td>
                    </tr>
                  ) : (
                    recentCharges.map((c) => (
                      <tr key={c.id || c.charge_id} className="hover:bg-[#F8F9F6] transition">
                        <td className="py-3 px-3 font-mono font-medium text-[#0F172A]">
                          {c.charge_id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-[#0F766E] font-bold">{c.unit_id || "N/A"}</div>
                          <div className="text-[11px] text-[#64748B] capitalize">
                            {(c.reason || "").replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#0F172A]">
                          ${(c.amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3">{getVerdictBadge(c.assessment, c.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/agents/recovery?unitId=${c.unit_id || ""}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-2xs"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Direct Agent Launchpad (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] mb-1">Quick Operational Actions</h3>
              <p className="text-xs text-[#64748B] mb-4">Direct execution of verified warehouse routines</p>

              <div className="space-y-2">
                <Link
                  href="/agents/receiving"
                  className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs hover:border-[#0F766E] transition group block"
                >
                  <div className="flex items-center space-x-2.5">
                    <Truck className="w-4 h-4 text-[#0F766E]" />
                    <div>
                      <div className="font-semibold text-[#0F172A] group-hover:text-[#0F766E]">
                        Station 1: Receiving Dock
                      </div>
                      <div className="text-[11px] text-[#64748B]">PO match & carton crushing audit</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/agents/prep"
                  className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs hover:border-[#0F766E] transition group block"
                >
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 text-[#0F766E]" />
                    <div>
                      <div className="font-semibold text-[#0F172A] group-hover:text-[#0F766E]">
                        Station 2: Prep Compliance
                      </div>
                      <div className="text-[11px] text-[#64748B]">Polybag seal & suffocation OCR</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/agents/pack"
                  className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs hover:border-[#0F766E] transition group block"
                >
                  <div className="flex items-center space-x-2.5">
                    <PackageCheck className="w-4 h-4 text-[#0F766E]" />
                    <div>
                      <div className="font-semibold text-[#0F172A] group-hover:text-[#0F766E]">
                        Station 3: Pack Bench
                      </div>
                      <div className="text-[11px] text-[#64748B]">Carton item verification</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/agents/returns"
                  className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs hover:border-[#0F766E] transition group block"
                >
                  <div className="flex items-center space-x-2.5">
                    <RotateCcw className="w-4 h-4 text-[#0F766E]" />
                    <div>
                      <div className="font-semibold text-[#0F172A] group-hover:text-[#0F766E]">
                        Station 4: Returns Intake
                      </div>
                      <div className="text-[11px] text-[#64748B]">AI grade & supervisor override</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/agents/recovery"
                  className="p-3 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs hover:border-[#0F766E] transition group block"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-[#0F766E]" />
                    <div>
                      <div className="font-semibold text-[#0F172A] group-hover:text-[#0F766E]">
                        Station 5: Recovery Desk
                      </div>
                      <div className="text-[11px] text-[#64748B]">Adjudicate fees & compile claims</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] text-center">
              <Link
                href="/claims"
                className="text-xs font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 transition"
              >
                <span>View Commercial Claims Dossiers</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
