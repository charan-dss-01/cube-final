"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../lib/api";
import {
  FileCheck2,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Receipt,
  Layers,
  Sparkles,
  Gavel,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  Send,
  RotateCcw,
} from "lucide-react";
import ClaimPackageModal from "../../components/ClaimPackageModal";
import { TableSkeletonRows } from "../../components/LoadingSkeleton";

export default function ClaimsPage() {
  const { currentCompany } = useWorkspace();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusUpdating, setStatusUpdating] = useState(null);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const data = await api.getClaims(currentCompany);
      setClaims(data || []);
      if (data && data.length > 0 && !selectedClaim) {
        setSelectedClaim(data[0]);
      }
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [currentCompany]);

  const handleOpenClaim = (c) => {
    setSelectedClaim(c);
    setClaimModalOpen(true);
  };

  const handleStatusChange = async (claimId, newStatus) => {
    try {
      setStatusUpdating(claimId);
      await api.updateClaimStatus(claimId, newStatus, currentCompany);
      await loadClaims();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setStatusUpdating(null);
    }
  };

  const filteredClaims = claims.filter((c) => {
    const s = c.status?.toUpperCase() || "DRAFT";
    const matchesStatus = statusFilter === "ALL" || s === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      c.claim_id?.toLowerCase().includes(q) ||
      c.charge_id?.toLowerCase().includes(q) ||
      c.audit_packet?.charge_metadata?.reason?.toLowerCase().includes(q) ||
      c.explanation?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalClaimAmount = claims.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const recoveredAmount = claims
    .filter((c) => ["PAID", "RECOVERED"].includes(c.status?.toUpperCase()))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const activeAmount = claims
    .filter((c) => ["DRAFT", "SUBMITTED"].includes(c.status?.toUpperCase()))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || "DRAFT";
    switch (s) {
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" /> Submitted (In Review)
          </span>
        );
      case "PAID":
      case "RECOVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Paid / Recovered
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FileText className="w-3 h-3 text-amber-600" /> Draft (Unfiled)
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadClaims} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                Commercial Dispute Center
              </span>
              <span className="text-xs text-[#64748B]">• Multi-Agent Ground Truth Recovery</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5">
              Claims & Financial Audit Dossiers
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Cryptographically frozen claim packets with physical warehouse citations. Track carrier & channel recoveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/agents/recovery"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100/60 transition shadow-xs"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Recovery Adjudication Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Financial KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="enterprise-card p-5 bg-white border border-[#E2E8F0] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Total Pipeline Claims</span>
              <Receipt className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#0F172A] mt-2 tabular-nums">
              ${totalClaimAmount.toFixed(2)}
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              <strong className="text-[#0F172A]">{claims.length}</strong> total frozen claim dossiers
            </div>
          </div>

          <div className="enterprise-card p-5 bg-white border border-[#E2E8F0] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Recovered & Settled</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-2 tabular-nums">
              ${recoveredAmount.toFixed(2)}
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              <strong className="text-emerald-700">{claims.filter(c => ["PAID", "RECOVERED"].includes(c.status?.toUpperCase())).length}</strong> recovered payouts
            </div>
          </div>

          <div className="enterprise-card p-5 bg-white border border-[#E2E8F0] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Active In Dispute</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-700 mt-2 tabular-nums">
              ${activeAmount.toFixed(2)}
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              In review with Amazon / 3PL accounts
            </div>
          </div>

          <div className="enterprise-card p-5 bg-white border border-[#E2E8F0] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Defense Substantiation</span>
              <Sparkles className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#0F766E] mt-2">
              100%
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              Backed by Neon SQL + Gemini physical proof
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Claim ID, Charge ID, deduction reason, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "DRAFT", "SUBMITTED", "PAID", "REJECTED"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  statusFilter === f
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Claims Table */}
        <div className="rounded-xl bg-white border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Deduction Charge</th>
                  <th className="py-3 px-4 text-right">Recovery Amount</th>
                  <th className="py-3 px-4">Filing Status</th>
                  <th className="py-3 px-4">Physical Proof Citations</th>
                  <th className="py-3 px-4">Date Frozen</th>
                  <th className="py-3 px-4 text-right">Dossier Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                {loading ? (
                  <TableSkeletonRows rows={5} cols={7} />
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-[#64748B]">
                      <div className="max-w-md mx-auto space-y-3">
                        <FileText className="w-8 h-8 text-[#94A3B8] mx-auto" />
                        <div className="text-sm font-semibold text-[#0F172A]">No claim dossiers found</div>
                        <p className="text-xs text-[#64748B]">
                          Claims are generated when the Recovery Agent contradicts an invalid penalty deduction.
                        </p>
                        <a
                          href="/agents/recovery"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition"
                        >
                          <span>Go to Recovery Agent</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((c) => {
                    const packet = c.audit_packet || {};
                    const evidenceCount = packet.evidence_chain?.length || 0;
                    const meta = packet.charge_metadata || {};

                    return (
                      <tr key={c.id} className="hover:bg-[#F8F9F6] transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">
                          {c.claim_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-[#0F172A]">{c.charge_id}</div>
                          <div className="text-[11px] text-[#64748B] capitalize">
                            {(meta.reason || "Operational Deduction").replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] tabular-nums">
                          ${c.amount?.toFixed(2)} {c.currency || "USD"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(c.status)}
                            <select
                              value={c.status?.toUpperCase() || "DRAFT"}
                              onChange={(e) => handleStatusChange(c.claim_id, e.target.value)}
                              disabled={statusUpdating === c.claim_id}
                              className="text-[11px] border border-[#CBD5E1] bg-white rounded px-1.5 py-0.5 text-[#0F172A] cursor-pointer hover:border-[#0F766E] outline-none"
                            >
                              <option value="DRAFT">DRAFT</option>
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="PAID">PAID</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {evidenceCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              {evidenceCount} Station Checkpoints
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">Standard Ledger Chain</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Today"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenClaim(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-xs"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ClaimPackageModal
          isOpen={claimModalOpen}
          onClose={() => setClaimModalOpen(false)}
          claim={selectedClaim}
          onStatusChange={loadClaims}
        />
      </main>
    </div>
  );
}
