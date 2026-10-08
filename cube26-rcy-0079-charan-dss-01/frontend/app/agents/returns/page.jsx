"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import {
  Undo2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Scale,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  FileQuestion,
  Layers,
  PlusCircle,
  Send,
  Camera,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { api } from "../../../lib/api";
import AgentPlayground from "../../../components/AgentPlayground";
import AgentPipelineNav from "../../../components/AgentPipelineNav";

export default function ReturnsAgentPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Operator Input Form State - Open by default for real-time returns intake & vision uploads
  const [showInputForm, setShowInputForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: "UNIT-0003",
    order_id: "ORD-RET-304",
    ordered_sku: "BLUE-BOTTLE-001",
    ordered_asin: "B0DUMMY001",
    return_reason: "Customer Return",
    condition: "Sellable - Open Box",
    item_matches: true,
    completeness: true,
    damage_present: false,
  });

  const [selectedPreset, setSelectedPreset] = useState("UNIT-0003_1.jpg");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("/samples/returns/UNIT-0003_1.jpg");

  // Operator Decision Override State
  const [overrideDisp, setOverrideDisp] = useState("RESTOCK");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [overriding, setOverriding] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [overrideError, setOverrideError] = useState(null);

  useEffect(() => {
    if (selectedRecord) {
      const current = (selectedRecord.operator_disposition || selectedRecord.outcome || "RESTOCK").toUpperCase();
      setOverrideDisp(current === "PENDING_REVIEW" ? "RESTOCK" : current);
      setOverrideNotes("");
      setOverrideError(null);
    }
  }, [selectedRecord?.record_id]);

  const handleApplyOverride = async () => {
    if (!selectedRecord) return;
    try {
      setOverriding(true);
      setOverrideError(null);
      const res = await api.overrideReturnDisposition(selectedRecord.record_id, {
        disposition: overrideDisp,
        notes: overrideNotes || "Manual warehouse operator adjudication",
      });
      setSelectedRecord(res);
      setOverrideSuccess(true);
      setTimeout(() => setOverrideSuccess(false), 3500);
      await loadData();
    } catch (err) {
      console.error("Failed to apply override:", err);
      setOverrideError(err.message || String(err));
    } finally {
      setOverriding(false);
    }
  };

  const handlePhotoSelect = (file) => {
    setSelectedPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setSelectedPreset(null);
    } else {
      setPhotoPreview(null);
    }
  };

  const loadData = async (targetUnitId) => {
    try {
      setLoading(true);
      const res = await api.getReturnsRecords({ limit: 50 });
      setRecords(res.records || []);
      setTotal(res.total || 0);
      if (res.records?.length > 0) {
        if (targetUnitId) {
          const matched = res.records.find((r) => r.unit_id === targetUnitId);
          if (matched) {
            setSelectedRecord(matched);
            return;
          }
        }
        if (!selectedRecord) {
          setSelectedRecord(res.records[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load return records:", err);
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
      }
    }
    loadData(targetId);
  }, []);

  const handleRunInspection = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (selectedPhoto) {
        form.append("photo", selectedPhoto);
      } else if (selectedPreset) {
        form.append("preset_image", selectedPreset);
      }
      const res = await api.runReturnsInspection(form);
      await loadData();
      setSelectedRecord(res);
      setFormData((prev) => {
        const match = prev.unit_id.match(/(\d+)$/);
        const nextNum = match ? String(parseInt(match[1]) + 1).padStart(match[1].length, '0') : "0004";
        const prefix = prev.unit_id.replace(/\d+$/, '');
        return {
          ...prev,
          unit_id: prefix + nextNum,
        };
      });
    } catch (err) {
      console.error("Failed to run returns evaluation:", err);
      alert("Error executing returns evaluation: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.record_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.unit_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.ordered_sku?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      r.status?.toUpperCase() === statusFilter ||
      r.outcome?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOutcomeBadge = (outcome, status) => {
    const text = outcome || status || "PENDING";
    switch (text?.toUpperCase()) {
      case "RESTOCK":
      case "PASS":
        return (
          <span className="badge-pass flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RESTOCK
          </span>
        );
      case "DISPOSE":
      case "FAIL":
        return (
          <span className="badge-fail flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> DISPOSE
          </span>
        );
      case "LIQUIDATE":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> LIQUIDATE
          </span>
        );
      default:
        return (
          <span className="badge-warning flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" /> {text.toUpperCase()}
          </span>
        );
    }
  };

  const getReturnPhotoSrc = (record) => {
    if (!record) return "/images/sample-return.jpg";
    if (record.photo_url) {
      return record.photo_url.startsWith("/static") ? `http://localhost:8000${record.photo_url}` : record.photo_url;
    }
    if (record.photo_refs) {
      try {
        const parsed = typeof record.photo_refs === "string" ? JSON.parse(record.photo_refs) : record.photo_refs;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const item = parsed[0];
          return item.startsWith("/static") ? `http://localhost:8000${item}` : item;
        }
      } catch (e) {}
    }
    return "/images/sample-return.jpg";
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadData} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Quick 5-Station Pipeline Navigation Bar */}
        <AgentPipelineNav currentKey="rtn" unitId={selectedRecord?.unit_id || formData.unit_id || ""} />

        {/* Agent Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shadow-sm">
              <Undo2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                  Agent #4 • Reverse Logistics Dock
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                  • Neon DB: <code className="text-[#0F172A] font-semibold">rtn_records</code>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                Returns Manager Station
              </h1>
              <p className="text-sm text-[#475569] mt-0.5">
                Customer return inspection, 7-level condition grading, 4-tier disposition (RESTOCK, REFURB, LIQUIDATE, DISPOSE), and cross-agent upstream verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInputForm(!showInputForm)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showInputForm ? "Close Input Panel" : "+ Process Customer Return"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8F9F6] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Returns
            </button>
            <div className="px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl">
              {total} Return Claims
            </div>
          </div>
        </div>

        {/* Agent Interaction Playground Integration (Collapsible for cleaner workflow) */}
        <AgentPlayground
          activeAgentKey="RTN"
          title="Returns Station Topology & LPN Reverse Logistics Flow"
          subtitle="How Agent #4 (Returns) grades merchandise, verifies missing parts, and correlates with upstream logs to protect against fraudulent claims"
          defaultCollapsed={true}
        />

        {/* Operator Input Form Section */}
        {showInputForm && (
          <div className="enterprise-card p-6 bg-white border-2 border-[#0F766E]/40 shadow-sm animate-scale-in space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E8E8E3] gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Execute Customer Return AI Intake & Grading</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Supply the customer return manifest and capture the returned unit photo. Gemini Multimodal Vision autonomously inspects cosmetic wear, detects packaging damage, verifies SKU authenticity, and assigns the 4-tier disposition.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                  gemini-3.5-flash-lite active
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Autonomous Grading & Disposition
                </span>
              </div>
            </div>

            <form onSubmit={handleRunInspection} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Return Manifest Specs */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-[#0F766E]" />
                      1. Customer Return RMA Manifest
                    </span>
                    <span className="text-[10px] text-[#64748B]">Buyer return claim</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Returned Unit ID</label>
                      <input
                        type="text"
                        required
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Original Order ID</label>
                      <input
                        type="text"
                        required
                        value={formData.order_id}
                        onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Expected SKU</label>
                      <input
                        type="text"
                        required
                        value={formData.ordered_sku}
                        onChange={(e) => setFormData({ ...formData, ordered_sku: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Customer Claim Reason</label>
                      <select
                        value={formData.return_reason}
                        onChange={(e) => setFormData({ ...formData, return_reason: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      >
                        <option value="Customer Return">Customer Return / Unwanted</option>
                        <option value="Defective">Defective / Does not work</option>
                        <option value="Not as described">Item not as described</option>
                        <option value="Wrong item sent">Wrong item received</option>
                        <option value="Damaged in transit">Damaged in transit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Column 2: Returns Station Camera Rig & Evidence */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2 mb-3">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                        2. Returns Intake Camera Rig
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-medium">Vision Input Source</span>
                    </div>

                    {/* Camera Presets Selector */}
                    <div className="space-y-1.5 mb-3">
                      <label className="block text-[11px] font-semibold text-[#475569]">
                        Choose Station Camera Rig Preset or Upload Custom Photo:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("UNIT-0003_1.jpg");
                            setFormData((prev) => ({ ...prev, ordered_sku: "B07998DGL8", return_reason: "Damaged in transit" }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/returns/UNIT-0003_1.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "UNIT-0003_1.jpg"
                              ? "bg-rose-50 border-rose-500 text-rose-700 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Damaged Outer Box</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Crushed & torn packaging (LIQUIDATE)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("UNIT-0009_1.jpg");
                            setFormData((prev) => ({ ...prev, ordered_sku: "B08N5M7S6K", return_reason: "Customer Return" }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/returns/UNIT-0009_1.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "UNIT-0009_1.jpg"
                              ? "bg-teal-50 border-[#0F766E] text-[#0F766E] font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Pristine Like-New Return</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Factory sealed box (RESTOCK)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("UNIT-0014_1.jpg");
                            setFormData((prev) => ({ ...prev, ordered_sku: "B09ABC7712", return_reason: "Defective" }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/returns/UNIT-0014_1.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "UNIT-0014_1.jpg"
                              ? "bg-amber-50 border-amber-500 text-amber-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Open Box Inspection</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Requires repackaging (REFURBISH)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("UNIT-0016_1.jpg");
                            setFormData((prev) => ({ ...prev, ordered_sku: "B0DUMMY001", return_reason: "Wrong item sent" }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/returns/UNIT-0016_1.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "UNIT-0016_1.jpg"
                              ? "bg-purple-50 border-purple-500 text-purple-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>Secondary View Audit</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Cosmetic angle grading</div>
                        </button>
                      </div>
                    </div>

                    {/* Photo Dropzone or Preview */}
                    <div className="border border-dashed border-teal-300 bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                          <span>Or Upload Return Intake Photo:</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhotoSelect(e.target.files[0]);
                              setSelectedPreset(null);
                            }
                          }}
                          className="mt-1 text-xs text-[#475569] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-[#0F766E] file:text-white hover:file:bg-[#0D9488] cursor-pointer"
                        />
                      </div>

                      {photoPreview && (
                        <div className="flex items-center gap-2 bg-[#F8F9F6] p-1.5 rounded-lg border border-teal-200 shrink-0">
                          <img src={photoPreview} alt="Return Target" className="w-14 h-14 object-cover rounded border" />
                          <div className="text-[10px] text-[#475569]">
                            <div className="font-semibold truncate max-w-[100px]">
                              {selectedPhoto ? selectedPhoto.name : selectedPreset}
                            </div>
                            <span className="text-[9px] text-teal-700 bg-teal-100 px-1 py-0.2 rounded font-mono">
                              {selectedPhoto ? "Custom Upload" : "Preset Rig"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Autonomous Explainer Banner */}
                  <div className="bg-teal-50/60 p-2.5 rounded-lg border border-teal-200 text-[11px] text-[#0F766E] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Autonomous Return Grading Active:</span> Gemini Computer Vision inspects the photo to identify the product, detect physical defects/tears, determine the Amazon condition grade, and assign the optimal disposition (RESTOCK, REFURBISH, LIQUIDATE, DISPOSE).
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E3]">
                <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Return disposition decision will commit forensic record to <code className="font-mono text-[#0F172A]">rtn_records</code>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                  <span>{submitting ? "AI Grading Return & Deciding Disposition..." : "⚡ Run Autonomous Returns AI Assessment"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Total Return Cases</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">{total}</div>
            <div className="text-[11px] text-[#0F766E] font-medium mt-1">Central database feed</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Upstream Cross-Match</div>
            <div className="text-lg font-bold text-emerald-700 mt-1">RCV + PRP + PCK</div>
            <div className="text-[11px] text-[#64748B] mt-1">Matches original outbound</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Fraud / Mismatch Catch</div>
            <div className="text-2xl font-bold text-rose-700 mt-1">Active Detection</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Wrong item return flagged</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Vision Reasoning</div>
            <div className="text-lg font-bold text-[#0F766E] mt-1">gemini-3.5-flash-lite</div>
            <div className="text-[11px] text-[#64748B] mt-1">Grading & part inventory</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Return Record ID, Unit ID, Order ID, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Outcome:</span>
            {["ALL", "RESTOCK", "DISPOSE", "PENDING_REVIEW"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  statusFilter === s
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Split Grid Table + Return Case Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table List */}
          <div className="lg:col-span-7 enterprise-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E8E3] bg-[#FBFBFA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Customer Returns Ledger</h3>
              </div>
              <span className="text-xs text-[#64748B]">{filtered.length} matching returns</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E8E8E3] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Return ID</th>
                    <th className="py-3 px-3">Order / SKU</th>
                    <th className="py-3 px-3">Condition Grade</th>
                    <th className="py-3 px-3">Disposition</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        Loading customer returns from Neon PostgreSQL...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        No return records matched your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isSelected = selectedRecord?.record_id === r.record_id;
                      return (
                        <tr
                          key={r.record_id}
                          onClick={() => setSelectedRecord(r)}
                          className={`cursor-pointer transition hover:bg-[#F8F9F6] ${
                            isSelected ? "bg-teal-50/60 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{r.record_id}</div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">{r.unit_id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[#334155] font-semibold">{r.ordered_sku}</div>
                            <div className="text-[11px] text-[#64748B]">{r.order_id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-[#334155]">
                              {r.amazon_condition || "Sellable - Open Box"}
                            </span>
                          </td>
                          <td className="py-3 px-3">{getOutcomeBadge(r.outcome, r.status)}</td>
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

          {/* Return Case Detail Drawer */}
          <div className="lg:col-span-5 space-y-4">
            {selectedRecord ? (
              <div className="enterprise-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E3]">
                  <div>
                    <span className="text-[11px] font-mono text-[#0F766E] font-semibold">
                      {selectedRecord.record_id}
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                      {selectedRecord.unit_id}
                    </h2>
                  </div>
                  {getOutcomeBadge(selectedRecord.outcome, selectedRecord.status)}
                </div>

                {/* Return Order Details */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Customer Return Information
                  </div>
                  <div className="bg-[#F8F9F6] p-3.5 rounded-xl border border-[#E8E8E3] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Order ID:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedRecord.order_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Ordered SKU:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedRecord.ordered_sku}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">ASIN:</span>
                      <span className="text-[#334155] font-mono">
                        {selectedRecord.ordered_asin || "B0DUMMY001"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Assigned Condition:</span>
                      <span className="font-medium text-[#0F172A]">
                        {selectedRecord.amazon_condition || "Sellable - Open Box"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upstream Evidence Cross-Match */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    Upstream Line Verification (Receiving + Prep + Pack)
                  </div>
                  <div className="bg-[#FBFBFA] p-3.5 rounded-xl border border-[#E8E8E3] text-xs space-y-2">
                    <div className="text-[#334155]">
                      Returns Manager queries the central Neon PostgreSQL database to retrieve the original receiving and packing logs for{" "}
                      <span className="font-mono font-semibold text-[#0F172A]">{selectedRecord.unit_id}</span>.
                    </div>
                    <div className="pt-2 border-t border-[#E8E8E3] grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-[#E2E8F0]">
                        <span className="text-[#64748B] block">Inbound Condition:</span>
                        <span className="font-semibold text-emerald-700">Verified Intact (RCV)</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#E2E8F0]">
                        <span className="text-[#64748B] block">Outbound Seal:</span>
                        <span className="font-semibold text-emerald-700">Pristine Sealed (PCK)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Autonomous Vision Inferences Card */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    AI Vision Inferences (Multimodal Returns Classifier)
                  </div>
                  <div className="bg-teal-50/40 p-3.5 rounded-xl border border-teal-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Condition Grade:</span>
                      <span className="font-semibold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                        {selectedRecord.amazon_condition || "Sellable - Open Box"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Identity Match:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        selectedRecord.identity_match === "MISMATCH"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {selectedRecord.identity_match || "MATCH"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Recommended Disposition:</span>
                      <span className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded ${
                        (selectedRecord.operator_disposition || selectedRecord.outcome) === "restock"
                          ? "bg-emerald-600 text-white"
                          : (selectedRecord.operator_disposition || selectedRecord.outcome) === "refurbish"
                          ? "bg-blue-600 text-white"
                          : (selectedRecord.operator_disposition || selectedRecord.outcome) === "liquidate"
                          ? "bg-amber-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}>
                        {(selectedRecord.operator_disposition || selectedRecord.outcome || "RESTOCK").toUpperCase()}
                      </span>
                    </div>
                    {selectedRecord.observed_state && (
                      <div className="text-[11px] text-[#475569] pt-2 border-t border-teal-200/60 leading-relaxed font-mono">
                        <span className="text-[#64748B] block font-sans font-medium mb-0.5">Vision Inspection Notes:</span>
                        {selectedRecord.observed_state}
                      </div>
                    )}
                  </div>
                </div>

                {/* Multimodal Return Intake Photo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                    Multimodal Return Photo Evidence
                  </div>
                  <div className="bg-[#F8F9F6] p-2.5 rounded-xl border border-[#E8E8E3]">
                    <div className="rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-900/5 max-h-48 flex items-center justify-center">
                      <img
                        src={getReturnPhotoSrc(selectedRecord)}
                        alt="Return Evidence"
                        className="max-h-44 object-contain rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Manual Operator Adjudication & Override Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#0F766E]" />
                      Manual Operator Disposition Override
                    </span>
                    {(selectedRecord.operator_disposition || selectedRecord.outcome)?.toLowerCase() === "pending_review" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        Pending Adjudication
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-3 text-xs">
                    <p className="text-[11px] text-[#64748B]">
                      Resolve uncertain AI inferences or overturn grading based on physical inspection of cargo:
                    </p>

                    <div>
                      <label className="text-[11px] font-medium text-[#475569] block mb-1">
                        Select Final Disposition:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: "RESTOCK", label: "Restock", color: "hover:border-emerald-500", active: "bg-emerald-600 text-white border-emerald-600 shadow-2xs" },
                          { id: "REFURBISH", label: "Refurbish", color: "hover:border-blue-500", active: "bg-blue-600 text-white border-blue-600 shadow-2xs" },
                          { id: "LIQUIDATE", label: "Liquidate", color: "hover:border-amber-500", active: "bg-amber-600 text-white border-amber-600 shadow-2xs" },
                          { id: "DISPOSE", label: "Dispose", color: "hover:border-rose-500", active: "bg-rose-600 text-white border-rose-600 shadow-2xs" },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => setOverrideDisp(btn.id)}
                            className={`py-1.5 text-center text-xs font-semibold rounded-lg border transition ${
                              overrideDisp === btn.id
                                ? btn.active
                                : `bg-[#F8F9F6] text-[#334155] border-[#E2E8F0] ${btn.color}`
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#475569] block mb-1">
                        Operator Audit Justification / Notes:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Physical box unsealed, all components verified intact"
                        value={overrideNotes}
                        onChange={(e) => setOverrideNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#0F766E]"
                      />
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Decision Saved to Neon DB
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#64748B]">Audited by Operator #104</span>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyOverride}
                        disabled={overriding}
                        className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
                      >
                        {overriding ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Apply Override
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
                      <span className="font-semibold text-[#0F766E]">Ready for Recovery Audit</span>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        Return condition recorded. Initiate dispute filing with Recovery Manager or inspect full lifecycle.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-teal-200/60 justify-end">
                    <a
                      href={`/orchestrator?unitId=${selectedRecord.unit_id}`}
                      className="px-2.5 py-1.5 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-medium hover:bg-slate-50 transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      Trace Unit <ExternalLink className="w-3 h-3 text-[#0F766E]" />
                    </a>
                    <a
                      href={`/agents/recovery?unitId=${selectedRecord.unit_id}`}
                      className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#0D9488] transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Station 5: Recovery</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="enterprise-card p-12 text-center text-[#64748B]">
                Select a return case to view grading and disposition audit details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
