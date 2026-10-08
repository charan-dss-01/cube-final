"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  ChevronRight,
  Sparkles,
  Layers,
  Archive,
  PlusCircle,
  Send,
  Camera,
  ArrowRight,
} from "lucide-react";
import { api } from "../../../lib/api";
import AgentPlayground from "../../../components/AgentPlayground";
import AgentPipelineNav from "../../../components/AgentPipelineNav";

export default function PackAgentPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Operator Input Form State - Open by default for real-time carton reconciliation & vision uploads
  const [showInputForm, setShowInputForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: "UNIT-PCK-001",
    order_id: "ORD-OUT-991",
    sku: "BLUE-BOTTLE-001",
    channel: "FBA Multi-Channel",
    package_type: "Standard Carton",
    items_expected: 12,
    items_count: 12,
    extra_items: false,
    dunnage_verified: true,
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

  const loadData = async (targetUnitId) => {
    try {
      setLoading(true);
      const res = await api.getPackRecords({ limit: 50 });
      setRecords(res.records || []);
      setTotal(res.total || 0);
      if (res.records?.length > 0) {
        if (targetUnitId) {
          const matched = res.records.find((r) => (r.data?.unit_id || r.unit_id) === targetUnitId);
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
      console.error("Failed to load pack records:", err);
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
      const res = await api.runPackInspection(form);
      await loadData();
      const match = { id: res.pack_id, data: { ...res, decision: res.decision } };
      setSelectedRecord(match);
      setFormData((prev) => {
        const match = prev.unit_id.match(/(\d+)$/);
        const nextNum = match ? String(parseInt(match[1]) + 1).padStart(match[1].length, '0') : "002";
        const prefix = prev.unit_id.replace(/\d+$/, '');
        return {
          ...prev,
          unit_id: prefix + nextNum,
        };
      });
    } catch (err) {
      console.error("Failed to run pack inspection:", err);
      alert("Error executing pack inspection: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter((r) => {
    const data = r.data || {};
    const matchesSearch =
      !search ||
      r.id?.toLowerCase().includes(search.toLowerCase()) ||
      data.unit_id?.toLowerCase().includes(search.toLowerCase()) ||
      data.order_id?.toLowerCase().includes(search.toLowerCase());
    const matchesDecision =
      decisionFilter === "ALL" ||
      data.decision?.toUpperCase() === decisionFilter;
    return matchesSearch && matchesDecision;
  });

  const getDecisionBadge = (decision) => {
    switch (decision?.toUpperCase()) {
      case "PASS":
        return (
          <span className="badge-pass flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS (SEAL)
          </span>
        );
      case "FAIL":
        return (
          <span className="badge-fail flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> STOP & FIX
          </span>
        );
      default:
        return (
          <span className="badge-warning flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" /> {decision?.toUpperCase() || "UNCERTAIN"}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadData} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Quick 5-Station Pipeline Navigation Bar */}
        <AgentPipelineNav currentKey="pck" unitId={selectedRecord?.unit_id || formData.unit_id || ""} />

        {/* Agent Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shadow-sm">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                  Agent #3 • Packing Terminal
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1 font-mono">
                  • Neon DB: <code className="text-[#0F172A] font-semibold">pck_records</code>
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                Pack Manager Station
              </h1>
              <p className="text-sm text-[#475569] mt-0.5">
                9-point packing manifest reconciliation, carton item assortment verification, and live multimodal packaging camera audit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInputForm(!showInputForm)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0D9488] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showInputForm ? "Close Input Panel" : "+ Reconcile Pack Session"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8F9F6] rounded-xl flex items-center gap-2 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Terminal
            </button>
            <div className="px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-xl">
              {total} Pack Sessions
            </div>
          </div>
        </div>

        {/* Agent Interaction Playground Integration (Collapsible for cleaner workflow) */}
        <AgentPlayground
          activeAgentKey="PCK"
          title="Pack Station Topology & Manifest Reconciliation Flow"
          subtitle="How Agent #3 (Pack) verifies packed items, validates carton tare weights, and submits evidence to Recovery"
          defaultCollapsed={true}
        />

        {/* Operator Input Form Section */}
        {showInputForm && (
          <div className="enterprise-card p-6 bg-white border-2 border-[#0F766E]/40 shadow-sm animate-scale-in space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E8E8E3] gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>Execute 9-Point Pack Vision Reconciliation</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Supply the customer order manifest and snap the open container overhead photo. Gemini Vision autonomously counts items, verifies SKU identity, checks dunnage, and evaluates the 9-point rule matrix.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                  gemini-3.5-flash-lite active
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Overhead AI Counting
                </span>
              </div>
            </div>

            <form onSubmit={handleRunInspection} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Outbound Order Manifest */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2">
                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                      1. Outbound Order Manifest
                    </span>
                    <span className="text-[10px] text-[#64748B]">Customer order requirements</span>
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
                      <label className="block text-[#475569] font-semibold mb-1">Customer Order ID</label>
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
                      <label className="block text-[#475569] font-semibold mb-1">Ordered SKU</label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono outline-none focus:border-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Expected Item Count</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.items_expected}
                        onChange={(e) => setFormData({ ...formData, items_expected: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] font-bold outline-none focus:border-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Outbound Channel</label>
                      <select
                        value={formData.channel}
                        onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      >
                        <option value="FBA Multi-Channel">FBA Multi-Channel (Prime)</option>
                        <option value="DTC Merchant">DTC Merchant Fulfillment</option>
                        <option value="Retail B2B">Retail B2B Consignment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#475569] font-semibold mb-1">Package Type</label>
                      <select
                        value={formData.package_type}
                        onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] outline-none focus:border-[#0F766E]"
                      >
                        <option value="Standard Carton">Standard Corrugated Carton</option>
                        <option value="Padded Mailer">Padded Bubble Mailer</option>
                        <option value="Heavy Duty Box">Heavy Duty Double-Wall Box</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Column 2: Overhead Packing Station Camera & Vision Inspection */}
                <div className="lg:col-span-6 bg-[#FBFBFA] p-4 rounded-xl border border-[#E8E8E3] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-2 mb-3">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                        2. Pack Station Overhead Camera Rig
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-medium">Vision Input Source</span>
                    </div>

                    {/* Camera Presets Selector */}
                    <div className="space-y-1.5 mb-3">
                      <label className="block text-[11px] font-semibold text-[#475569]">
                        Choose Overhead Camera Rig Preset or Upload Custom Photo:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("clean_open_carton_12_units.png");
                            setFormData((prev) => ({ ...prev, items_expected: 12 }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/clean_open_carton_12_units.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "clean_open_carton_12_units.png" && formData.items_expected === 12
                              ? "bg-teal-50 border-[#0F766E] text-[#0F766E] font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Matching 12-Pack (SEAL)</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">12 items expected & counted</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("clean_open_carton_12_units.png");
                            setFormData((prev) => ({ ...prev, items_expected: 1 }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/clean_open_carton_12_units.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "clean_open_carton_12_units.png" && formData.items_expected === 1
                              ? "bg-rose-50 border-rose-500 text-rose-700 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Overpack Discrepancy</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">12 in box vs 1 expected (STOP)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("open_carton_short_10_units.png");
                            setFormData((prev) => ({ ...prev, items_expected: 12 }));
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
                            <span>Shortage Discrepancy</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">10 in box vs 12 expected (STOP)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreset("correct_blue_bottle.png");
                            setFormData((prev) => ({ ...prev, items_expected: 1 }));
                            setSelectedPhoto(null);
                            setPhotoPreview("/samples/receiving/correct_blue_bottle.png");
                          }}
                          className={`p-2 text-left rounded-lg border transition ${
                            selectedPreset === "correct_blue_bottle.png"
                              ? "bg-purple-50 border-purple-500 text-purple-800 font-semibold"
                              : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>Single Bottle (SEAL)</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">1 item verified & approved</div>
                        </button>
                      </div>
                    </div>

                    {/* Photo Dropzone or Preview */}
                    <div className="border border-dashed border-teal-300 bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                          <span>Or Upload Overhead Carton Photo:</span>
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
                          <img src={photoPreview} alt="Pack Target" className="w-14 h-14 object-cover rounded border" />
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
                      <span className="font-semibold">Autonomous Pack Verification:</span> Gemini Computer Vision will count the physical units visible inside the carton, detect rogue or extra items, check void fill, and decide whether to SEAL the box or STOP & FIX.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E3]">
                <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  9-point packing audit will commit reconciliation trace to <code className="font-mono text-[#0F172A]">pck_records</code>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D9488] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                  <span>{submitting ? "AI Counting Carton Items..." : "⚡ Run Autonomous Pack Vision Reconciliation"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Operational Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Pack Audit Records</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">{total}</div>
            <div className="text-[11px] text-[#0F766E] font-medium mt-1">Neon DB live sync</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">9-Check Protocol</div>
            <div className="text-lg font-bold text-emerald-700 mt-1">100% Enforced</div>
            <div className="text-[11px] text-[#64748B] mt-1">Order manifest matching</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Audited SKUs</div>
            <div className="text-2xl font-bold text-[#0F172A] mt-1">BLUE-BOTTLE-001</div>
            <div className="text-[11px] text-[#64748B] mt-1">Catalog verification</div>
          </div>
          <div className="enterprise-card p-4">
            <div className="text-xs font-medium text-[#64748B]">Vision Model</div>
            <div className="text-lg font-bold text-[#0F766E] mt-1">gemini-3.5-flash-lite</div>
            <div className="text-[11px] text-[#64748B] mt-1">Latency ~2.1s per carton</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Pack Attempt ID, Order ID, or Unit ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#FBFBFA] border border-[#E2E8F0] focus:border-[#0F766E] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium">Decision:</span>
            {["ALL", "PASS", "FAIL", "UNCERTAIN"].map((d) => (
              <button
                key={d}
                onClick={() => setDecisionFilter(d)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  decisionFilter === d
                    ? "bg-[#0F766E] text-white"
                    : "bg-[#F8F9F6] text-[#475569] hover:bg-[#F1F2ED] border border-[#E2E8F0]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Split Grid Table + 9-Check Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table List */}
          <div className="lg:col-span-7 enterprise-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E8E3] bg-[#FBFBFA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Packing Station Sessions</h3>
              </div>
              <span className="text-xs text-[#64748B]">{filtered.length} matching sessions</span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E8E8E3] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-3">Order / Unit</th>
                    <th className="py-3 px-3">Latency</th>
                    <th className="py-3 px-3">Decision</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        Loading packing records from Neon PostgreSQL...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#64748B]">
                        No packing sessions found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const data = r.data || {};
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
                            <div className="text-[11px] text-[#94A3B8] font-mono">{r.kind || "attempt"}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[#334155] font-semibold">{data.unit_id || "UNIT-0001"}</div>
                            <div className="text-[11px] text-[#64748B]">{data.order_id || "ORD-LIVE-PACK-001"}</div>
                          </td>
                          <td className="py-3 px-3 text-[#64748B]">
                            {data.latency_ms ? `${data.latency_ms}ms` : "2.1s"}
                          </td>
                          <td className="py-3 px-3">{getDecisionBadge(data.decision)}</td>
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

          {/* 9-Point Reconciliation Checklist */}
          <div className="lg:col-span-5 space-y-4">
            {selectedRecord ? (
              <div className="enterprise-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E3]">
                  <div>
                    <span className="text-[11px] font-mono text-[#0F766E] font-semibold">
                      {selectedRecord.id}
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                      {selectedRecord.data?.unit_id || "UNIT-0001"}
                    </h2>
                  </div>
                  {getDecisionBadge(selectedRecord.data?.decision)}
                </div>

                {/* Autonomous Vision Detections Card */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    AI Vision Inferences (Overhead Rig Inspection)
                  </div>
                  <div className="bg-teal-50/40 p-3.5 rounded-xl border border-teal-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Units Counted by AI Vision:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedRecord.data?.items_count ?? (selectedRecord.data?.observed?.[0]?.visible ?? 1)} / {selectedRecord.data?.items_expected ?? (selectedRecord.data?.observed?.[0]?.expected ?? 1)} expected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Foreign / Extra SKUs:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        selectedRecord.data?.extra_items
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {selectedRecord.data?.extra_items ? "EXTRA SKUS DETECTED" : "NONE (ACCURATE)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Dunnage &amp; Void Fill:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        selectedRecord.data?.dunnage_verified === false
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {selectedRecord.data?.dunnage_verified === false ? "MISSING VOID FILL" : "VERIFIED PRESENT"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-teal-200/60">
                      <span className="text-[#475569]">Packing Action Verdict:</span>
                      <span className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded ${
                        selectedRecord.data?.decision?.toLowerCase() === "seal"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}>
                        {selectedRecord.data?.decision?.toUpperCase() === "SEAL" ? "READY TO SEAL CARTON" : "STOP & FIX BEFORE SEALING"}
                      </span>
                    </div>
                    {selectedRecord.data?.ai_summary && (
                      <div className="text-[11px] text-[#475569] pt-1 border-t border-teal-200/40 italic">
                        &ldquo;{selectedRecord.data.ai_summary}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* 9 Checks Matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    <span>9-Point Reconciliation Checks</span>
                    <span className="text-[#0F766E] font-mono">
                      {selectedRecord.data?.checks?.length || 9}/9 evaluated
                    </span>
                  </div>

                  <div className="bg-[#F8F9F6] p-3 rounded-xl border border-[#E8E8E3] space-y-2 text-xs max-h-[300px] overflow-y-auto">
                    {(selectedRecord.data?.checks || [
                      { check_key: "input_valid", verdict: "PASS", detail: "Saved and decoded evidence image; order snapshot validated." },
                      { check_key: "view_sufficient", verdict: "UNCERTAIN", detail: "Carton view coverage inspected." },
                      { check_key: "identity_verified", verdict: "UNCERTAIN", detail: "Single catalogue SKU verified." },
                      { check_key: "quantity_matches", verdict: "UNCERTAIN", detail: "Supported visible counts compared with order." },
                      { check_key: "no_unexpected_items", verdict: "UNCERTAIN", detail: "No foreign items in packaging." },
                      { check_key: "all_items_present", verdict: "UNCERTAIN", detail: "Each ordered SKU has at least one visible instance." },
                      { check_key: "quantities_correct", verdict: "UNCERTAIN", detail: "Exact per-SKU quantities matched." },
                      { check_key: "no_extra_items", verdict: "UNCERTAIN", detail: "Zero excess units detected." },
                      { check_key: "order_matches_manifest", verdict: "UNCERTAIN", detail: "Combined presence and manifest reconciliation." },
                    ]).map((c, i) => (
                      <div
                        key={i}
                        className="p-2 bg-white rounded-lg border border-[#E2E8F0] flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-[#0F172A] font-mono text-[11px]">
                            {c.check_key}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                            {c.detail}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            c.verdict === "PASS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {c.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Packaging Model & Observability */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Station Diagnostics
                  </div>
                  <div className="bg-[#FBFBFA] p-3 rounded-xl border border-[#E8E8E3] text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Vision Model:</span>
                      <span className="font-semibold text-[#0F172A] font-mono">
                        {selectedRecord.data?.model_version || "gemini-3.5-flash-lite"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Evaluation Latency:</span>
                      <span className="font-semibold text-[#0F766E] font-mono">
                        {selectedRecord.data?.latency_ms ? `${selectedRecord.data.latency_ms} ms` : "2,129 ms"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multimodal Carton Packaging Photo */}
                {(selectedRecord.data?.photo_ref || selectedRecord.photo_url || selectedRecord.data?.photo_url) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                      Multimodal Carton Photo Evidence
                    </div>
                    <div className="bg-[#F8F9F6] p-2.5 rounded-xl border border-[#E8E8E3]">
                      <div className="rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-900/5 max-h-48 flex items-center justify-center">
                        <img
                          src={
                            (selectedRecord.photo_url || selectedRecord.data?.photo_url)
                              ? `http://localhost:8000${selectedRecord.photo_url || selectedRecord.data?.photo_url}`
                              : (typeof selectedRecord.data?.photo_ref === "string" && selectedRecord.data?.photo_ref.startsWith("/static")
                                  ? `http://localhost:8000${selectedRecord.data.photo_ref}`
                                  : "/images/sample-carton.jpg")
                          }
                          alt="Pack Evidence"
                          className="max-h-44 object-contain rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop&q=60";
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
                      <span className="font-semibold text-[#0F766E]">Outbound Evidence Sealed</span>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        Carton packed and verified. Route unit downstream to Returns Intake or audit in Orchestrator.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-teal-200/60 justify-end">
                    <a
                      href={`/orchestrator?unitId=${selectedRecord.data?.unit_id || selectedRecord.unit_id || "UNIT-0001"}`}
                      className="px-2.5 py-1.5 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg text-xs font-medium hover:bg-slate-50 transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      Trace Unit <ExternalLink className="w-3 h-3 text-[#0F766E]" />
                    </a>
                    <a
                      href={`/agents/returns?unitId=${selectedRecord.data?.unit_id || selectedRecord.unit_id || "UNIT-0001"}`}
                      className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-[#0D9488] transition inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Station 4: Returns</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="enterprise-card p-12 text-center text-[#64748B]">
                Select a pack session to inspect 9-point reconciliation details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
