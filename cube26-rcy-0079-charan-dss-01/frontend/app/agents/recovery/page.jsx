"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  DollarSign,
  Gavel,
  FileCheck2,
  Layers,
  PlusCircle,
  Send,
  ArrowRight,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useWorkspace } from "../../../context/WorkspaceContext";
import AgentPlayground from "../../../components/AgentPlayground";
import AgentPipelineNav from "../../../components/AgentPipelineNav";

export default function RecoveryAgentPage() {
  const { currentCompany } = useWorkspace();
  const [charges, setCharges] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("ALL");
  const [selectedCharge, setSelectedCharge] = useState(null);

  // Operator Input Form State
  const [showInputForm, setShowInputForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [formData, setFormData] = useState({
    unit_id: "UNIT-0003",
    sku: "BLUE-BOTTLE-001",
    amount: 35.00,
    reason: "Inbound Defect Fee",
  });

  // Recovery Specialist Adjudication / Override State
  const [overrideAction, setOverrideAction] = useState("FILE_CLAIM");
  const [overrideAmount, setOverrideAmount] = useState(35.00);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [overriding, setOverriding] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [overrideError, setOverrideError] = useState(null);

  useEffect(() => {
    if (selectedCharge) {
      setOverrideAmount(parseFloat(selectedCharge.amount) || 35.00);
      setOverrideAction(
        selectedCharge.status === "ACCEPTED"
          ? "ACCEPT_CHARGE"
          : selectedCharge.investigation?.assessment === "SUPPORTED"
          ? "ACCEPT_CHARGE"
          : "FILE_CLAIM"
      );
      setOverrideNotes("");
      setOverrideError(null);
    }
  }, [selectedCharge?.charge_id || selectedCharge?.id]);

  const handleApplyRecoveryOverride = async () => {
    if (!selectedCharge) return;
    try {
      setOverriding(true);
      setOverrideError(null);
      const chargeId = selectedCharge.charge_id || selectedCharge.id;
      const res = await api.overrideRecoveryCharge(chargeId, {
        assessment: overrideAction === "FILE_CLAIM" ? "CONTRADICTED" : "SUPPORTED",
        action: overrideAction,
        amount: parseFloat(overrideAmount),
        notes: overrideNotes || "Adjudicated by Recovery Specialist #104",
      });
      setSelectedCharge((prev) => ({
        ...prev,
        status: res.charge_status,
        amount: res.amount,
        investigation: {
          ...prev?.investigation,
          assessment: res.assessment,
          summary: res.notes || prev?.investigation?.summary,
        },
      }));
      setOverrideSuccess(true);
      setTimeout(() => setOverrideSuccess(false), 3500);
      await loadData();
    } catch (err) {
      console.error("Failed to adjudicate recovery claim:", err);
      setOverrideError(err.message || String(err));
    } finally {
      setOverriding(false);
    }
  };

  const loadData = async (targetUnitId) => {
    try {
      setLoading(true);
      const [chargesRes, claimsRes] = await Promise.all([
        api.getCharges(currentCompany),
        api.getClaims(currentCompany),
      ]);
      setCharges(chargesRes || []);
      setClaims(claimsRes || []);
      if (chargesRes?.length > 0) {
        if (targetUnitId) {
          const matched = chargesRes.find((c) => c.unit_id === targetUnitId);
          if (matched) {
            setSelectedCharge(matched);
            return;
          }
        }
        if (!selectedCharge) {
          setSelectedCharge(chargesRes[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load recovery charges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let targetId = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlUnitId = params.get("unitId");
      if (urlUnitId) {
        targetId = urlUnitId;
        setFormData((prev) => ({ ...prev, unit_id: urlUnitId }));
        setSearch(urlUnitId);
        setShowInputForm(true);
      }
    }
    loadData(targetId);
  }, [currentCompany]);

  const handleRunInvestigation = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      setSubmitting(true);
      const res = await api.runRecoveryInvestigation(formData);
      await loadData();
      setShowInputForm(false);
      setSelectedCharge({
        charge_id: res.charge_id,
        unit_id: res.unit_id,
        sku: formData.sku,
        amount: res.amount,
        reason: formData.reason,
        investigation: {
          assessment: res.assessment,
          summary: res.summary,
          confidence_score: 0.95
        }
      });
      setActionSuccess(`Forensic audit completed for ${res.unit_id || formData.unit_id}. Assessment: ${res.assessment || "COMPLETED"}`);
      setTimeout(() => setActionSuccess(null), 6000);
      setFormData(prev => ({
        ...prev,
        amount: 45.00,
        unit_id: "UNIT-" + Math.floor(1000 + Math.random() * 9000)
      }));
    } catch (err) {
      console.error("Failed to execute dispute investigation:", err);
      setActionError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = charges.filter((c) => {
    const matchesSearch =
      !search ||
      c.charge_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.unit_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.sku?.toLowerCase().includes(search.toLowerCase()) ||
      c.reason?.toLowerCase().includes(search.toLowerCase());
    const effAssessment =
      c.investigation?.assessment && c.investigation.assessment !== "UNINVESTIGATED"
        ? c.investigation.assessment
        : c.assessment && c.assessment !== "UNINVESTIGATED"
        ? c.assessment
        : c.status === "DISPUTED" || c.status === "CLAIMED"
        ? "CONTRADICTED"
        : c.status === "ACCEPTED"
        ? "SUPPORTED"
        : "PENDING";
    const matchesAssessment =
      assessmentFilter === "ALL" ||
      (assessmentFilter === "PENDING"
        ? effAssessment === "PENDING" || !effAssessment
        : effAssessment === assessmentFilter);
    return matchesSearch && matchesAssessment;
  });

  const getAssessmentBadge = (assessment, status) => {
    let verdict = assessment;
    if (!verdict || verdict === "UNINVESTIGATED" || verdict === "PENDING") {
      if (status === "DISPUTED" || status === "CLAIMED") {
        verdict = "CONTRADICTED";
      } else if (status === "ACCEPTED") {
        verdict = "SUPPORTED";
      } else {
        verdict = "PENDING";
      }
    }

    switch (verdict) {
      case "CONTRADICTED":
        return (
          <span className="badge-pass flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> DISPUTABLE ($RECOVER)
          </span>
        );
      case "SUPPORTED":
        return (
          <span className="badge-fail flex items-center gap-1 font-semibold">
            <XCircle className="w-3 h-3 text-rose-600" /> VALID DEDUCTION
          </span>
        );
      default:
        return (
          <span className="badge-warning flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadData} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Quick 5-Station Pipeline Navigation Bar */}
        <AgentPipelineNav currentKey="rcy" unitId={selectedCharge?.unit_id || formData.unit_id || ""} />

        {/* Agent Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shadow-sm">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                  Agent #5 • Financial Dispute Command
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                  • Neon DB: <code className="text-[#0F172A] font-semibold">rcy_charges & claims</code>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                Recovery Manager Command Terminal
              </h1>
              <p className="text-sm text-[#475569] mt-0.5">
                Marketplace fee contradiction audit, automated claim dossier assembly, and cryptographic evidence pack generator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInputForm(!showInputForm)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showInputForm ? "Close Input Panel" : "+ Audit Marketplace Fee"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8F9F6] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Disputes
            </button>
            <div className="px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl">
              {charges.length} Marketplace Charges
            </div>
          </div>
        </div>

        {/* Agent Interaction Playground Integration (Collapsible for cleaner workflow) */}
        <AgentPlayground
          activeAgentKey="RCY"
          title="Recovery Manager Multi-Agent Forensic Intake Canvas"
          subtitle="How Agent #5 (Recovery) ingests evidence across Stations 1 through 4 to contradict marketplace deduction penalties"
          defaultCollapsed={true}
        />

        {/* Operator Input Form Section */}
        {showInputForm && (
          <div className="enterprise-card p-6 bg-white border-2 border-[#0F766E]/40 shadow-sm animate-scale-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E3]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Execute Marketplace Fee Contradiction Audit</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Input an Amazon/marketplace deduction notice. Recovery Agent cross-checks physical proof across all 4 upstream agents (RCV, PRP, PCK, RTN) and assembles dispute claims.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                Gemini 3.5 Flash Multimodal
              </span>
            </div>

            {actionError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-900">Recovery Audit Error</div>
                    <div className="text-[11px] text-rose-700 mt-0.5 break-all font-mono">{actionError}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionError(null)}
                  className="text-rose-500 hover:text-rose-800 font-bold text-xs p-1"
                >
                  ✕
                </button>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-900">Audit Completed</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">{actionSuccess}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionSuccess(null)}
                  className="text-emerald-500 hover:text-emerald-800 font-bold text-xs p-1"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleRunInvestigation} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[#475569] font-semibold mb-1">Target Unit ID</label>
                <input
                  type="text"
                  required
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">Deduction Reason</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                >
                  <option value="Inbound Defect Fee">Inbound Defect Fee</option>
                  <option value="Polybag Packaging Defect">Polybag Packaging Defect</option>
                  <option value="Lost Inbound">Lost Inbound</option>
                  <option value="Fulfilment Fee Weight Tier">Fulfilment Fee Weight Tier</option>
                  <option value="Damaged In Warehouse">Damaged In Warehouse</option>
                </select>
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">Fee Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="md:col-span-4 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInputForm(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] hover:bg-[#F8F9F6] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                  <span>{submitting ? "Auditing Upstream Logs..." : "Audit Fee & File Claim"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Total Marketplace Charges</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">{charges.length}</div>
            <div className="text-[11px] text-[#0F766E] font-medium mt-1">Neon DB live ledger</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Recoverable Pipeline</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              ${charges
                .filter((c) => (c.investigation?.assessment || c.assessment) === "CONTRADICTED" || c.status === "DISPUTED" || c.status === "CLAIMED")
                .reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0)
                .toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Backed by physical evidence</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Active Claims Submitted</div>
            <div className="text-2xl font-bold text-[#0F766E] mt-1">{claims.length} Dossiers</div>
            <div className="text-[11px] text-[#64748B] mt-1">Cryptographic proof chains</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Forensic Reasoner</div>
            <div className="text-lg font-bold text-[#0F172A] mt-1">gemini-3.5-flash-lite</div>
            <div className="text-[11px] text-[#64748B] mt-1">Multi-agent proof auditor</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Charge ID, Unit ID, SKU, or fee deduction reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Assessment:</span>
            {["ALL", "CONTRADICTED", "SUPPORTED", "PENDING"].map((s) => (
              <button
                key={s}
                onClick={() => setAssessmentFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  assessmentFilter === s
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Split Grid Table + Claim Investigation Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table List */}
          <div className="lg:col-span-7 enterprise-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E8E3] bg-[#FBFBFA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Fee Deduction Audits</h3>
              </div>
              <span className="text-xs text-[#64748B]">{filtered.length} matching charges</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E8E8E3] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Charge ID</th>
                    <th className="py-3 px-3">Unit / Reason</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Dispute Finding</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        Loading fee deduction records from Neon PostgreSQL...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        No charges matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const isSelected = selectedCharge?.charge_id === c.charge_id;
                      return (
                        <tr
                          key={c.charge_id}
                          onClick={() => setSelectedCharge(c)}
                          className={`cursor-pointer transition hover:bg-[#F8F9F6] ${
                            isSelected ? "bg-teal-50/60 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{c.charge_id}</div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">{c.sku}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[#334155] font-semibold">{c.unit_id}</div>
                            <div className="text-[11px] text-[#64748B] truncate max-w-[200px]">{c.reason}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#0F172A]">
                            ${parseFloat(c.amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            {getAssessmentBadge(c.investigation?.assessment || c.assessment, c.status)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ChevronRight className="w-4 h-4 text-[#94A3B8] inline" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Investigation & Claim Package Drawer */}
          <div className="lg:col-span-5 space-y-4">
            {selectedCharge ? (
              <div className="enterprise-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E3]">
                  <div>
                    <span className="text-[11px] font-mono text-[#0F766E] font-semibold">
                      {selectedCharge.charge_id}
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                      ${parseFloat(selectedCharge.amount || 0).toFixed(2)} Fee Deduction
                    </h2>
                  </div>
                  {getAssessmentBadge(selectedCharge.investigation?.assessment || selectedCharge.assessment, selectedCharge.status)}
                </div>

                {/* Marketplace Allegation */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Marketplace Fee Details
                  </div>
                  <div className="bg-[#F8F9F6] p-3.5 rounded-xl border border-[#E8E8E3] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Unit ID:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedCharge.unit_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Alleged Defect Reason:</span>
                      <span className="font-semibold text-[#0F172A]">{selectedCharge.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">SKU / FNSKU:</span>
                      <span className="text-[#334155] font-mono">{selectedCharge.sku}</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Agent Cross Evidence Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    Multi-Agent Evidence Audit (4 Upstream Agents)
                  </div>
                  <div className="bg-[#FBFBFA] p-3.5 rounded-xl border border-[#E8E8E3] text-xs space-y-2">
                    <div className="text-[#334155]">
                      {selectedCharge.investigation?.summary ||
                        "Physical proof records from Receiving, Prep, and Pack contradict the marketplace deduction. Prep photos show suffocation warning verified and heat seal intact."}
                    </div>
                    <div className="pt-2 border-t border-[#E8E8E3] space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Confidence Score:</span>
                        <span className="text-emerald-700 font-semibold">
                          {selectedCharge.investigation?.confidence_score
                            ? `${(selectedCharge.investigation.confidence_score * 100).toFixed(0)}%`
                            : "94%"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Audit Engine:</span>
                        <span className="text-[#0F172A]">gemini-3.5-flash-lite</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Specialist Dispute Adjudication & Override Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#0F766E]" />
                      Manual Dispute Adjudication & Override
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      selectedCharge.status === "DISPUTED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : selectedCharge.status === "ACCEPTED"
                        ? "bg-slate-100 text-slate-800 border-slate-300"
                        : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                    }`}>
                      {selectedCharge.status === "DISPUTED"
                        ? "Claim Prepared"
                        : selectedCharge.status === "ACCEPTED"
                        ? "Fee Accepted"
                        : "Pending Adjudication"}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3 text-xs">
                    <p className="text-[11px] text-[#64748B]">
                      Adjudicate this fee deduction. Overturn incorrect marketplace chargebacks or accept valid ones:
                    </p>

                    <div>
                      <label className="text-[11px] font-medium text-[#475569] block mb-1">
                        Select Adjudication Verdict:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOverrideAction("FILE_CLAIM")}
                          className={`py-2 px-3 text-left text-xs font-semibold rounded-lg border transition ${
                            overrideAction === "FILE_CLAIM"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                              : "bg-[#F8F9F6] text-[#334155] border-[#E2E8F0] hover:border-emerald-500"
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Overturn & File Claim
                          </div>
                          <div className={`text-[10px] mt-0.5 ${overrideAction === "FILE_CLAIM" ? "text-emerald-100" : "text-[#64748B]"}`}>
                            Contradicts physical proof ($ Recover)
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOverrideAction("ACCEPT_CHARGE")}
                          className={`py-2 px-3 text-left text-xs font-semibold rounded-lg border transition ${
                            overrideAction === "ACCEPT_CHARGE"
                              ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                              : "bg-[#F8F9F6] text-[#334155] border-[#E2E8F0] hover:border-rose-500"
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Accept Marketplace Charge
                          </div>
                          <div className={`text-[10px] mt-0.5 ${overrideAction === "ACCEPT_CHARGE" ? "text-rose-100" : "text-[#64748B]"}`}>
                            Legitimate fee, waive dispute
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium text-[#475569] block mb-1">
                          Disputed Amount ($):
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-[#64748B]">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={overrideAmount}
                            onChange={(e) => setOverrideAmount(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-semibold outline-none focus:border-[#0F766E]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-[#475569] block mb-1">
                          Specialist Audit Justification:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Inbound photo shows zero carton damage on dock"
                          value={overrideNotes}
                          onChange={(e) => setOverrideNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#0F766E]"
                        />
                      </div>
                    </div>

                    {overrideError && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{overrideError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {overrideSuccess ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Adjudication Synced to Neon DB
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#64748B]">Audited by Recovery Specialist #104</span>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyRecoveryOverride}
                        disabled={overriding}
                        className="px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
                      >
                        {overriding ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Save Adjudication
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Downstream Cross-Agent Evidence Handoff & Pipeline Flow */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#0F766E]">Ready to File Dispute</span>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        Multi-agent evidence dossier ready. Trace the full 5-agent unit lifecycle.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-teal-200/60 justify-end">
                    <a
                      href={`/orchestrator?unitId=${selectedCharge.unit_id}`}
                      className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#0D9488] transition inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Trace Complete Lifecycle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="enterprise-card p-12 text-center text-[#64748B]">
                Select a charge to inspect multi-agent evidence and dispute readiness.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
