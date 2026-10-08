"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../lib/api";
import {
  FolderSync,
  PackageCheck,
  CheckCircle,
  Layers,
  RotateCcw,
  Clock,
  Camera,
  Search,
  X,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileCheck2,
  Code,
  Eye,
  Check,
  AlertTriangle,
  ArrowRight,
  Scale,
} from "lucide-react";

export default function EvidencePage() {
  const { currentCompany } = useWorkspace();
  const [evidenceList, setEvidenceList] = useState([]);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [findingFilter, setFindingFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "timeline"

  const loadEvidence = async () => {
    try {
      setLoading(true);
      const data = await api.getEvidenceList(currentCompany, {
        source_type: sourceFilter !== "ALL" ? sourceFilter.toLowerCase() : undefined,
      });
      setEvidenceList(data || []);
    } catch (err) {
      console.error("Failed to load evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [currentCompany, sourceFilter]);

  const filteredEvidence = evidenceList.filter((e) => {
    const matchesSearch =
      !search ||
      e.evidence_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.unit_id?.toLowerCase().includes(search.toLowerCase()) ||
      e.sku?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());

    const fUpper = (e.finding || "").toUpperCase();
    const matchesFinding =
      findingFilter === "ALL" ||
      (findingFilter === "PASS" && fUpper.includes("PASS")) ||
      (findingFilter === "FAIL" && fUpper.includes("FAIL")) ||
      (findingFilter === "PENDING" && (fUpper.includes("PENDING") || fUpper.includes("UNCERTAIN")));

    return matchesSearch && matchesFinding;
  });

  const getSourceBadge = (source) => {
    const styles = {
      receiving: "bg-teal-50 text-teal-800 border-teal-200",
      prep: "bg-emerald-50 text-emerald-800 border-emerald-200",
      pack: "bg-indigo-50 text-indigo-800 border-indigo-200",
      returns: "bg-purple-50 text-purple-800 border-purple-200",
      recovery: "bg-amber-50 text-amber-800 border-amber-200",
    };
    const style = styles[source?.toLowerCase()] || "bg-slate-100 text-slate-800 border-slate-200";
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${style}`}>
        {source || "OP"}
      </span>
    );
  };

  const getFindingBadge = (finding) => {
    const f = (finding || "").toUpperCase();
    if (f.includes("PASS") || f === "SEAL" || f === "ACCEPTED") {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 text-emerald-600" /> PASS
        </span>
      );
    }
    if (f.includes("FAIL") || f === "REJECTED" || f === "DEFECT") {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          <X className="w-3 h-3 text-rose-600" /> FAIL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3 text-amber-600" /> {finding || "PENDING"}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadEvidence} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                Central Neon PostgreSQL Vault
              </span>
              <span className="text-xs text-[#64748B]">• Immutable Physical Chain of Custody</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5">
              Forensic Operational Evidence Vault
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Unified physical logs and camera audits aggregated across Receiving, Prep, Pack, Returns, and Recovery lines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "timeline"
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Audit Timeline
              </button>
            </div>
            <div className="px-3 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl">
              {filteredEvidence.length} Records
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Evidence ID, Unit ID, SKU, or log text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source line filters */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {["ALL", "RECEIVING", "PREP", "PACK", "RETURNS"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    sourceFilter === f
                      ? "bg-[#0F766E] text-white"
                      : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Verdict filter */}
            <div className="h-5 w-px bg-[#E2E8F0] hidden sm:block" />
            <div className="flex items-center gap-1">
              {["ALL", "PASS", "FAIL", "PENDING"].map((v) => (
                <button
                  key={v}
                  onClick={() => setFindingFilter(v)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    findingFilter === v
                      ? "bg-[#0F172A] text-white"
                      : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Views */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="enterprise-card p-5 animate-pulse space-y-3 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredEvidence.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#64748B] border border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
            No operational evidence logs match the current filters.
          </div>
        ) : viewMode === "timeline" ? (
          /* CHRONOLOGICAL AUDIT TIMELINE VIEW */
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              {filteredEvidence.map((ev) => (
                <div key={ev.id || ev.evidence_id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0F766E] group-hover:scale-125 transition" />

                  <div
                    onClick={() => setSelectedRecord(ev)}
                    className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FBFBFA] hover:bg-white hover:border-[#0F766E] transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {getSourceBadge(ev.source_type)}
                        <span className="font-mono font-bold text-xs text-[#0F172A]">{ev.evidence_id}</span>
                        {getFindingBadge(ev.finding)}
                      </div>
                      <p className="text-xs text-[#334155] line-clamp-1">{ev.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#64748B] shrink-0">
                      <div>
                        Unit: <strong className="font-mono text-[#0F172A]">{ev.unit_id || "N/A"}</strong>
                      </div>
                      <div className="font-mono text-[11px]">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : "Pre-shipment"}
                      </div>
                      <button className="text-[#0F766E] hover:text-[#115E59] font-semibold text-xs flex items-center gap-1">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence.map((ev) => (
              <div
                key={ev.id || ev.evidence_id}
                onClick={() => setSelectedRecord(ev)}
                className="enterprise-card p-5 cursor-pointer transition hover:border-[#0F766E] hover:shadow-xs space-y-3 bg-white border border-[#E2E8F0] rounded-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    {getSourceBadge(ev.source_type)}
                    <h4 className="font-mono font-bold text-xs text-[#0F172A] mt-2">
                      {ev.evidence_id}
                    </h4>
                  </div>
                  {getFindingBadge(ev.finding)}
                </div>

                <div className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                  {ev.description}
                </div>

                <div className="pt-2 border-t border-[#E8E8E3] flex items-center justify-between text-[11px] text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">Unit: {ev.unit_id || "N/A"}</span>
                  <span className="font-mono">
                    {ev.timestamp ? ev.timestamp.substring(0, 10) : "Pre-shipment"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-2xl shadow-xl p-6 relative space-y-4 animate-scale-in">
              <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {getSourceBadge(selectedRecord.source_type)}
                    {getFindingBadge(selectedRecord.finding)}
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] font-mono mt-1.5">
                    {selectedRecord.evidence_id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9F6] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-[#F8F9F6] rounded-xl border border-[#E8E8E3] text-xs text-[#334155] space-y-1">
                <div className="font-semibold text-[#0F172A]">Physical Log Description:</div>
                <p className="leading-relaxed">{selectedRecord.description}</p>
              </div>

              {/* Stored Metadata */}
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#64748B]">
                  Station Metadata & Identifiers
                </span>
                <div className="p-3 rounded-xl bg-[#FBFBFA] text-xs space-y-1.5 mt-1 border border-[#E8E8E3]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Unit ID:</span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {selectedRecord.unit_id || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">SKU:</span>
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {selectedRecord.sku || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Event Type:</span>
                    <span className="text-[#334155]">
                      {selectedRecord.event_type || "Inspection"}
                    </span>
                  </div>
                  {selectedRecord.operator_id && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Operator:</span>
                      <span className="font-mono text-[#334155]">{selectedRecord.operator_id}</span>
                    </div>
                  )}
                  {selectedRecord.photo_refs && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Photo Ref:</span>
                      <span className="font-mono text-[11px] text-[#0F766E] truncate max-w-xs">
                        {selectedRecord.photo_refs}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw JSON Payload Accordion */}
              {selectedRecord.raw_payload && (
                <div>
                  <span className="text-[11px] font-semibold uppercase text-[#64748B]">
                    Underlying Station Payload
                  </span>
                  <div className="mt-1 p-3 rounded-xl bg-[#0F172A] text-slate-300 font-mono text-[10px] max-h-32 overflow-y-auto">
                    <pre>{JSON.stringify(selectedRecord.raw_payload, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E8E8E3]">
                {selectedRecord.unit_id ? (
                  <a
                    href={`/orchestrator?unitId=${selectedRecord.unit_id}`}
                    className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1"
                  >
                    Track in Multi-Agent Lifecycle <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div />
                )}
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-1.5 text-xs font-medium bg-[#0F766E] text-white rounded-lg hover:bg-[#115E59] transition shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
