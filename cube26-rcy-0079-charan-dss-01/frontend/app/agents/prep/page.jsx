"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import {
  Box,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  FileCheck,
  ChevronRight,
  Sparkles,
  PlusCircle,
  Send,
  Camera,
  Layers,
  ArrowRight,
} from "lucide-react";
import { api } from "../../../lib/api";
import AgentPlayground from "../../../components/AgentPlayground";
import AgentPipelineNav from "../../../components/AgentPipelineNav";

export default function PrepAgentPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Operator Input Form State - Open by default for real-time prep inspection & vision uploads
  const [showInputForm, setShowInputForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [formData, setFormData] = useState({
    unit_id: "UNIT-PRP-001",
    product_id: "DEMO-BOTTLE-001",
    work_order_id: "WO-88902",
    operator_name: "Operator #104",
    view_angles: "front",
    prep_type: "polybag",
    polybag_sealed: true,
    suffocation_warning: true,
    barcode_curved: false,
  });

  const [selectedPreset, setSelectedPreset] = useState("scenario_1_pass.jpg");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("/samples/prep/scenario_1_pass.jpg");

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
      const res = await api.getPrepRecords({ limit: 100 });
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
      console.error("Failed to load prep records:", err);
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
    setActionError(null);
    setActionSuccess(null);
    try {
      setSubmitting(true);
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (selectedPhoto) {
        form.append("photo", selectedPhoto);
      } else if (selectedPreset) {
        form.append("preset_image", selectedPreset);
      }
      const res = await api.runPrepInspection(form);
      await loadData();
      setSelectedRecord(res);
      setActionSuccess(`Prep audit completed for ${res.unit_id || formData.unit_id}. Compliance status: ${res.overall_status || "RECORDED"}`);
      setTimeout(() => setActionSuccess(null), 6000);
      setFormData(prev => {
        const match = prev.unit_id.match(/(\d+)$/);
        const nextNum = match ? String(parseInt(match[1]) + 1).padStart(match[1].length, '0') : "002";
        const prefix = prev.unit_id.replace(/\d+$/, '');
        return {
          ...prev,
          unit_id: prefix + nextNum,
        };
      });
    } catch (err) {
      console.error("Failed to run prep inspection:", err);
      setActionError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.unit_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.product_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.agent_action_message?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      r.overall_status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "PASS":
        return (
          <span className="badge-pass flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
          </span>
        );
      case "FAIL":
        return (
          <span className="badge-fail flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> FAIL
          </span>
        );
      case "CORRECT_AND_RESCAN":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> RESCAN
          </span>
        );
      default:
        return (
          <span className="badge-warning flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" /> {status || "REVIEW"}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadData} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Quick 5-Station Pipeline Navigation Bar */}
        <AgentPipelineNav currentKey="prp" unitId={selectedRecord?.unit_id || formData.unit_id || ""} />

        {/* Agent Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shadow-sm">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                  Agent #2 • FBA Prep Station
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                  • Neon DB: <code className="text-[#0F172A] font-semibold">prp_inspections</code>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                Prep Manager Compliance Station
              </h1>
              <p className="text-sm text-[#475569] mt-0.5">
                Polybag seal integrity, suffocation warning OCR verification, curved FNSKU barcode detection, and FBA prep defect prevention.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInputForm(!showInputForm)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showInputForm ? "Close Input Panel" : "+ Audit Unit Prep"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8F9F6] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Prep Line
            </button>
            <div className="px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl">
              {total} Prep Audits
            </div>
          </div>
        </div>

        {/* Agent Interaction Playground Integration (Collapsible for cleaner workflow) */}
        <AgentPlayground
          activeAgentKey="PRP"
          title="Prep Station Topology & Compliance Data Flow"
          subtitle="How Agent #2 (Prep) verifies FBA packaging rules, polybag airtight seals, and flat barcodes for outbound pack and recovery"
          defaultCollapsed={true}
        />

        {/* Operator Input Form Section */}
        {showInputForm && (
          <div className="enterprise-card p-6 bg-white border-2 border-[#0F766E]/40 shadow-sm animate-scale-in space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E8E8E3] gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Execute FBA Prep Compliance AI Inspection</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Supply the product SKU & work order, and capture the physical prepped item photo. The Prep Manager Agent autonomously audits polybag seal integrity, suffocation warning text, and barcode curvature.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                  Gemini 3.5 Flash Multimodal
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Automated OCR & Vision
                </span>
              </div>
            </div>

            {actionError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-900">Prep Inspection Issue</div>
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
                    <div className="font-semibold text-emerald-900">Prep Audit Logged</div>
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

            <form onSubmit={handleRunInspection} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Work Order & Prep Instructions */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                      1. Prep Work Order Specs
                    </span>
                    <span className="text-[10px] text-[#64748B]">Work station assignment</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Unit Tracking ID</label>
                      <input
                        type="text"
                        required
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Work Order ID</label>
                      <input
                        type="text"
                        required
                        value={formData.work_order_id}
                        onChange={(e) => setFormData({ ...formData, work_order_id: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-[#475569] font-semibold mb-1">Product SKU / Catalog ID</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-medium outline-none focus:border-[#0F766E]"
                    >
                      <option value="DEMO-BOTTLE-001">DEMO-BOTTLE-001 - Liquid Container (500ml Shampoo)</option>
                      <option value="DEMO-ELEC-002">DEMO-ELEC-002 - Boxed Electronics Hub (Smart Gateway)</option>
                      <option value="DEMO-TOY-003">DEMO-TOY-003 - Plush Bear Toy (Soft Plushie)</option>
                      <option value="DEMO-GLASS-004">DEMO-GLASS-004 - Fragile Glassware Mug Set</option>
                      <option value="DEMO-FOOD-005">DEMO-FOOD-005 - Organic Energy Bar Pack (Expiry Item)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Prep Procedure Type</label>
                      <select
                        value={formData.prep_type}
                        onChange={(e) => setFormData({ ...formData, prep_type: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      >
                        <option value="polybag">Polybagging (&gt;1.5 mil)</option>
                        <option value="bubblewrap">Bubble Wrapping (Fragile)</option>
                        <option value="labeling">FNSKU Barcode Labeling</option>
                        <option value="boxing">Set / Bundle Boxing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Station Operator</label>
                      <input
                        type="text"
                        value={formData.operator_name}
                        onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Station Camera & Evidence Photo */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2 mb-3">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                        2. Prep Station Camera & Inspection Photo
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-medium">Vision Input Source</span>
                    </div>

                    {/* Camera Presets Selector */}
                    <div className="space-y-1.5 mb-3">
                      <label className="block text-[11px] font-semibold text-[#475569]">
                        Choose Station Camera Preset or Upload Custom Photo:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("scenario_1_pass.jpg");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/prep/scenario_1_pass.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "scenario_1_pass.jpg"
                              ? "bg-teal-50 border-[#0F766E] text-[#0F766E] font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Compliant Polybag</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Heat seal & warning present (PASS)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("scenario_2_fail_curved.jpg");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/prep/scenario_2_fail_curved.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "scenario_2_fail_curved.jpg"
                              ? "bg-amber-50 border-amber-500 text-amber-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Curved Barcode Defect</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Label curved on cylinder ($25 fee)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("scenario_4_fail_warning.jpg");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/prep/scenario_4_fail_warning.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "scenario_4_fail_warning.jpg"
                              ? "bg-rose-50 border-rose-500 text-rose-700 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Missing Warning Label</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Suffocation warning missing ($35 fee)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("scenario_7_pass_toy.jpg");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/prep/scenario_7_pass_toy.jpg");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "scenario_7_pass_toy.jpg"
                              ? "bg-purple-50 border-purple-500 text-purple-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>Toy Polybag Packaging</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Child-safety certified (PASS)</div>
                        </button>
                      </div>
                    </div>

                    {/* Photo Dropzone or Preview */}
                    <div className="border border-dashed border-teal-300 bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                          <span>Or Upload Prepped Unit Photo:</span>
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
                          <img src={photoPreview} alt="Prep Target" className="w-14 h-14 object-cover rounded border" />
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
                      <span className="font-semibold">Autonomous Prep Inspection Active:</span> Gemini Computer Vision autonomously inspects the image for polybag sealing, suffocation warning text visibility, and barcode curvature.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E3]">
                <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  FBA prep audit will commit compliance verification to <code className="font-mono text-[#0F172A]">prp_inspections</code>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                  <span>{submitting ? "Auditing Prep via Computer Vision..." : "⚡ Run Prep AI Compliance Audit"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Audited Units</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">{total}</div>
            <div className="text-[11px] text-[#0F766E] font-medium mt-1">Real-time database feed</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Compliance Pass Rate</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {total > 0 ? `${Math.round((records.filter(r => r.overall_status === "PASS").length / total) * 100)}%` : "0%"}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">Ready for FBA outbound</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Defect Fees Prevented</div>
            <div className="text-2xl font-bold text-[#0F766E] mt-1">
              ${records.reduce((acc, r) => acc + (parseFloat(r.defect_fee_amount) || 0), 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Disputable evidence gathered</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Operator Action Trigger</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {records.filter(r => r.requires_rescan).length} Rescans
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">Barcode curvature re-align</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Unit ID, Product ID, or operator action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Status:</span>
            {["ALL", "PASS", "FAIL", "CORRECT_AND_RESCAN"].map((s) => (
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

        {/* Main Content: Split Grid Table + Inspection Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table List */}
          <div className="lg:col-span-7 enterprise-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E8E3] bg-[#FBFBFA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">FBA Prep Compliance Log</h3>
              </div>
              <span className="text-xs text-[#64748B]">{filtered.length} matching audits</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E8E8E3] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Inspection ID</th>
                    <th className="py-3 px-3">Unit / Product</th>
                    <th className="py-3 px-3">Defect Fee</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        Loading prep audits from Neon PostgreSQL...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        No prep inspections found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isSelected = selectedRecord?.id === r.id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className={`cursor-pointer transition hover:bg-[#F8F9F6] ${
                            isSelected ? "bg-teal-50/60 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{r.id}</div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Live"}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[#334155] font-semibold">{r.unit_id}</div>
                            <div className="text-[11px] text-[#64748B]">{r.product_id}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#0F766E]">
                            ${parseFloat(r.defect_fee_amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">{getStatusBadge(r.overall_status)}</td>
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

          {/* Inspection Detail Drawer */}
          <div className="lg:col-span-5 space-y-4">
            {selectedRecord ? (
              <div className="enterprise-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E3]">
                  <div>
                    <span className="text-[11px] font-mono text-[#0F766E] font-semibold">
                      {selectedRecord.id}
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                      {selectedRecord.unit_id}
                    </h2>
                  </div>
                  {getStatusBadge(selectedRecord.overall_status)}
                </div>

                {/* Autonomous Vision Inferences Card */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    AI Vision Inferences (Multimodal OCR & Surface Audit)
                  </div>
                  <div className="bg-teal-50/40 p-3.5 rounded-xl border border-teal-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">1. Suffocation Warning Label:</span>
                      {selectedRecord.ai_observations?.suffocation_warning === false || (selectedRecord.overall_status === "FAIL" && !selectedRecord.requires_rescan) ? (
                        <span className="font-semibold text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> MISSING / NOT DETECTED
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED BY OCR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">2. Polybag Heat Seal:</span>
                      {selectedRecord.ai_observations?.polybag_sealed === false ? (
                        <span className="font-semibold text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> UNSEALED DEFECT
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SEALED (&gt;1.5 mil)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">3. FNSKU Barcode Flatness:</span>
                      {selectedRecord.requires_rescan || selectedRecord.ai_observations?.barcode_curved ? (
                        <span className="font-semibold text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> CURVED (Rescan Required)
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> FLAT &amp; SCANNABLE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-teal-200/60">
                      <span className="text-[#475569]">Defect Charge Risk Assessed:</span>
                      <span className={`font-bold font-mono ${parseFloat(selectedRecord.defect_fee_amount || 0) > 0 ? "text-rose-700" : "text-[#0F766E]"}`}>
                        ${parseFloat(selectedRecord.defect_fee_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Directives */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    Operator Action Directive
                  </div>
                  <div className="bg-[#FBFBFA] p-3.5 rounded-xl border border-[#E8E8E3] text-xs space-y-2">
                    <div className="text-[#0F172A] font-medium">
                      {selectedRecord.agent_action_message ||
                        "Item passed visual prep inspection and is cleared for outbound boxing."}
                    </div>
                    {selectedRecord.operator_feedback_notes && (
                      <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#E8E8E3]">
                        Operator Notes: {selectedRecord.operator_feedback_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Multimodal Prep Photo Attachment */}
                {(selectedRecord.photo_url || selectedRecord.photo_path) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                      Multimodal Prep Photo Evidence
                    </div>
                    <div className="bg-[#F8F9F6] p-2.5 rounded-xl border border-[#E8E8E3]">
                      <div className="rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-900/5 max-h-48 flex items-center justify-center">
                        <img
                          src={
                            selectedRecord.photo_url
                              ? `http://localhost:8000${selectedRecord.photo_url}`
                              : "/images/sample-prep.jpg"
                          }
                          alt="Prep Evidence"
                          className="max-h-44 object-contain rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=60";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Downstream Cross-Agent Evidence Handoff & Pipeline Flow */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#0F766E]">Audit Trail Synced</span>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        Prep compliance logged. Route unit downstream to Outbound Pack or trace full lifecycle.
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
                      href={`/agents/pack?unitId=${selectedRecord.unit_id}`}
                      className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#0D9488] transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Station 3: Pack</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="enterprise-card p-12 text-center text-[#64748B]">
                Select a prep inspection to view compliance specifications.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
