"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../lib/api";
import Link from "next/link";
import {
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  FileQuestion,
  AlertCircle,
  Receipt,
  Download,
  ArrowRight,
  Gavel,
  ShieldAlert,
} from "lucide-react";
import { TableSkeletonRows } from "../../components/LoadingSkeleton";

export default function ChargesPage() {
  const { currentCompany } = useWorkspace();
  const [charges, setCharges] = useState([]);
  const [search, setSearch] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadCharges = async () => {
    try {
      setLoading(true);
      const data = await api.getCharges(currentCompany, {
        search: search || undefined,
        assessment: assessmentFilter !== "ALL" ? assessmentFilter : undefined,
      });
      setCharges(data || []);
    } catch (err) {
      console.error("Failed to load charges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharges();
  }, [currentCompany, assessmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCharges();
  };

  const getBadgeClass = (assessment, status) => {
    if (assessment === "CONTRADICTED" || status === "DISPUTED" || status === "CLAIMED") {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (assessment === "SUPPORTED" || status === "ACCEPTED") {
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadCharges} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                Ledger Deductions Audit
              </span>
              <span className="text-xs text-[#64748B]">• Marketplace & 3PL Fee Recovery</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5">
              Channel Charges & Deductions Explorer
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Filter and investigate channel deductions across inbound receiving, prep compliance, and returns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#64748B]">
              Showing <strong className="text-[#0F172A]">{charges.length}</strong> charges
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Charge ID, Unit ID, Shipment ID, or Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </form>

          {/* Assessment Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {["ALL", "CONTRADICTED", "SILENT", "UNCERTAIN", "SUPPORTED"].map((f) => (
              <button
                key={f}
                onClick={() => setAssessmentFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  assessmentFilter === f
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Charge ID</th>
                  <th className="py-3 px-4">Unit ID</th>
                  <th className="py-3 px-4">Shipment / Order</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Posted Date</th>
                  <th className="py-3 px-4">Adjudication Verdict</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                {loading ? (
                  <TableSkeletonRows rows={7} cols={9} />
                ) : charges.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-[#64748B]">
                      No charges match the selected filter.
                    </td>
                  </tr>
                ) : (
                  charges.map((c) => (
                    <tr key={c.id || c.charge_id} className="hover:bg-[#F8F9F6] transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#0F172A]">
                        {c.charge_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0F766E]">
                        {c.unit_id ? (
                          <a
                            href={`/orchestrator?unitId=${c.unit_id}`}
                            className="hover:underline font-bold"
                          >
                            {c.unit_id}
                          </a>
                        ) : (
                          "\u2014"
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#64748B]">
                        {c.shipment_id || c.order_id || "\u2014"}
                      </td>
                      <td className="py-3.5 px-4 text-[#334155]">
                        <div>{c.sku || "\u2014"}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{c.fnsku || ""}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-[#0F172A] font-medium">
                        {(c.reason || "").replace(/_/g, " ")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#0F172A] tabular-nums">
                        ${(c.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {c.charge_date || "\u2014"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getBadgeClass(
                            c.assessment,
                            c.status
                          )}`}
                        >
                          {c.assessment || c.status || "PENDING"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/agents/recovery?unitId=${c.unit_id || ""}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-xs"
                        >
                          <span>Adjudicate</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
