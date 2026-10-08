"use client";
import React from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import {
  Boxes,
  Truck,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  Cpu,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function AgentDirectoryPage() {
  const agentDetails = [
    {
      id: "receiving",
      badge: "POD-01",
      code: "RCV",
      name: "Receiving Manager",
      subtitle: "Inbound Verification & Physical Freight Intake",
      desc: "Serves as the gateway for all warehouse inventory. Matches arriving shipment cartons against Purchase Order manifests, performs computer vision audits for carton crushing and punctures, and verifies physical unit counts before custody transfer.",
      icon: Truck,
      href: "/agents/receiving",
      model: "Gemini 3.5 Flash VLM",
      dbTables: ["rcv_units", "rcv_inspections", "rcv_checks"],
      upstream: "Carrier Bill of Lading (BOL), ERP PO Manifest",
      downstream: "Prep Compliance (PRP), Recovery Forensic Ledger (RCY)",
      checks: [
        "PO Identity Match",
        "Carton Crushing & Physical Damage",
        "Unit Tear / Puncture Detection",
        "Total Carton Count Verification",
        "Units Per Carton Exact Count",
        "Quality Defect Flags (wrong color/spec)",
      ],
      rulesCount: "10 Distinct Deterministic Rules",
      status: "Operational",
    },
    {
      id: "prep",
      badge: "POD-02",
      code: "PRP",
      name: "Prep Compliance Manager",
      subtitle: "Visual FBA Packaging & Geometric Compliance",
      desc: "Specialized multi-agent visual compliance inspector for e-commerce prep. Audits polybag presence, verifies airtight top heat-seals, executes OCR extraction of required suffocation warnings, and detects barcode geometry defects to eliminate marketplace fines.",
      icon: Sparkles,
      href: "/agents/prep",
      model: "Gemini 3.5 Flash Vision",
      dbTables: ["prp_products", "prp_rules", "prp_inspections", "prp_checks", "prp_events"],
      upstream: "Inbound Receiving Custody (RCV)",
      downstream: "Outbound Pack Station (PCK), Returns Cross-Check (RTN)",
      checks: [
        "Protective Polybag Detection & Enclosure",
        "Hermetic Top Heat-Seal Integrity",
        "Suffocation Warning Text OCR & Legibility",
        "FNSKU Barcode Flat Surface Containment",
        "Curved Edge / Corner Intersection Check",
        "Original Manufacturer Barcode Omission",
      ],
      rulesCount: "20 Active Catalog Rules",
      status: "Operational",
    },
    {
      id: "pack",
      badge: "POD-03",
      code: "PCK",
      name: "Pack Manager",
      subtitle: "Outbound Station Inspection & Manifest Reconciliation",
      desc: "High-throughput packing station audit engine. Captures multi-perspective photographs of open shipping cartons, extracts visible product instances without prompting expected quantities, and executes a deterministic 9-point reconciliation policy.",
      icon: PackageCheck,
      href: "/agents/pack",
      model: "Gemini 3.5 Flash Hosted",
      dbTables: ["pck_records", "pck_attempts", "pck_jobs", "pck_events"],
      upstream: "Warehouse Prep Compliance (PRP), WMS Pick Lists",
      downstream: "Customer Returns Intake (RTN), Recovery Claims (RCY)",
      checks: [
        "Input Order Snapshot Cryptographic Integrity",
        "View Coverage Sufficiency Protocol",
        "Catalogue Identity Single-Candidate Match",
        "Per-SKU Ordered Quantity Lower Bound",
        "Zero Unrequested Item Presence",
        "All Items Present Assertion",
        "Quantities Correct Reconciliation",
        "Carton Seal vs Stop-and-Fix Decision",
      ],
      rulesCount: "9-Check Deterministic Matrix",
      status: "Operational",
    },
    {
      id: "returns",
      badge: "POD-04",
      code: "RTN",
      name: "Returns Manager",
      subtitle: "Customer Return Inspection & AI Disposition",
      desc: "Automated customer returns disposition engine. Inspects returned package photos to assess physical wear, missing components, and identity accuracy. Automatically cross-references upstream Receiving, Prep, and Pack evidence to detect customer fraud.",
      icon: RotateCcw,
      href: "/agents/returns",
      model: "Gemini 3.5 Flash Vision",
      dbTables: ["rtn_records", "rtn_overrides"],
      upstream: "Receiving (RCV), Prep (PRP), Pack (PCK)",
      downstream: "Recovery Forensic Claims (RCY), Inventory Restock",
      checks: [
        "Return SKU Identity Verification",
        "Multi-Part Completeness Audit",
        "7-Level Condition Grading Scale",
        "Upstream Freight Proof Cross-Matching",
        "Automated 4-Tier Disposition Engine",
        "Fraudulent Return Detection",
      ],
      rulesCount: "7 Condition Grades, 4 Dispositions",
      status: "Operational",
    },
    {
      id: "recovery",
      badge: "POD-05",
      code: "RCY",
      name: "Recovery Manager",
      subtitle: "Financial Audit & Cross-Agent Dispute Claims",
      desc: "Forensic financial recovery agent defending brands against unjustified marketplace chargebacks and Amazon inbound defect fees. Correlates physical operational proofs from all 4 upstream pods to generate cryptographic dispute claim packets.",
      icon: ShieldAlert,
      href: "/agents/recovery",
      model: "Gemini Forensic Reasoner",
      dbTables: ["rcy_charges", "rcy_evidence_records", "rcy_investigations", "rcy_claims"],
      upstream: "Operational Proofs from RCV, PRP, PCK, and RTN",
      downstream: "Amazon Seller Central / Retail Dispute Settlement",
      checks: [
        "Conservative Evidence Threshold (Zero-Invention)",
        "Strict Non-Negotiable Claim Caps (Claim <= Charge)",
        "Duplicate Charge Detection (Unit, Shipment, Order)",
        "Already-Reimbursed Detection",
        "Unit Decrement Ledger Double-Claim Guard",
        "LLM Forensic Dispute Package Generation",
      ],
      rulesCount: "13 Formal Test Audit Rules",
      status: "Operational",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FBFBFA]">
      <Navbar
        title="Warehouse Agent Directory"
        subtitle="Explore and launch individual AI agents across the unified 5-pod logistics pipeline"
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Hub Introduction Header */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#0F766E] uppercase tracking-wider mb-1">
                <span>Autonomous Multi-Agent Architecture</span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
                5 Specialized Operational Pods
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
                Each agent operates with its original proprietary decision engine while communicating seamlessly through our centralized Neon PostgreSQL database. Select any agent below to launch its dedicated operational terminal.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Link
                href="/orchestrator"
                className="inline-flex items-center space-x-2 bg-[#F8F9F6] hover:bg-[#EFEFEA] text-[#0F172A] border border-[#E2E8F0] text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
              >
                <GitBranch className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>View Dependency Graph</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 5 Agent Cards */}
        <div className="space-y-6">
          {agentDetails.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-card hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Column: Core Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center text-[#0F766E] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F8F9F6] border border-[#E2E8F0] text-[#64748B]">
                            {agent.badge}
                          </span>
                          <h3 className="font-bold text-base text-[#0F172A]">
                            {agent.name}
                          </h3>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#0F766E] font-medium mt-0.5">
                          {agent.subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {agent.desc}
                    </p>

                    {/* Checks Grid */}
                    <div>
                      <div className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Core Checks & Verifications:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {agent.checks.map((chk, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-center space-x-2 text-xs text-[#334155] bg-[#FBFBFA] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0]/70"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                            <span className="truncate">{chk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Metadata & Launch Button */}
                  <div className="w-full lg:w-72 bg-[#FBFBFA] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between shrink-0 space-y-4">
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                          AI Model Architecture
                        </div>
                        <div className="font-semibold text-[#0F172A] mt-0.5 flex items-center space-x-1.5">
                          <Cpu className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>{agent.model}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                          Database Storage
                        </div>
                        <div className="text-[11px] font-mono text-[#475569] mt-0.5">
                          {agent.dbTables.join(", ")}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                          Upstream Feeds
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5 truncate" title={agent.upstream}>
                          {agent.upstream}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold">
                          Downstream Consumers
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5 truncate" title={agent.downstream}>
                          {agent.downstream}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={agent.href}
                      className="w-full inline-flex items-center justify-center space-x-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all"
                    >
                      <span>Launch {agent.code} Station</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
