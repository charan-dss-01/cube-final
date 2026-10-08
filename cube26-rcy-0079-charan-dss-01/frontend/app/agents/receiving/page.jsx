"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  Boxes,
  Camera,
  Layers,
  ChevronRight,
  Sparkles,
  PlusCircle,
  Send,
  ArrowRight,
} from "lucide-react";
import { api } from "../../../lib/api";
import AgentPlayground from "../../../components/AgentPlayground";
import AgentPipelineNav from "../../../components/AgentPipelineNav";

export default function ReceivingAgentPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Operator Input Form State - Open by default for real-time inspection & vision uploads
  const [showInputForm, setShowInputForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: "UNIT-RCV-001",
    po_number: "PO-7000",
    po_line: "1",
    sku: "BLUE-BOTTLE-001",
    product_title: "Ergonomic Water Bottle - Blue",
    supplier: "Vendor Prime Global",
    asin: "B0DUMMY001",
    qty_ordered: 12,
    cartons_ordered: 1,
    units_per_carton_ordered: 12,
  });

  const [selectedPreset, setSelectedPreset] = useState("clean_open_carton_12_units.png");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("/samples/receiving/clean_open_carton_12_units.png");

  const handlePhotoSelect = (file) => {
    setSelectedPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setSelectedPreset(null);
    } else {
      setPhotoPreview(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getReceivingRecords({ limit: 100 });
      setRecords(res.records || []);
      setTotal(res.total || 0);
      if (res.records?.length > 0 && !selectedRecord) {
        setSelectedRecord(res.records[0]);
      }
    } catch (err) {
      console.error("Failed to load receiving records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      const res = await api.runReceivingInspection(form);
      await loadData();
      setSelectedRecord(res);
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
      console.error("Failed to run inspection:", err);
      alert("Error executing receiving inspection: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.unit_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.sku?.toLowerCase().includes(search.toLowerCase()) ||
      r.product_title?.toLowerCase().includes(search.toLowerCase());
    const matchesVerdict =
      verdictFilter === "ALL" ||
      r.overall_verdict?.toUpperCase() === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  const getVerdictBadge = (verdict) => {
    switch (verdict?.toUpperCase()) {
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
      default:
        return (
          <span className="badge-warning flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" /> UNCERTAIN
          </span>
        );
    }
  };

  const getReceivingPhotoSrc = (record) => {
    if (!record) return "/images/sample-carton.jpg";
    let src = record.photo_url || record.decision_trace?.photo_ref;
    if (!src && record.photo_refs) {
      try {
        const parsed = typeof record.photo_refs === "string" ? JSON.parse(record.photo_refs) : record.photo_refs;
        if (Array.isArray(parsed) && parsed.length > 0) src = parsed[0];
      } catch (e) {}
    }
    if (!src) return "/images/sample-carton.jpg";
    if (src.startsWith("/static")) return `http://localhost:8000${src}`;
    return src;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadData} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Quick 5-Station Pipeline Navigation Bar */}
        <AgentPipelineNav currentKey="rcv" unitId={selectedRecord?.unit_id || ""} />

        {/* Agent Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                  Agent #1 • Inbound Dock
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                  • Neon DB: <code className="text-[#0F172A] font-semibold">rcv_inspections</code>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                Receiving Manager Station
              </h1>
              <p className="text-sm text-[#475569] mt-0.5">
                Multi-camera carton damage audit, PO manifest reconciliation, and visual carton unit verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInputForm(!showInputForm)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showInputForm ? "Close Input Panel" : "+ Run Inbound Inspection"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8F9F6] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Dock
            </button>
            <div className="px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl">
              {total} Total Inspections
            </div>
          </div>
        </div>

        {/* Agent Interaction Playground Integration (Collapsible for cleaner workflow) */}
        <AgentPlayground
          activeAgentKey="RCV"
          title="Receiving Station Topology & Data Flow"
          subtitle="How Agent #1 (Receiving) validates inbound PO manifests and forwards verified freight proof to Prep and Recovery"
          defaultCollapsed={true}
        />

        {/* Operator Input Form Section */}
        {showInputForm && (
          <div className="enterprise-card p-6 bg-white border-2 border-[#0F766E]/40 shadow-sm animate-scale-in space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E8E8E3] gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Execute Inbound Receiving AI Inspection</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Supply the Purchase Order manifest and snap/upload the inbound carton photograph. Gemini Multimodal Vision autonomously inspects carton integrity, unit damage, and item counts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                  gemini-3.5-flash-lite active
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Autonomous Vision Mode
                </span>
              </div>
            </div>

            <form onSubmit={handleRunInspection} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: PO Manifest (Expected Data Only) */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#0F766E]" />
                      1. PO Manifest / Expected Cargo
                    </span>
                    <span className="text-[10px] text-[#64748B]">What vendor was contracted to deliver</span>
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
                      <label className="block text-[#475569] font-semibold mb-1">PO Number</label>
                      <input
                        type="text"
                        required
                        value={formData.po_number}
                        onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Product SKU</label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Supplier / Vendor</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-[#475569] font-semibold mb-1">Product Title</label>
                    <input
                      type="text"
                      value={formData.product_title}
                      onChange={(e) => setFormData({ ...formData, product_title: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Expected Cartons</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.cartons_ordered}
                        onChange={(e) => setFormData({ ...formData, cartons_ordered: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Expected Total Units</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.qty_ordered}
                        onChange={(e) => setFormData({ ...formData, qty_ordered: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Physical Station Camera & Multimodal Vision Evidence */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2 mb-3">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                        2. Inbound Dock Camera & Physical Photo
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
                            setSelectedPreset("clean_open_carton_12_units.png");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/clean_open_carton_12_units.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "clean_open_carton_12_units.png"
                              ? "bg-teal-50 border-[#0F766E] text-[#0F766E] font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Clean 12-Unit Carton</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Pristine packaging (Pass test)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("crushed_carton_face.png");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/crushed_carton_face.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "crushed_carton_face.png"
                              ? "bg-rose-50 border-rose-500 text-rose-700 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Crushed Carton Defect</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Corner deformation (Fail test)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("open_carton_short_10_units.png");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/open_carton_short_10_units.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "open_carton_short_10_units.png"
                              ? "bg-amber-50 border-amber-500 text-amber-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Short Count (10 of 12)</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Under-delivery defect</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("red_bottle_wrong_colour.png");
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/red_bottle_wrong_colour.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "red_bottle_wrong_colour.png"
                              ? "bg-purple-50 border-purple-500 text-purple-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>Wrong SKU Identity</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">Red unit vs Blue SKU</div>
                        </button>
                      </div>
                    </div>

                    {/* Photo Dropzone or Preview */}
                    <div className="border border-dashed border-teal-300 bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                          <span>Or Upload Custom Pallet Photo:</span>
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
                          <img src={photoPreview} alt="Inspection Target" className="w-14 h-14 object-cover rounded border" />
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
                      <span className="font-semibold">Autonomous Vision Inspection Active:</span> Gemini Multimodal Vision will inspect the physical photo to detect carton integrity (crushing/tears/water), count received units, and verify SKU identity automatically.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E3]">
                <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ready to audit inbound unit against Neon PostgreSQL schema <code className="font-mono text-[#0F172A]">rcv_inspections</code>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                  <span>{submitting ? "Gemini Analyzing Photo & Manifest..." : "⚡ Run Autonomous AI Vision Inspection"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Inspected Inbound Units</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">{total}</div>
            <div className="text-[11px] text-[#0F766E] font-medium mt-1">Neon DB live sync</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Carton Pass Rate</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {total > 0 ? `${Math.round((records.filter(r => r.overall_verdict === "PASS").length / total) * 100)}%` : "0%"}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">Zero damage detected</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Carton Damage / Shortage</div>
            <div className="text-2xl font-bold text-rose-700 mt-1">
              {records.filter(r => r.overall_verdict === "FAIL").length}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Evidence locked for dispute</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">AI Vision Engine</div>
            <div className="text-lg font-bold text-[#0F172A] mt-1 truncate">gemini-3.5-flash-lite</div>
            <div className="text-[11px] text-[#64748B] mt-1">Multimodal dual-angle</div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Unit ID (e.g. UNIT-0003), PO number, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Verdict:</span>
            {["ALL", "PASS", "FAIL", "UNCERTAIN"].map((v) => (
              <button
                key={v}
                onClick={() => setVerdictFilter(v)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  verdictFilter === v
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                }`}
              >
                {v}
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
                <Boxes className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Inbound Manifest Ledger</h3>
              </div>
              <span className="text-xs text-[#64748B]">{filtered.length} matching units</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E8E8E3] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Unit ID</th>
                    <th className="py-3 px-3">PO & SKU</th>
                    <th className="py-3 px-3">Damage Flags</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        Loading receiving inspections from Neon PostgreSQL...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        No receiving records matched your criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isSelected = selectedRecord?.inspection_id === r.inspection_id;
                      return (
                        <tr
                          key={r.inspection_id}
                          onClick={() => setSelectedRecord(r)}
                          className={`cursor-pointer transition hover:bg-[#F8F9F6] ${
                            isSelected ? "bg-teal-50/60 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{r.unit_id}</div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">{r.inspection_id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[#334155] font-medium">{r.sku || "N/A"}</div>
                            <div className="text-[11px] text-[#64748B]">{r.po_number || "PO-N/A"}</div>
                          </td>
                          <td className="py-3 px-3">
                            {r.carton_damage || r.unit_damage ? (
                              <span className="text-rose-600 font-medium">
                                {r.carton_damage || r.unit_damage}
                              </span>
                            ) : (
                              <span className="text-emerald-700">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3">{getVerdictBadge(r.overall_verdict)}</td>
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
                      {selectedRecord.inspection_id}
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                      {selectedRecord.unit_id}
                    </h2>
                  </div>
                  {getVerdictBadge(selectedRecord.overall_verdict)}
                </div>

                {/* Purchase Order & Product Specification */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    PO & Manifest Specifications
                  </div>
                  <div className="bg-[#F8F9F6] p-3.5 rounded-xl border border-[#E8E8E3] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">PO Number:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedRecord.po_number || "PO-7000"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Product SKU:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedRecord.sku || "BLUE-BOTTLE-001"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Product Title:</span>
                      <span className="font-medium text-[#334155] text-right truncate max-w-[200px]">
                        {selectedRecord.product_title || "Standard Catalog Product"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Supplier:</span>
                      <span className="text-[#334155]">{selectedRecord.supplier || "Vendor Prime Global"}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#E8E8E3]">
                      <span className="text-[#64748B]">Qty Ordered:</span>
                      <span className="font-semibold text-[#0F172A]">
                        {selectedRecord.qty_ordered ?? selectedRecord.decision_trace?.what_expected?.quantity ?? 12} units ({selectedRecord.cartons_ordered ?? selectedRecord.decision_trace?.what_expected?.cartons ?? 1} cartons)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Autonomous Vision Detections Card */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    AI Vision Inferences (Computer Vision)
                  </div>
                  <div className="bg-teal-50/40 p-3.5 rounded-xl border border-teal-200/80 space-y-2 text-xs">
                    {(() => {
                      const cd = selectedRecord.carton_damage || selectedRecord.ai_observations?.carton_damage || selectedRecord.decision_trace?.what_ai_observed?.carton_damage;
                      const hasCd = cd && cd !== "none";
                      const qtyRecv = selectedRecord.qty_received ?? selectedRecord.ai_observations?.qty_received ?? selectedRecord.decision_trace?.what_ai_observed?.qty_received ?? selectedRecord.qty_ordered ?? 12;
                      const idMatch = selectedRecord.identity_match || selectedRecord.ai_observations?.identity_match || selectedRecord.decision_trace?.what_ai_observed?.identity_match || "confirmed";
                      const ud = selectedRecord.unit_damage || selectedRecord.ai_observations?.unit_damage || selectedRecord.decision_trace?.what_ai_observed?.unit_damage;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[#475569]">Carton Damage Detected:</span>
                            <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              hasCd ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                              {hasCd ? cd.toUpperCase() : "PRISTINE (NONE)"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#475569]">Units Counted by AI:</span>
                            <span className="font-semibold text-[#0F172A] font-mono">
                              {qtyRecv} units
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#475569]">Identity Verified:</span>
                            <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              idMatch === "mismatch" ? "bg-rose-100 text-rose-700" : (idMatch === "uncertain" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")
                            }`}>
                              {idMatch ? idMatch.toUpperCase() : "CONFIRMED"}
                            </span>
                          </div>
                          {ud && ud !== "none" && (
                            <div className="flex items-center justify-between pt-1 border-t border-teal-200/60 text-rose-700">
                              <span>Unit Physical Defect:</span>
                              <span className="font-semibold">{ud}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* AI Decision Trace & Vision Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    AI Vision Reasoning & Forensic Trace
                  </div>
                  <div className="bg-[#FBFBFA] p-3.5 rounded-xl border border-[#E8E8E3] text-xs space-y-2 font-mono">
                    <div className="text-[#334155]">
                      <span className="text-[#64748B]">Decision Reason:</span>{" "}
                      {selectedRecord.decision_trace?.why ||
                        "Multimodal dual-angle carton inspection verified against purchase order line."}
                    </div>
                    {selectedRecord.decision_trace?.findings && Array.isArray(selectedRecord.decision_trace.findings) && (
                      <div className="pt-2 border-t border-[#E8E8E3] space-y-1">
                        <span className="text-[#64748B]">Inspection Findings:</span>
                        {selectedRecord.decision_trace.findings.map((f, i) => {
                          const reasonText = Array.isArray(f.reason)
                            ? f.reason.join(", ")
                            : (typeof f.reason === "string" ? f.reason : (f.type || JSON.stringify(f.reason || "")));
                          return (
                            <div key={i} className="text-[11px] text-[#475569] pl-2 border-l-2 border-teal-500">
                              <span className="font-semibold text-[#0F172A]">{f.check || "Check"}:</span>{" "}
                              {reasonText || "Observation recorded"}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Multimodal Photo Attachment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                    Multimodal Evidence Photo
                  </div>
                  <div className="bg-[#F8F9F6] p-2.5 rounded-xl border border-[#E8E8E3]">
                    <div className="text-[11px] text-[#64748B] mb-1.5 flex items-center justify-between">
                      <span>Original Inbound Inspection Capture:</span>
                      <span className="font-mono text-[#0F766E]">Evidence File</span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-900/5 max-h-48 flex items-center justify-center">
                      <img
                        src={getReceivingPhotoSrc(selectedRecord)}
                        alt="Inbound Evidence"
                        className="max-h-44 object-contain rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Downstream Cross-Agent Evidence Handoff & Pipeline Flow */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#0F766E]">Central Neon DB Orchestration</span>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        Inbound proof recorded. Proceed to next station in the warehouse pipeline or trace full lifecycle.
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
                      href={`/agents/prep?unitId=${selectedRecord.unit_id}`}
                      className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#0D9488] transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Station 2: Prep</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="enterprise-card p-12 text-center text-[#64748B]">
                Select an inspection from the ledger to inspect forensic details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
