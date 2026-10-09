"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Maximize2,
  Minimize2,
  Filter,
  FileCheck2,
  RefreshCw,
  Search,
  Database,
  Boxes,
} from "lucide-react";

// The canonical 5-Agent configurations matching Pod 7 and existing Neon DB models
export const AGENT_CONFIGS = {
  RCV: {
    key: "RCV",
    num: "1",
    name: "Receiving Manager",
    role: "Inbound PO Verification & Dock Intake",
    accent: "#0F766E",
    bgAccent: "#F0FDFA",
    borderAccent: "#CCFBF1",
    icon: Truck,
    href: "/agents/receiving",
    tables: ["rcv_units", "rcv_inspections"],
    inputs: ["Carrier Bill of Lading (BOL)", "ERP Purchase Order Manifest", "Inbound Dock Photos"],
    outputs: ["Physical Dock Intake Log", "Carton Integrity Finding", "Received Qty Discrepancy"],
    evidenceType: "Inbound Receiving Proof (CRUSH / TEAR / QTY)",
    downstream: ["PRP", "RCY"],
    directConnections: [
      { target: "PRP", type: "Custody Handoff", label: "Accepted freight forwarded to prep benches", data: "Unit ID, SKU, Inbound condition" },
      { target: "RCY", type: "Forensic Evidence", label: "Dock damage & receiving discrepancies", data: "rcv_inspections proof records" },
    ],
    upstream: [],
    level1: "Verifies arriving carrier freight against Purchase Orders and inspects physical carton damage on dock.",
    level2: {
      endpoints: ["GET /api/v1/agents/receiving/records", "POST /api/v1/agents/receiving/run"],
      contracts: "EvidenceContract: INSP-RCV-* with carton_damage, qty_received vs qty_ordered",
      schema: "{ inspection_id, unit_id, overall_verdict, carton_damage, qty_received, qty_ordered }",
    },
  },
  PRP: {
    key: "PRP",
    num: "2",
    name: "Prep Manager",
    role: "FBA Visual Prep & Packaging Compliance",
    accent: "#059669",
    bgAccent: "#ECFDF5",
    borderAccent: "#A7F3D0",
    icon: Sparkles,
    href: "/agents/prep",
    tables: ["prp_inspections", "prp_rules"],
    inputs: ["Unit ID & Work Order", "Prep Rule Requirements", "Camera Inspection Photo"],
    outputs: ["Polybag Seal Audit", "Suffocation Warning OCR", "FNSKU Flat Barcode Verification"],
    evidenceType: "Packaging Compliance Proof (POLYBAG / BARCODE / SEAL)",
    downstream: ["PCK", "RCY"],
    directConnections: [
      { target: "PCK", type: "Custody Handoff", label: "Prepped units staged for pack benches", data: "Unit ID, Polybag seal status, Barcode compliance" },
      { target: "RCY", type: "Forensic Evidence", label: "Packaging compliance proof to refute defect fees", data: "prp_inspections compliance certificates" },
    ],
    upstream: [
      { source: "RCV", type: "Custody Intake", label: "Inbound accepted units from dock", data: "Unit ID, Freight condition" },
    ],
    level1: "Audits polybag heat-seals, suffocation warnings, and flat FNSKU barcodes before outbound fulfillment.",
    level2: {
      endpoints: ["GET /api/v1/agents/prep/records", "POST /api/v1/agents/prep/run"],
      contracts: "EvidenceContract: INS-PRP-* with polybag_sealed, suffocation_warning, barcode_curved",
      schema: "{ id, unit_id, overall_status, defect_fee_amount, recovery_disputable }",
    },
  },
  PCK: {
    key: "PCK",
    num: "3",
    name: "Pack Manager",
    role: "Outbound Carton Packing & Order Verification",
    accent: "#4F46E5",
    bgAccent: "#EEF2FF",
    borderAccent: "#C7D2FE",
    icon: PackageCheck,
    href: "/agents/pack",
    tables: ["pck_records", "cw_workflows"],
    inputs: ["Order ID & Lines", "Package Manifest", "Pack Bench Overhead Camera Scan"],
    outputs: ["Item Count Match", "Carton Tare Weight Audit", "Tamper Tape Seal Certification"],
    evidenceType: "Packing Verification Proof (ITEM_COUNT / TARE / SEAL)",
    downstream: ["RCY"],
    directConnections: [
      { target: "RCY", type: "Forensic Evidence", label: "Outbound packing proof to refute shortage fees", data: "pck_records observed items & box photos" },
    ],
    upstream: [
      { source: "PRP", type: "Prepped Item Intake", label: "Compliant prepped goods from Station 2", data: "Unit ID, Validated barcode" },
    ],
    level1: "Reconciles packed items inside the shipping box against customer orders using overhead cameras.",
    level2: {
      endpoints: ["GET /api/v1/agents/pack/records", "POST /api/v1/agents/pack/run"],
      contracts: "EvidenceContract: PCK-* with observed_in_box, operator_verdict",
      schema: "{ record_id, unit_id, order_id, order_lines, observed_in_box, operator_verdict }",
    },
  },
  RTN: {
    key: "RTN",
    num: "4",
    name: "Returns Manager",
    role: "Customer Return Grading & LPN Triage",
    accent: "#7C3AED",
    bgAccent: "#F5F3FF",
    borderAccent: "#DDD6FE",
    icon: RotateCcw,
    href: "/agents/returns",
    tables: ["rtn_records", "rtn_checks"],
    inputs: ["Customer Return LPN", "Original Ordered ASIN / SKU", "Return Inspection Photos"],
    outputs: ["7-Level Condition Grade", "Missing Parts Assessment", "Restock vs Dispose Disposition"],
    evidenceType: "Return Condition Proof (CONDITION / PARTS / DISPOSITION)",
    downstream: ["RCY"],
    directConnections: [
      { target: "RCY", type: "Forensic Evidence", label: "Reverse custody proof to dispute unreturned item debits", data: "rtn_records condition & parts list" },
    ],
    upstream: [],
    level1: "Inspects customer returns, identifies missing parts or damage, and recommends restock or liquidation.",
    level2: {
      endpoints: ["GET /api/v1/agents/returns/records", "POST /api/v1/agents/returns/run", "PATCH /api/v1/agents/returns/{id}/override"],
      contracts: "EvidenceContract: RTN-* with parts_missing, observed_state, operator_disposition",
      schema: "{ record_id, unit_id, order_id, parts_missing, observed_state, operator_disposition }",
    },
  },
  RCY: {
    key: "RCY",
    num: "5",
    name: "Recovery Manager",
    role: "Multi-Agent Dispute Auditor & Claim Compiler",
    accent: "#0F766E",
    bgAccent: "#F0FDFA",
    borderAccent: "#CCFBF1",
    icon: ShieldAlert,
    href: "/agents/recovery",
    tables: ["charges", "rcy_charges", "claims", "rcy_evidence_records"],
    inputs: ["Amazon / 3PL Deduction Report", "Station 1–4 Forensic Evidence", "Custody Timestamps"],
    outputs: ["Three-State Verdict (CONTRADICTED / SUPPORTED / SILENT)", "Frozen Claim Packet", "Dispute Letter"],
    evidenceType: "Comprehensive Commercial Audit Dossier (SHA-256 Verified)",
    downstream: [],
    directConnections: [],
    upstream: [
      { source: "RCV", type: "Inbound Proof", label: "Receiving damage & quantity records", data: "rcv_inspections" },
      { source: "PRP", type: "Prep Proof", label: "Packaging compliance certificates", data: "prp_inspections" },
      { source: "PCK", type: "Pack Proof", label: "Box contents & outbound weight logs", data: "pck_records" },
      { source: "RTN", type: "Return Proof", label: "Customer reverse inspection logs", data: "rtn_records" },
    ],
    level1: "Correlates evidence from Stations 1 through 4 to refute wrongful marketplace chargebacks.",
    level2: {
      endpoints: ["GET /api/v1/charges", "GET /api/v1/claims", "POST /api/v1/claims", "PATCH /api/v1/agents/recovery/charges/{id}/override"],
      contracts: "ClaimPackage & AuditPacket with evidence_chain and legal_defense_statement",
      schema: "{ claim_id, charge_id, amount, status, audit_packet: { charge_metadata, investigation, evidence_chain } }",
    },
  },
};

export default function AgentPlayground({
  activeAgentKey = "RCY", // Default focuses on current page's agent
  title = "Agent Interaction Playground",
  subtitle = "Live multi-agent topology, real evidence dependencies & data contracts",
  liveData = null, // Optional real records passed from parent page
  defaultCollapsed = false, // When on busy agent pages, can be collapsed by default
}) {
  const currentAgent = AGENT_CONFIGS[activeAgentKey] || AGENT_CONFIGS.RCY;
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [selectedNode, setSelectedNode] = useState(activeAgentKey);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [activeTab, setActiveTab] = useState("topology"); // "topology", "dataflow", "technical"
  const [techLevel, setTechLevel] = useState("L1"); // "L1" (Simple English) or "L2" (Technical Specs)
  const [inspectingAgent, setInspectingAgent] = useState(currentAgent);

  useEffect(() => {
    setSelectedNode(activeAgentKey);
    setInspectingAgent(AGENT_CONFIGS[activeAgentKey] || AGENT_CONFIGS.RCY);
    setSelectedConnection(null);
  }, [activeAgentKey]);

  const handleSelectNode = (key) => {
    setSelectedNode(key);
    setSelectedConnection(null);
    setInspectingAgent(AGENT_CONFIGS[key] || currentAgent);
  };

  const handleSelectConnection = (sourceKey, targetKey) => {
    setSelectedNode(null);
    setSelectedConnection({
      source: AGENT_CONFIGS[sourceKey],
      target: AGENT_CONFIGS[targetKey],
    });
  };

  // Node positions for responsive interactive SVG canvas (1000 x 500)
  const NODE_POSITIONS = {
    RCV: { x: 120, y: 70 },
    PRP: { x: 120, y: 190 },
    PCK: { x: 120, y: 310 },
    RTN: { x: 120, y: 430 },
    RCY: { x: 800, y: 250 },
  };

  const NW = 210;
  const NH = 90;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Playground Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FBFBFA]">
        <div
          className="cursor-pointer select-none flex-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
              style={{
                backgroundColor: currentAgent.bgAccent,
                color: currentAgent.accent,
                border: `1px solid ${currentAgent.borderAccent}`,
              }}
            >
              Pod {currentAgent.num} • {currentAgent.key} Interactive Playground
            </span>
            <span className="text-xs text-[#64748B] hidden sm:inline">• Deterministic Evidence Flow</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-base font-bold text-[#0F172A]">{title}</h2>
            <span className="text-xs text-[#0F766E] font-medium hidden md:inline">
              ({isExpanded ? "Click header to collapse" : "Click to view full 5-agent map & contracts"})
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
        </div>

        {/* View & Detail Level Controls + Expand/Collapse Button */}
        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              {/* Level 1 / Level 2 Toggle */}
              <div className="flex items-center p-1 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold shadow-xs">
                <button
                  onClick={() => setTechLevel("L1")}
                  className={`px-3 py-1 rounded-lg transition ${
                    techLevel === "L1" ? "bg-[#0F766E] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                  title="Easy to understand executive overview"
                >
                  Plain English (L1)
                </button>
                <button
                  onClick={() => setTechLevel("L2")}
                  className={`px-3 py-1 rounded-lg transition ${
                    techLevel === "L2" ? "bg-[#0F766E] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                  title="Underlying schemas, API routes and database tables"
                >
                  Technical Specs (L2)
                </button>
              </div>

              {/* Sub-Tabs: Topology vs Data Flow */}
              <div className="flex items-center p-1 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold shadow-xs">
                {[
                  { id: "topology", label: "Topology" },
                  { id: "dataflow", label: "Data Flow" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeTab === tab.id
                        ? "bg-[#0F766E] text-white shadow-xs font-bold"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9F6]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Toggle Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8F9F6] rounded-xl shadow-xs transition"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Hide Playground</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Explore Topology</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Dual-Column Canvas: Visual Map (Left) + Inspector Drawer (Right) */}
      {isExpanded && (
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0] animate-fade-in">
        {/* Left Column: Interactive Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 p-5 bg-[#FBFBFA]/50 flex flex-col justify-between space-y-4">
          {/* Focus Agent Banner */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Inspecting Node:</span>
              <strong className="text-[#0F172A] font-semibold">{inspectingAgent.name}</strong>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: inspectingAgent.bgAccent,
                  color: inspectingAgent.accent,
                }}
              >
                {inspectingAgent.key}
              </span>
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Neon PostgreSQL Connected</span>
            </div>
          </div>

          {/* Dynamic View: Topology Network Map vs Sequential Evidence Data Flow */}
          {activeTab === "dataflow" ? (
            /* DATA FLOW VIEW: Sequential Multi-Agent Evidence Pipeline */
            <div className="border border-[#E2E8F0] rounded-xl bg-white p-4 sm:p-5 shadow-xs space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E8E3]">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0F766E]" />
                    <span>Sequential Multi-Agent Evidence Pipeline</span>
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Deterministic custody data contracts and physical ground truth flowing across all 5 operational stations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-teal-50 text-[#0F766E] border border-teal-200 font-semibold">
                    5 Pipeline Checkpoints
                  </span>
                </div>
              </div>

              {/* Step Cards with Connected Handoff Data */}
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    key: "RCV",
                    name: "Inbound Receiving Dock",
                    badge: "STATION 1",
                    inputDesc: "Carrier BOL, ERP Purchase Order, Pallet Photos",
                    processDesc: "Gemini Vision Carton Damage & Unit Count Verification",
                    outputContract: "rcv_inspections",
                    outputDesc: "Carton Integrity Verdict, Received Qty Discrepancy",
                    forwardsTo: "Station 2 (Prep) & Station 5 (Recovery)",
                    payloadSnippet: "{ unit_id, po_number, sku, carton_damage, qty_received, overall_verdict }",
                  },
                  {
                    step: 2,
                    key: "PRP",
                    name: "FBA Prep & Packaging Station",
                    badge: "STATION 2",
                    inputDesc: "Inbound Unit from Dock & Work Order Procedures",
                    processDesc: "Polybag Heat-Seal, Suffocation Warning OCR, Barcode Curvature Check",
                    outputContract: "prp_inspections",
                    outputDesc: "FBA Packaging Compliance Certificate, Defect Fee Protection",
                    forwardsTo: "Station 3 (Pack) & Station 5 (Recovery)",
                    payloadSnippet: "{ unit_id, work_order_id, polybag_sealed, barcode_curved, defect_fee_amount }",
                  },
                  {
                    step: 3,
                    key: "PCK",
                    name: "Outbound Packing Terminal",
                    badge: "STATION 3",
                    inputDesc: "Outbound Order Manifest & Overhead Camera Capture",
                    processDesc: "9-Point Reconciliation, Item Count Match, Tamper-Tape Seal Certification",
                    outputContract: "pck_records",
                    outputDesc: "Outbound Pack Audit Proof, Zero-Shortage Verification",
                    forwardsTo: "Station 5 (Recovery)",
                    payloadSnippet: "{ unit_id, order_id, items_expected, items_count, decision: 'SEAL' }",
                  },
                  {
                    step: 4,
                    key: "RTN",
                    name: "Customer Return & LPN Triage",
                    badge: "STATION 4",
                    inputDesc: "Customer RMA, Return LPN, Return Photos",
                    processDesc: "7-Grade Condition Triage & Missing Parts Inspection",
                    outputContract: "rtn_records",
                    outputDesc: "Grading Certificate, 4-Tier Disposition Recommendation",
                    forwardsTo: "Station 5 (Recovery)",
                    payloadSnippet: "{ unit_id, order_id, condition, parts_missing, operator_disposition }",
                  },
                  {
                    step: 5,
                    key: "RCY",
                    name: "Commercial Dispute Recovery Desk",
                    badge: "STATION 5",
                    inputDesc: "Marketplace Deduction Reports + Physical Proof from Stations 1–4",
                    processDesc: "Autonomous Cross-Agent Correlation & Contradiction Engine",
                    outputContract: "rcy_claims",
                    outputDesc: "Immutable Claim Dossier with SHA-256 Multi-Agent Evidence Chain",
                    forwardsTo: "Marketplace Commercial Reimbursement Filing",
                    payloadSnippet: "{ claim_id, charge_id, amount, assessment: 'CONTRADICTED', audit_packet }",
                  },
                ].map((item, idx, arr) => {
                  const conf = AGENT_CONFIGS[item.key];
                  const isSelected = selectedNode === item.key;
                  const isFocus = item.key === activeAgentKey;

                  return (
                    <React.Fragment key={item.key}>
                      <div
                        onClick={() => handleSelectNode(item.key)}
                        className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-teal-50/70 border-[#0F766E] shadow-xs ring-1 ring-[#0F766E]"
                            : "bg-[#FBFBFA] border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E8E8E3]">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
                              style={{ backgroundColor: conf.bgAccent, color: conf.accent }}
                            >
                              {item.step}
                            </span>
                            <span className="text-xs font-bold text-[#0F172A]">{item.name}</span>
                            <span
                              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: conf.bgAccent,
                                color: conf.accent,
                                border: `1px solid ${conf.borderAccent}`,
                              }}
                            >
                              {item.key}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            {isFocus && (
                              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-[#0F766E] font-bold text-[10px]">
                                Current Console
                              </span>
                            )}
                            <span className="text-[#64748B] font-mono">
                              DB: <strong className="text-[#0F172A]">{item.outputContract}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                          <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                            <span className="font-semibold text-[#64748B] block mb-0.5 uppercase text-[9px] tracking-wider">
                              Inbound Inputs
                            </span>
                            <span className="text-[#334155]">{item.inputDesc}</span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                            <span className="font-semibold text-[#64748B] block mb-0.5 uppercase text-[9px] tracking-wider">
                              Inspection & Logic
                            </span>
                            <span className="text-[#334155]">{item.processDesc}</span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                            <span className="font-semibold text-[#0F766E] block mb-0.5 uppercase text-[9px] tracking-wider">
                              Emitted Ground Truth
                            </span>
                            <span className="text-[#0F172A] font-medium">{item.outputDesc}</span>
                          </div>
                        </div>

                        {/* Contract Payload preview snippet */}
                        <div className="mt-2.5 pt-2 border-t border-[#E8E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-[#64748B]">
                          <div className="font-mono truncate">
                            <span className="text-[#0F766E] font-semibold">Contract Payload:</span> {item.payloadSnippet}
                          </div>
                          <span className="text-[#64748B] shrink-0">
                            → Forwards to: <strong className="text-[#0F172A]">{item.forwardsTo}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Animated Connector Arrow between steps */}
                      {idx < arr.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#475569] text-[10px] font-mono font-medium shadow-2xs">
                            <ArrowRight className="w-3 h-3 text-[#0F766E] rotate-90 sm:rotate-0" />
                            <span>Custody Handoff & Evidence Transfer</span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TOPOLOGY VIEW: Interactive SVG Network Map */
            <>
              {/* SVG Canvas for Desktop / Large Screens */}
              <div className="hidden md:block relative border border-[#E2E8F0] rounded-xl bg-white p-3 shadow-xs overflow-hidden animate-fade-in">
                <svg
                  viewBox="0 0 980 500"
                  className="w-full h-auto select-none"
                  role="img"
                  aria-label="Pod 7 Agent Interaction Canvas"
                >
                  <defs>
                    <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0F766E" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                    </linearGradient>
                    <marker
                      id="arrowTeal"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L6,3 z" fill="#0F766E" />
                    </marker>
                    <marker
                      id="arrowSlate"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L6,3 z" fill="#CBD5E1" />
                    </marker>
                  </defs>

                  {/* Draw Edges between agents: Station 1-4 &rarr; Station 5 (Recovery) and Station 1 &rarr; 2 &rarr; 3 */}
                  {[
                    { from: "RCV", to: "PRP", label: "Custody Handoff", yOffset: 0 },
                    { from: "PRP", to: "PCK", label: "Prepped Goods", yOffset: 0 },
                    { from: "RCV", to: "RCY", label: "Inbound Damage Proof", yOffset: -12 },
                    { from: "PRP", to: "RCY", label: "Polybag / Barcode Proof", yOffset: -4 },
                    { from: "PCK", to: "RCY", label: "Box Pack Verification", yOffset: 4 },
                    { from: "RTN", to: "RCY", label: "Return Condition Proof", yOffset: 12 },
                  ].map((conn, idx) => {
                    const sp = NODE_POSITIONS[conn.from];
                    const tp = NODE_POSITIONS[conn.to];
                    const sx = sp.x + NW;
                    const sy = sp.y + NH / 2;
                    const tx = conn.to === "RCY" ? tp.x : tp.x + NW / 2;
                    const ty = conn.to === "RCY" ? tp.y + NH / 2 : tp.y;

                    const isConnectedToFocus = conn.from === activeAgentKey || conn.to === activeAgentKey;
                    const isSelected =
                      selectedConnection?.source?.key === conn.from && selectedConnection?.target?.key === conn.to;

                    let strokeColor = isSelected ? "#0F766E" : isConnectedToFocus ? "#0F766E" : "#E2E8F0";
                    let strokeWidth = isSelected ? 3 : isConnectedToFocus ? 2 : 1.5;

                    // Bezier curve control points
                    const mx = (sx + tx) / 2;
                    const d =
                      conn.to === "RCY"
                        ? `M${sx} ${sy} C${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`
                        : `M${sp.x + NW / 2} ${sp.y + NH} L${tp.x + NW / 2} ${tp.y}`;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer group"
                        onClick={() => handleSelectConnection(conn.from, conn.to)}
                      >
                        {/* Hover hit area */}
                        <path d={d} fill="none" stroke="transparent" strokeWidth="18" />
                        {/* Visual Path */}
                        <path
                          d={d}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={isConnectedToFocus ? "none" : "5,5"}
                          markerEnd={isConnectedToFocus ? "url(#arrowTeal)" : "url(#arrowSlate)"}
                          className="transition-all duration-200"
                        />
                        {/* Edge Text Label */}
                        {conn.to === "RCY" && (
                          <text
                            x={mx - 20}
                            y={(sy + ty) / 2 + conn.yOffset}
                            fontSize="10"
                            fontWeight="600"
                            fill={isConnectedToFocus ? "#0F766E" : "#94A3B8"}
                            textAnchor="middle"
                            className="font-mono select-none"
                          >
                            {conn.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {Object.keys(NODE_POSITIONS).map((key) => {
                    const conf = AGENT_CONFIGS[key];
                    const pos = NODE_POSITIONS[key];
                    const isCurrent = key === activeAgentKey;
                    const isSelected = key === selectedNode;

                    return (
                      <g
                        key={key}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer transition-transform duration-200"
                        onClick={() => handleSelectNode(key)}
                      >
                        {/* Card Body */}
                        <rect
                          width={NW}
                          height={NH}
                          rx="12"
                          fill={isCurrent ? "#FFFFFF" : isSelected ? "#F8F9F6" : "#FFFFFF"}
                          stroke={isSelected ? "#0F766E" : isCurrent ? conf.accent : "#E2E8F0"}
                          strokeWidth={isSelected || isCurrent ? 2.5 : 1}
                          filter={isCurrent ? "drop-shadow(0 2px 8px rgba(15, 118, 110, 0.12))" : "none"}
                        />

                        {/* Left Accent Stripe */}
                        <rect
                          x="0"
                          y="0"
                          width="5"
                          height={NH}
                          rx="2.5"
                          fill={conf.accent}
                        />

                        {/* Agent Badge & Name */}
                        <circle cx="28" cy="28" r="14" fill={conf.bgAccent} />
                        <text
                          x="28"
                          y="32"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill={conf.accent}
                          className="font-mono"
                        >
                          {conf.key}
                        </text>

                        <text x="50" y="24" fontSize="12" fontWeight="bold" fill="#0F172A">
                          {conf.name}
                        </text>
                        <text x="50" y="38" fontSize="10" fill="#64748B" className="truncate">
                          Pod #{conf.num} • {conf.role.slice(0, 24)}...
                        </text>

                        {/* Status Pill */}
                        <rect x="14" y="54" width="70" height="18" rx="4" fill="#F0FDFA" stroke="#CCFBF1" />
                        <circle cx="22" cy="63" r="3" fill="#0F766E" />
                        <text x="30" y="66" fontSize="9" fontWeight="bold" fill="#0F766E" className="font-mono">
                          ACTIVE
                        </text>

                        {/* Key Metric / Evidence Link */}
                        <text x="92" y="66" fontSize="10" fill="#64748B" className="font-mono">
                          {conf.tables[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Stacked Mobile Flow View (Transforms gracefully on narrow viewports) */}
              <div className="block md:hidden space-y-3">
                {Object.keys(AGENT_CONFIGS).map((k) => {
                  const conf = AGENT_CONFIGS[k];
                  const isSelected = selectedNode === k;
                  return (
                    <div
                      key={k}
                      onClick={() => handleSelectNode(k)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-50/50 border-[#0F766E] shadow-xs"
                          : "bg-white border-[#E2E8F0] hover:bg-[#F8F9F6]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
                          style={{ backgroundColor: conf.bgAccent, color: conf.accent }}
                        >
                          {conf.key}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0F172A]">{conf.name}</div>
                          <div className="text-[11px] text-[#64748B]">{conf.role}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom Execution Bar */}
          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A]">Cross-Agent Verification Path:</span>
              <span className="font-mono text-[#0F766E] font-bold">RCV → PRP → PCK → RTN → RCY</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/orchestrator"
                className="inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:underline"
              >
                <span>Open Unit Lifecycle Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-white space-y-5">
          {/* Drawer Top Header */}
          <div className="border-b border-[#E2E8F0] pb-3 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                {selectedConnection ? "Connection Inspector" : "Agent Node Inspector"}
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                {selectedConnection
                  ? `${selectedConnection.source.key} → ${selectedConnection.target.key}`
                  : inspectingAgent.name}
              </h3>
            </div>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: inspectingAgent.bgAccent,
                color: inspectingAgent.accent,
                border: `1px solid ${inspectingAgent.borderAccent}`,
              }}
            >
              {inspectingAgent.key}
            </span>
          </div>

          {/* Connection View (If a wire was clicked) */}
          {selectedConnection ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F9F6] border border-[#E2E8F0] space-y-1.5">
                <div className="text-[#64748B] font-semibold">Evidence Dependency Relationship:</div>
                <div className="text-[#0F172A] font-medium leading-relaxed">
                  <strong>{selectedConnection.source.name}</strong> autonomously provides verified physical ground truth
                  to <strong>{selectedConnection.target.name}</strong> prior to commercial charge dispute.
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Data Transferred / Contract
                </div>
                <ul className="space-y-1 bg-[#FBFBFA] p-3 rounded-xl border border-[#E2E8F0] font-mono text-[11px]">
                  <li>• Source: {selectedConnection.source.tables.join(", ")}</li>
                  <li>• Proof Type: {selectedConnection.source.evidenceType}</li>
                  <li>• Deterministic Validation: Multi-Agent Evidence Provenance</li>
                </ul>
              </div>

              <button
                onClick={() => setSelectedConnection(null)}
                className="w-full py-1.5 text-xs text-[#0F766E] border border-[#0F766E] hover:bg-teal-50 rounded-lg font-semibold transition"
              >
                Back to Agent Overview
              </button>
            </div>
          ) : techLevel === "L1" ? (
            /* LEVEL 1: PLAIN ENGLISH OVERVIEW */
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Purpose & Role in Logistics
                </div>
                <p className="text-[#334155] leading-relaxed bg-[#F8F9F6] p-3 rounded-xl border border-[#E2E8F0]">
                  {inspectingAgent.level1}
                </p>
              </div>

              {/* What It Receives (Inputs) */}
              <div>
                <div className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Inputs Received
                </div>
                <div className="space-y-1.5">
                  {inspectingAgent.inputs.map((inp, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#FBFBFA] border border-[#E2E8F0] text-[#0F172A] flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                      <span>{inp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What It Produces (Outputs) */}
              <div>
                <div className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Evidence Generated
                </div>
                <div className="space-y-1.5">
                  {inspectingAgent.outputs.map((out, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#FBFBFA] border border-[#E2E8F0] text-[#0F172A] flex items-center gap-2"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{out}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downstream Consumers */}
              <div>
                <div className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Downstream Evidence Consumers
                </div>
                <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] text-[#0F766E] leading-relaxed">
                  {inspectingAgent.downstream.length > 0 ? (
                    <>
                      Feeds physical proof to:{" "}
                      <strong>
                        {inspectingAgent.downstream
                          .map((d) => AGENT_CONFIGS[d]?.name)
                          .join(", ")}
                      </strong>
                    </>
                  ) : (
                    <>Terminal recovery consumer; aggregates evidence to adjudicate penalty deductions.</>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* LEVEL 2: TECHNICAL SPECIFICATIONS */
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  API Endpoints
                </div>
                <div className="p-2.5 bg-[#0F172A] text-emerald-400 rounded-xl space-y-1 text-[11px] overflow-x-auto">
                  {inspectingAgent.level2.endpoints.map((ep, i) => (
                    <div key={i}>{ep}</div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Database Tables (Neon PostgreSQL)
                </div>
                <div className="p-2.5 bg-[#F8F9F6] border border-[#E2E8F0] rounded-xl text-[#0F172A] text-[11px]">
                  {inspectingAgent.tables.map((tbl, i) => (
                    <div key={i} className="flex justify-between py-0.5">
                      <span className="font-bold text-[#0F766E]">{tbl}</span>
                      <span className="text-[#64748B]">schema: public</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider mb-1">
                  Evidence Contract & Payload
                </div>
                <pre className="p-2.5 bg-[#0F172A] text-slate-300 rounded-xl text-[10px] overflow-x-auto">
                  {inspectingAgent.level2.schema}
                </pre>
              </div>

              <div className="p-2.5 bg-[#FBFBFA] border border-[#E2E8F0] rounded-xl text-[11px] text-[#475569]">
                <strong>Contract:</strong> {inspectingAgent.level2.contracts}
              </div>
            </div>
          )}

          {/* Action Link to the Inspected Agent */}
          <div className="pt-3 border-t border-[#E2E8F0]">
            <Link
              href={inspectingAgent.href}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <span>Open {inspectingAgent.name} Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
