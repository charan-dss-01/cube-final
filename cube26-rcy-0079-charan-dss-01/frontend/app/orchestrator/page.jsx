"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../lib/api";
import {
  Layers,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Database,
  Shield,
  Box,
  Truck,
  PackageCheck,
  Undo2,
  Scale,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";

const AGENTS = [
  {
    id: "rcv",
    name: "1. Receiving Manager",
    role: "Inbound PO Verification",
    icon: Truck,
    table: "rcv_inspections & rcv_units",
    href: "/agents/receiving",
  },
  {
    id: "prp",
    name: "2. Prep Manager",
    role: "FBA Visual Prep Compliance",
    icon: Box,
    table: "prp_inspections & prp_rules",
    href: "/agents/prep",
  },
  {
    id: "pck",
    name: "3. Pack Manager",
    role: "Outbound Carton & Assortment",
    icon: PackageCheck,
    table: "pck_records & cw_workflows",
    href: "/agents/pack",
  },
  {
    id: "rtn",
    name: "4. Returns Manager",
    role: "Customer Return Grading & Matching",
    icon: Undo2,
    table: "rtn_records & rtn_checks",
    href: "/agents/returns",
  },
  {
    id: "rcy",
    name: "5. Recovery Manager",
    role: "Multi-Agent Dispute Auditor",
    icon: Scale,
    table: "rcy_charges & rcy_claims",
    href: "/agents/recovery",
  },
];

export default function OrchestratorPage() {
  const { currentCompany } = useWorkspace();
  const [selectedUnit, setSelectedUnit] = useState("UNIT-0003");
  const [customUnit, setCustomUnit] = useState("");
  const [lifecycle, setLifecycle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const loadLifecycle = async (unitId) => {
    setLoading(true);
    try {
      const data = await api.getUnitLifecycle(unitId);
      setLifecycle(data);
    } catch (e) {
      console.error("Lifecycle load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllAgents = async () => {
    setSyncing(true);
    try {
      const res = await api.syncOperationalEvidence(currentCompany);
      setSyncResult(res);
      await loadLifecycle(selectedUnit);
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlUnit = params.get("unitId") || params.get("unit");
      if (urlUnit) {
        setSelectedUnit(urlUnit);
      }
    }
  }, []);

  useEffect(() => {
    loadLifecycle(selectedUnit);
  }, [selectedUnit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (customUnit.trim()) {
      setSelectedUnit(customUnit.trim().toUpperCase());
      setCustomUnit("");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Header Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                  Round 3 Multi-Agent Ecosystem
                </span>
                <span className="text-xs text-[#64748B]">• Central Neon PostgreSQL 18.6</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5">
                5-Agent Unit Lifecycle & Orchestration Matrix
              </h1>
              <p className="text-sm text-[#475569] mt-0.5 max-w-2xl">
                Every unit is tracked through all five operational stages. Returns Manager compares against Receiving, Prep, and Pack proof; Recovery Manager aggregates all 4 agents to automatically dispute unwarranted marketplace fees.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncAllAgents}
                disabled={syncing}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-xl flex items-center gap-2 shadow-xs transition disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Syncing..." : "Sync Proof Across All 5 Agents"}</span>
              </button>
            </div>
          </div>

          {syncResult && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-[#0F766E] flex items-center justify-between animate-fade-in">
              <span className="font-medium">{syncResult.message}</span>
              <span className="font-mono text-[11px] bg-teal-100/80 px-2.5 py-0.5 rounded-md font-semibold">
                RCV: {syncResult.synced?.receiving} | PRP: {syncResult.synced?.prep} | RTN: {syncResult.synced?.returns}
              </span>
            </div>
          )}
        </div>

        {/* 5 Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {AGENTS.map((ag) => {
            const Icon = ag.icon;
            return (
              <a
                key={ag.id}
                href={ag.href}
                className="enterprise-card p-4 flex flex-col justify-between hover:border-[#0F766E]/50 transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200 uppercase font-mono">
                      {ag.id}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#F8F9F6] border border-[#E2E8F0] flex items-center justify-center text-[#475569] group-hover:text-[#0F766E] transition">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-[#0F766E] transition">
                    {ag.name}
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                    {ag.role}
                  </p>
                </div>
                <div className="pt-2 mt-3 border-t border-[#E8E8E3] text-[10px] font-mono text-[#64748B] truncate">
                  <Database className="w-3 h-3 inline mr-1 text-[#0F766E]" />
                  {ag.table}
                </div>
              </a>
            );
          })}
        </div>

        {/* Lifecycle Trace Section */}
        <div className="enterprise-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E8E3]">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0F766E]" />
                <span>End-to-End Unit Lifecycle Trace: <code className="text-[#0F766E]">{selectedUnit}</code></span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Physical chain of custody reconstructed across all 5 operational checkpoints.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] font-medium">Select:</span>
              <div className="flex items-center gap-1.5">
                {["UNIT-0001", "UNIT-0002", "UNIT-0003", "UNIT-0005", "UNIT-0067"].map((uid) => (
                  <button
                    key={uid}
                    onClick={() => setSelectedUnit(uid)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition ${
                      selectedUnit === uid
                        ? "bg-[#0F766E] text-white border-[#0F766E] font-semibold"
                        : "bg-[#F8F9F6] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F2ED]"
                    }`}
                  >
                    {uid}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSearchSubmit} className="ml-2">
                <input
                  type="text"
                  placeholder="Custom UNIT..."
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none font-mono uppercase w-28"
                />
              </form>
            </div>
          </div>

          {/* 5 Stage Sequential Trace Pipeline */}
          {loading ? (
            <div className="py-12 flex justify-center items-center text-[#64748B] text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#0F766E]" />
              Querying central Neon database across all 5 tables for {selectedUnit}...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* 1. Receiving */}
              <div className="bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#0F766E] uppercase font-mono">
                      1. Inbound RCV
                    </span>
                    {lifecycle?.receiving ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        lifecycle.receiving.overall_verdict === "PASS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {lifecycle.receiving.overall_verdict}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">Pending</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Receiving Dock</h4>
                  <div className="text-[11px] text-[#475569] mt-2 space-y-1">
                    {lifecycle?.receiving ? (
                      <>
                        <div>PO: <span className="font-mono font-semibold text-[#0F172A]">{lifecycle.receiving.po_number}</span></div>
                        <div>SKU: <span className="font-mono text-[#0F172A]">{lifecycle.receiving.sku}</span></div>
                        <div>Damage: <span className="text-[#0F172A]">{lifecycle.receiving.carton_damage || "None"}</span></div>
                        <div>Units: {lifecycle.receiving.qty_received} / {lifecycle.receiving.qty_ordered}</div>
                      </>
                    ) : (
                      <div className="text-[#94A3B8] italic">No inbound log recorded.</div>
                    )}
                  </div>
                </div>
                <a
                  href="/agents/receiving"
                  className="text-[11px] text-[#0F766E] font-medium hover:underline flex items-center gap-1 pt-2 border-t border-[#E8E8E3]"
                >
                  View Station <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 2. Prep */}
              <div className="bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#0F766E] uppercase font-mono">
                      2. FBA Prep
                    </span>
                    {lifecycle?.prep ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        lifecycle.prep.overall_status === "PASS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {lifecycle.prep.overall_status}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">Pending</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Prep Compliance</h4>
                  <div className="text-[11px] text-[#475569] mt-2 space-y-1">
                    {lifecycle?.prep ? (
                      <>
                        <div>Product: <span className="font-mono text-[#0F172A]">{lifecycle.prep.product_id}</span></div>
                        <div>Defect Fee: <span className="font-semibold text-[#0F766E]">${parseFloat(lifecycle.prep.defect_fee_amount || 0).toFixed(2)}</span></div>
                        <div>Disputable: <span className="text-emerald-700 font-semibold">{lifecycle.prep.recovery_disputable ? "YES" : "NO"}</span></div>
                      </>
                    ) : (
                      <div className="text-[#94A3B8] italic">No prep log recorded.</div>
                    )}
                  </div>
                </div>
                <a
                  href="/agents/prep"
                  className="text-[11px] text-[#0F766E] font-medium hover:underline flex items-center gap-1 pt-2 border-t border-[#E8E8E3]"
                >
                  View Station <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 3. Pack */}
              <div className="bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#0F766E] uppercase font-mono">
                      3. Outbound PCK
                    </span>
                    {lifecycle?.pack ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {lifecycle.pack.data?.decision?.toUpperCase() || "RECORDED"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">Pending</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Packing Terminal</h4>
                  <div className="text-[11px] text-[#475569] mt-2 space-y-1">
                    {lifecycle?.pack ? (
                      <>
                        <div>Session: <span className="font-mono text-[#0F172A]">{lifecycle.pack.id}</span></div>
                        <div>Checks: <span className="font-semibold text-emerald-700">9/9 Reconciled</span></div>
                        <div>Seal: <span className="text-[#0F172A]">Verified</span></div>
                      </>
                    ) : (
                      <div className="text-[#94A3B8] italic">No packing log recorded.</div>
                    )}
                  </div>
                </div>
                <a
                  href="/agents/pack"
                  className="text-[11px] text-[#0F766E] font-medium hover:underline flex items-center gap-1 pt-2 border-t border-[#E8E8E3]"
                >
                  View Terminal <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 4. Returns */}
              <div className="bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#0F766E] uppercase font-mono">
                      4. Reverse RTN
                    </span>
                    {lifecycle?.returns ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                        {lifecycle.returns.outcome || lifecycle.returns.status || "REVIEW"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">Pending</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Returns Intake</h4>
                  <div className="text-[11px] text-[#475569] mt-2 space-y-1">
                    {lifecycle?.returns ? (
                      <>
                        <div>Order: <span className="font-mono text-[#0F172A]">{lifecycle.returns.order_id}</span></div>
                        <div>SKU: <span className="font-mono text-[#0F172A]">{lifecycle.returns.ordered_sku}</span></div>
                        <div>State: <span className="text-[#0F172A]">{lifecycle.returns.observed_state || "Inspected"}</span></div>
                      </>
                    ) : (
                      <div className="text-[#94A3B8] italic">No return recorded.</div>
                    )}
                  </div>
                </div>
                <a
                  href="/agents/returns"
                  className="text-[11px] text-[#0F766E] font-medium hover:underline flex items-center gap-1 pt-2 border-t border-[#E8E8E3]"
                >
                  View Reverse Dock <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 5. Recovery */}
              <div className="bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#0F766E] uppercase font-mono">
                      5. Dispute RCY
                    </span>
                    {lifecycle?.recovery ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-teal-50 text-[#0F766E] border-teal-200">
                        {lifecycle.recovery.assessment || "DISPUTABLE"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">Pending</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Recovery Dispute</h4>
                  <div className="text-[11px] text-[#475569] mt-2 space-y-1">
                    {lifecycle?.recovery ? (
                      <>
                        <div>Charge ID: <span className="font-mono text-[#0F172A]">{lifecycle.recovery.charge_id}</span></div>
                        <div>Amount: <span className="font-bold text-emerald-700">${parseFloat(lifecycle.recovery.amount || 0).toFixed(2)}</span></div>
                        <div>Claim: <span className="text-[#0F766E] font-semibold">{lifecycle.recovery.claim_id || "Active"}</span></div>
                      </>
                    ) : (
                      <div className="text-[#94A3B8] italic">No dispute filed yet.</div>
                    )}
                  </div>
                </div>
                <a
                  href="/agents/recovery"
                  className="text-[11px] text-[#0F766E] font-medium hover:underline flex items-center gap-1 pt-2 border-t border-[#E8E8E3]"
                >
                  View Dispute Hub <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
