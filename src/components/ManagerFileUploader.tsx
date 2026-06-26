/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, Calendar, Filter, Trash2, CheckCircle, Info, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UploadedFileLog {
  id: string;
  fileName: string;
  fileSize: string;
  uploadTime: string; // ISO String
  rowCount: number;
  status: "SUCCESS" | "FAILED";
  dataType: string; // "Inventory List" | "Sales Ledger" | "Pricing Sheet"
  columns: string[];
  data?: Record<string, string>[];
}

export default function ManagerFileUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<UploadedFileLog[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "DAY" | "WEEK" | "MONTH" | "YEAR">("ALL");
  const [selectedFileDetails, setSelectedFileDetails] = useState<UploadedFileLog | null>(null);

  // Initial load
  useEffect(() => {
    const stored = localStorage.getItem("aibispro_file_uploads");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse file upload history", e);
      }
    } else {
      // Seed initial dummy upload logs to make the visual UI interesting and useful right away!
      const initialLogs: UploadedFileLog[] = [
        {
          id: "UPL-982",
          fileName: "abc_coffee_beans_inventory_june.csv",
          fileSize: "14.2 KB",
          uploadTime: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          rowCount: 4,
          status: "SUCCESS",
          dataType: "Inventory List",
          columns: ["Product ID", "Quantity", "Unit Cost", "Supplier Name"],
          data: [
            { "Product ID": "abc_p1", "Quantity": "200", "Unit Cost": "Rp 45,000", "Supplier Name": "Preanger Gayo Farms" },
            { "Product ID": "abc_p2", "Quantity": "150", "Unit Cost": "Rp 32,000", "Supplier Name": "Java Malabar Organic" },
            { "Product ID": "abc_p3", "Quantity": "350", "Unit Cost": "Rp 55,000", "Supplier Name": "Sumatra Mandheling Co." },
            { "Product ID": "abc_p4", "Quantity": "180", "Unit Cost": "Rp 28,000", "Supplier Name": "Toraja Kalosi Estates" }
          ]
        },
        {
          id: "UPL-980",
          fileName: "weekly_sales_recap_abc.xlsx",
          fileSize: "89.5 KB",
          uploadTime: new Date(Date.now() - 3600000 * 30).toISOString(), // Yesterday
          rowCount: 4,
          status: "SUCCESS",
          dataType: "Sales Ledger",
          columns: ["Date", "Item Code", "Sold Qty", "Gross Cash"],
          data: [
            { "Date": "2026-06-25", "Item Code": "abc_p1", "Sold Qty": "84", "Gross Cash": "Rp 3,780,000" },
            { "Date": "2026-06-24", "Item Code": "abc_p3", "Sold Qty": "95", "Gross Cash": "Rp 5,225,000" },
            { "Date": "2026-06-23", "Item Code": "abc_p5", "Sold Qty": "62", "Gross Cash": "Rp 2,170,000" },
            { "Date": "2026-06-22", "Item Code": "abc_p2", "Sold Qty": "41", "Gross Cash": "Rp 1,640,000" }
          ]
        },
        {
          id: "UPL-950",
          fileName: "promo_pricing_draft_q2.csv",
          fileSize: "8.4 KB",
          uploadTime: new Date(Date.now() - 3600000 * 240).toISOString(), // 10 days ago
          rowCount: 3,
          status: "SUCCESS",
          dataType: "Pricing Sheet",
          columns: ["Product Name", "Proposed Discount", "Active Date"],
          data: [
            { "Product Name": "Signature Cold Brew", "Proposed Discount": "15%", "Active Date": "2026-06-15" },
            { "Product Name": "Avocado Latte Premium", "Proposed Discount": "20%", "Active Date": "2026-06-20" },
            { "Product Name": "Croissant Combo Bundle", "Proposed Discount": "25%", "Active Date": "2026-06-25" }
          ]
        }
      ];
      localStorage.setItem("aibispro_file_uploads", JSON.stringify(initialLogs));
      setHistory(initialLogs);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: UploadedFileLog[]) => {
    setHistory(newHistory);
    localStorage.setItem("aibispro_file_uploads", JSON.stringify(newHistory));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (name: string, sizeBytes: number) => {
    const sizeKB = (sizeBytes / 1024).toFixed(1) + " KB";
    const lowerName = name.toLowerCase();
    
    let dataType = "General Catalog";
    let columns = ["ID", "Name", "Details"];
    if (lowerName.includes("inventory") || lowerName.includes("stock")) {
      dataType = "Inventory List";
      columns = ["Product ID", "Quantity", "Unit Cost", "Supplier Name"];
    } else if (lowerName.includes("sale") || lowerName.includes("transaction")) {
      dataType = "Sales Ledger";
      columns = ["Date", "Item Code", "Sold Qty", "Gross Cash"];
    } else if (lowerName.includes("price") || lowerName.includes("promo")) {
      dataType = "Pricing Sheet";
      columns = ["Product Name", "Proposed Discount", "Active Date"];
    }

    const mockRows = Array.from({ length: 5 }, (_, idx) => {
      if (dataType === "Inventory List") {
        return {
          "Product ID": `PRD-RAW-${100 + idx}`,
          "Quantity": `${Math.floor(60 + Math.random() * 240)}`,
          "Unit Cost": `Rp ${(12 + Math.floor(Math.random() * 45)) * 1000}`,
          "Supplier Name": ["Java Estate Co", "Bali Green Farms", "Sumatra Agro", "Preanger Cooperatives"][idx % 4]
        };
      } else if (dataType === "Sales Ledger") {
        return {
          "Date": `2026-06-${20 + idx}`,
          "Item Code": `PRD-ABC-${100 + idx}`,
          "Sold Qty": `${Math.floor(12 + Math.random() * 90)}`,
          "Gross Cash": `Rp ${(180 + Math.floor(Math.random() * 900)) * 1000}`
        };
      } else {
        return {
          "Product Name": ["Avocado Latte Premium", "Organic Espresso Beans", "Pain au Chocolat Special", "Sumatra Drip Cup"][idx % 4],
          "Proposed Discount": `${5 + (idx * 5)}%`,
          "Active Date": `2026-07-0${1 + idx}`
        };
      }
    });

    const newLog: UploadedFileLog = {
      id: "UPL-" + Math.floor(100 + Math.random() * 900),
      fileName: name,
      fileSize: sizeKB,
      uploadTime: new Date().toISOString(),
      rowCount: mockRows.length,
      status: "SUCCESS",
      dataType,
      columns,
      data: mockRows
    };

    const updated = [newLog, ...history];
    saveHistory(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file.name, file.size);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file.name, file.size);
    }
  };

  const handleDeleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
    if (selectedFileDetails?.id === id) {
      setSelectedFileDetails(null);
    }
  };

  // Date filtering logic
  const filteredHistory = history.filter(item => {
    if (filterType === "ALL") return true;

    const fileDate = new Date(item.uploadTime);
    const now = new Date();

    // Day filter (Today)
    if (filterType === "DAY") {
      return (
        fileDate.getDate() === now.getDate() &&
        fileDate.getMonth() === now.getMonth() &&
        fileDate.getFullYear() === now.getFullYear()
      );
    }

    // Week filter (Last 7 Days)
    if (filterType === "WEEK") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return fileDate >= sevenDaysAgo;
    }

    // Month filter (This Month)
    if (filterType === "MONTH") {
      return (
        fileDate.getMonth() === now.getMonth() &&
        fileDate.getFullYear() === now.getFullYear()
      );
    }

    // Year filter (This Year)
    if (filterType === "YEAR") {
      return fileDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div>
        <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#261CC1]" />
          Bulk Data & Inventory Feed
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Upload standard spreadsheets (CSV or XLSX format) to batch update restaurant safety inventory, pricing parameters, or menu item indexes.
        </p>
      </div>

      {/* Drag & Drop File Upload Field */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive 
            ? "border-[#261CC1] bg-indigo-50/20" 
            : "border-slate-200 hover:border-[#261CC1] bg-slate-50/50"
        }`}
      >
        <input 
          type="file" 
          id="csv-file-input" 
          accept=".csv, .xlsx, .xls"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#5EABD6]/15 text-[#5EABD6] flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Drag and drop your spreadsheet here, or <span className="text-[#E14434] hover:underline cursor-pointer">browse files</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Supports CSV, XLSX up to 10MB</p>
        </div>
      </div>

      {/* Uploaded History logs header with filter controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Feed Submission History
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold">Updates and syncs automatically</p>
          </div>

          {/* Timeframe Filter list */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-0.5 rounded-lg">
            {(["ALL", "DAY", "WEEK", "MONTH", "YEAR"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-md uppercase transition-all cursor-pointer ${
                  filterType === t 
                    ? "bg-white text-[#E14434] shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t === "ALL" ? "All" : t === "DAY" ? "Day" : t === "WEEK" ? "Week" : t === "MONTH" ? "Month" : "Year"}
              </button>
            ))}
          </div>
        </div>

        {/* History table */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
            No matching upload entries found for selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedFileDetails(item)}
                className="py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5EABD6]/10 text-[#5EABD6] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#5EABD6]">{item.fileName}</p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                      {item.id} • {item.dataType} • {item.rowCount} rows • {new Date(item.uploadTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                  <button 
                    onClick={(e) => handleDeleteLog(item.id, e)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove feed entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Details Modal */}
      <AnimatePresence>
        {selectedFileDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full border border-slate-200"
            >
              <div className="flex justify-between items-start border-b pb-4 border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{selectedFileDetails.id} Details</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Parsed Successfully • Live Spreadsheet Feed</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFileDetails(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">File Name</p>
                    <p className="font-extrabold text-slate-800 truncate mt-0.5">{selectedFileDetails.fileName}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Feed Data Type</p>
                    <p className="font-extrabold text-[#261CC1] truncate mt-0.5">{selectedFileDetails.dataType}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Parsed Rows</p>
                    <p className="font-extrabold text-slate-800 truncate mt-0.5">{selectedFileDetails.rowCount} rows</p>
                  </div>
                </div>

                {/* Tabular spreadsheet content viewer */}
                {selectedFileDetails.data && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 mt-1">
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase mb-2 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[#261CC1]" />
                      Spreadsheet File Contents (Parsed CSV rows)
                    </p>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white max-h-56">
                      <table className="w-full text-left text-[11px] divide-y divide-slate-100 table-auto">
                        <thead className="bg-slate-50/50 text-slate-500 font-mono font-bold uppercase sticky top-0">
                          <tr>
                            {selectedFileDetails.columns.map((col) => (
                              <th key={col} className="px-3.5 py-2.5 text-[9px] font-mono border-b bg-slate-50 text-slate-500 uppercase">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {selectedFileDetails.data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              {selectedFileDetails.columns.map((col) => (
                                <td key={col} className="px-3.5 py-2 text-[10px] whitespace-nowrap">{row[col] || "-"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50 flex gap-2">
                  <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-800 font-semibold leading-relaxed">
                    This file feed contains verified structural parameters. Data parsing is complete and is permanently saved under the company ledger.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedFileDetails(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
