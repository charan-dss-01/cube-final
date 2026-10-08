"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../lib/api";
import {
  UploadCloud,
  FileSpreadsheet,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  FolderOpen,
  ArrowRight,
  ShieldAlert,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";

export default function DataSourcesPage() {
  const { currentCompany } = useWorkspace();
  const [activeTab, setActiveTab] = useState("upload"); // "upload", "charge_manual", "evidence_manual"
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  // Manual Charge form state
  const [chargeForm, setChargeForm] = useState({
    charge_id: "",
    unit_id: "",
    shipment_id: "",
    order_id: "",
    sku: "",
    reason: "inbound_defect_fee",
    amount: "",
    charge_date: new Date().toISOString().split("T")[0],
  });

  // Manual Evidence form state
  const [evidenceForm, setEvidenceForm] = useState({
    evidence_id: "",
    source_type: "prep",
    unit_id: "",
    shipment_id: "",
    order_id: "",
    sku: "",
    event_type: "fba_prep_compliance",
    finding: "PASS",
    description: "",
    timestamp: new Date().toISOString(),
  });

  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const data = await api.getUploadedFiles(currentCompany);
      setUploadedFiles(data || []);
    } catch (err) {
      console.error("Failed to load uploaded files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentCompany]);

  // File select & preview
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setImportSuccess(null);
    setPreviewData(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", currentCompany);

    try {
      setUploading(true);
      const preview = await api.previewUpload(formData);
      setPreviewData(preview);
    } catch (err) {
      alert(`Preview failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("company_id", currentCompany);

    try {
      setImporting(true);
      const res = await api.importFile(formData);
      setImportSuccess(res);
      setSelectedFile(null);
      setPreviewData(null);
      loadFiles();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Submit Manual Charge
  const handleSubmitCharge = async (e) => {
    e.preventDefault();
    try {
      await api.createManualCharge({
        ...chargeForm,
        amount: parseFloat(chargeForm.amount) || 0,
        company_id: currentCompany,
      });
      alert(`Charge ${chargeForm.charge_id} created successfully!`);
      setChargeForm({
        charge_id: "",
        unit_id: "",
        shipment_id: "",
        order_id: "",
        sku: "",
        reason: "inbound_defect_fee",
        amount: "",
        charge_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      alert(`Failed to create charge: ${err.message}`);
    }
  };

  // Submit Manual Evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    try {
      await api.createManualEvidence({
        ...evidenceForm,
        company_id: currentCompany,
      });
      alert(`Evidence ${evidenceForm.evidence_id} created successfully!`);
      setEvidenceForm({
        evidence_id: "",
        source_type: "prep",
        unit_id: "",
        shipment_id: "",
        order_id: "",
        sku: "",
        event_type: "fba_prep_compliance",
        finding: "PASS",
        description: "",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      alert(`Failed to create evidence: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] min-h-screen">
      <Navbar onRefresh={loadFiles} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100/70 text-[#0F766E] border border-teal-200">
                Data Integration Engine
              </span>
              <span className="text-xs text-[#64748B]">• Multi-Format Ledger Ingestion</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] mt-1.5">
              Data Ingestion & Source Control
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Ingest fee reports, receiving records, prep inspection logs, or record single transactions with strict tenant isolation.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-[#64748B] font-mono bg-white border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
            <span>Tenant: {currentCompany}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center p-1 bg-white border border-[#E2E8F0] rounded-xl max-w-fit space-x-1 shadow-xs">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "upload"
                ? "bg-[#0F766E] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9F6]"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document (CSV, XLSX, PDF, JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab("charge_manual")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "charge_manual"
                ? "bg-[#0F766E] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9F6]"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Manual Charge</span>
          </button>
          <button
            onClick={() => setActiveTab("evidence_manual")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "evidence_manual"
                ? "bg-[#0F766E] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9F6]"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Manual Evidence</span>
          </button>
        </div>

        {/* Tab 1: File Ingestion Pipeline */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0F766E] rounded-2xl p-10 text-center bg-white transition group shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0F766E] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-200">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">Upload Channel or Operational Report</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-lg mx-auto leading-relaxed">
                Universal parser automatically classifies fee reports, receiving custody logs, prep inspection reports, pack sheets, and customer returns (.csv, .xlsx, .pdf, .json).
              </p>

              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] font-mono text-[#64748B]">
                <span className="px-2 py-0.5 rounded-md bg-[#F8F9F6] border border-[#E2E8F0]">CSV</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F8F9F6] border border-[#E2E8F0]">XLSX</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F8F9F6] border border-[#E2E8F0]">PDF</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F8F9F6] border border-[#E2E8F0]">JSON</span>
              </div>

              <div className="mt-6 flex justify-center">
                <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-xs transition">
                  <FolderOpen className="w-4 h-4" />
                  <span>Browse Local File</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls,.pdf,.json"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Ingestion History Table */}
            <div className="rounded-xl bg-white border border-[#E2E8F0] overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#0F766E]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    Tenant File Ingestion Archive
                  </h3>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono">
                  {uploadedFiles.length} files parsed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9F6] text-[#64748B] uppercase tracking-wider font-semibold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-3 px-4">Filename</th>
                      <th className="py-3 px-4">Auto-Detected Kind</th>
                      <th className="py-3 px-4">Records Ingested</th>
                      <th className="py-3 px-4">Uploaded Date</th>
                      <th className="py-3 px-4">Parse Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                    {loadingFiles ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#64748B]">
                          Loading tenant ingest history...
                        </td>
                      </tr>
                    ) : uploadedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#64748B]">
                          No files uploaded for this tenant workspace yet.
                        </td>
                      </tr>
                    ) : (
                      uploadedFiles.map((f) => (
                        <tr key={f.id} className="hover:bg-[#F8F9F6] transition">
                          <td className="py-3 px-4 font-mono font-medium text-[#0F172A] flex items-center space-x-2">
                            <FileSpreadsheet className="w-4 h-4 text-[#0F766E] shrink-0" />
                            <span className="truncate max-w-xs">{f.filename}</span>
                          </td>
                          <td className="py-3 px-4 font-mono uppercase text-[11px] text-[#64748B]">
                            {f.file_type || "Generic"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                            {f.row_count || 0}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "Recent"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PROCESSED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Charge Creation */}
        {activeTab === "charge_manual" && (
          <form onSubmit={handleSubmitCharge} className="bg-white border border-[#E2E8F0] rounded-2xl p-7 space-y-5 max-w-2xl shadow-xs">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Add Manual Channel Deduction</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Post an Amazon / 3PL penalty charge to investigate with recovery agents.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Charge ID <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. CH-2026-991"
                  value={chargeForm.charge_id}
                  onChange={(e) => setChargeForm({ ...chargeForm, charge_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] font-mono focus:border-[#0F766E] outline-none"
                />
              </div>
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Unit ID</label>
                <input
                  type="text"
                  placeholder="e.g. UNIT-0003"
                  value={chargeForm.unit_id}
                  onChange={(e) => setChargeForm({ ...chargeForm, unit_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] font-mono focus:border-[#0F766E] outline-none"
                />
              </div>
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Amount (USD) <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="38.00"
                  value={chargeForm.amount}
                  onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] font-mono focus:border-[#0F766E] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[#475569] font-medium block mb-1.5">Deduction Reason <span className="text-rose-500">*</span></label>
                <select
                  value={chargeForm.reason}
                  onChange={(e) => setChargeForm({ ...chargeForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] focus:border-[#0F766E] outline-none"
                >
                  <option value="inbound_defect_fee">Inbound Defect Fee</option>
                  <option value="lost_inbound">Lost Inbound Inventory</option>
                  <option value="refund_issued_item_not_returned">Refund Issued Item Not Returned</option>
                  <option value="damaged_in_warehouse">Damaged In Warehouse</option>
                  <option value="fulfilment_fee_weight_tier">Fulfilment Fee Weight Tier</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg transition shadow-xs"
              >
                Save Charge
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Manual Evidence Creation */}
        {activeTab === "evidence_manual" && (
          <form onSubmit={handleSubmitEvidence} className="bg-white border border-[#E2E8F0] rounded-2xl p-7 space-y-5 max-w-2xl shadow-xs">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Add Manual Evidence Record</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Record warehouse floor verification proof to refute channel fee claims.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Evidence ID <span className="text-rose-500">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. PRP-9912"
                  value={evidenceForm.evidence_id}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, evidence_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] font-mono focus:border-[#0F766E] outline-none"
                />
              </div>
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Source Stage <span className="text-rose-500">*</span></label>
                <select
                  value={evidenceForm.source_type}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, source_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] focus:border-[#0F766E] outline-none"
                >
                  <option value="receiving">Receiving Line</option>
                  <option value="prep">Prep Station</option>
                  <option value="pack">Pack Bench</option>
                  <option value="returns">Returns Processing</option>
                </select>
              </div>
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Unit ID</label>
                <input
                  type="text"
                  placeholder="e.g. UNIT-0014"
                  value={evidenceForm.unit_id}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, unit_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] font-mono focus:border-[#0F766E] outline-none"
                />
              </div>
              <div>
                <label className="text-[#475569] font-medium block mb-1.5">Finding Verdict <span className="text-rose-500">*</span></label>
                <select
                  value={evidenceForm.finding}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, finding: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] focus:border-[#0F766E] outline-none"
                >
                  <option value="PASS">PASS (Compliant)</option>
                  <option value="FAIL">FAIL (Defect Confirmed)</option>
                  <option value="UNCERTAIN">UNCERTAIN (Ambiguous)</option>
                  <option value="RESTOCKED">RESTOCKED</option>
                  <option value="DISPOSED">DISPOSED</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[#475569] font-medium block mb-1.5">Description / Operational Findings <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Polybag present & sealed: yes. Barcode covered: yes. Item measured at 1.2 lbs."
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#FBFBFA] border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F766E] outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg transition shadow-xs"
              >
                Save Evidence Record
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
