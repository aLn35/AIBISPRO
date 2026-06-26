/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Company, Product, InventoryLog, Promotion, Currency } from "../types";
import { EXCHANGE_RATE } from "../mockData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
  PieChart,
  Pie
} from "recharts";
import {
  CheckCircle,
  XCircle,
  Warehouse,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Image as ImageIcon,
  Flame,
  LayoutGrid,
  PlusCircle,
  Clock,
  Send,
  MessageSquare,
  Sparkle,
  MinusCircle,
  DollarSign,
  Users,
  Activity,
  ShieldAlert
} from "lucide-react";
import ManagerFileUploader from "./ManagerFileUploader";
import ManagerComboCreator from "./ManagerComboCreator";
import ManagerFlyerUpload from "./ManagerFlyerUpload";

interface SafetyProduct extends Omit<Product, "status"> {
  targetTemp: string;
  actualTemp: number;
  score: number;
  status: "SAFE" | "WARN" | "UNSAFE";
  alertReason: string;
}

const getSafetyDiagnostics = (products: Product[]): SafetyProduct[] => {
  return products.map(p => {
    const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let targetTemp = "Room (20-25°C)";
    let actualTemp = 22.4;
    const category = p.category.toLowerCase();
    
    if (category.includes("coffee") || category.includes("bean") || category.includes("bubuk") || category.includes("sirup")) {
      targetTemp = "Suhu Ruang (20-25°C)";
      actualTemp = 21.0 + (seed % 40) / 10;
    } else if (category.includes("susu") || category.includes("dairy") || category.includes("cream") || category.includes("keju") || category.includes("mentega") || category.includes("cream")) {
      targetTemp = "Dingin (2-4°C)";
      actualTemp = 2.0 + (seed % 65) / 10;
    } else if (category.includes("salmon") || category.includes("daging") || category.includes("meat") || category.includes("ayam") || category.includes("frozen")) {
      targetTemp = "Beku (<-18°C)";
      actualTemp = -22.0 + (seed % 80) / 10;
    } else {
      targetTemp = "Dingin (2-8°C)";
      actualTemp = 3.0 + (seed % 70) / 10;
    }

    let score = 95 - (seed % 15);
    let status: "SAFE" | "WARN" | "UNSAFE" = "SAFE";
    let alertReason = "Suhu optimal & rantai dingin terjaga";
    
    if (targetTemp.includes("Dingin") && actualTemp > 5.5) {
      score = 65 - (seed % 10);
      status = "WARN";
      alertReason = `Suhu pendingin meningkat ke ${actualTemp.toFixed(1)}°C (Maks 4°C)`;
    }
    if (targetTemp.includes("Beku") && actualTemp > -15.0) {
      score = 45 - (seed % 15);
      status = "UNSAFE";
      alertReason = `Suhu freezer kritis ${actualTemp.toFixed(1)}°C (Suhu beku terganggu)`;
    }
    if (p.name.includes("Durian") || p.name.includes("Salmon") || p.name.includes("Susu") || p.name.includes("Cheese")) {
      if (seed % 3 === 0) {
        score = 38;
        status = "UNSAFE";
        alertReason = "Higienitas kritis: Laporan laboratorium sensor mendeteksi kelembaban di atas standar HACCP";
      } else if (seed % 3 === 1) {
        score = 68;
        status = "WARN";
        alertReason = "Mendekati ambang batas masa simpan kesegaran (Sisa 24 Jam)";
      }
    }

    return {
      ...p,
      targetTemp,
      actualTemp,
      score,
      status,
      alertReason
    };
  });
};

interface ManagerDashboardProps {
  company: Company;
  products: Product[];
  inventoryLogs: InventoryLog[];
  promotions: Promotion[];
  currency: Currency;
  onApproveInventoryLog: (logId: string) => void;
  onRejectInventoryLog: (logId: string) => void;
  onApprovePromotion: (promoId: string) => void;
}

type TabType = "INVENTORY" | "REQUEST_CENTER" | "PRODUCT_MANAGER" | "SPREADSHEET_FEED" | "COMBO_CREATOR" | "FLYER_UPLOAD" | "CUSTOMER_GUESS";

export default function ManagerDashboard({
  company,
  products: propProducts,
  inventoryLogs,
  promotions,
  currency,
  onApproveInventoryLog,
  onRejectInventoryLog,
  onApprovePromotion,
}: ManagerDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<TabType>("INVENTORY");

  // Local state for products to support manager's live inventory editor
  const [localProducts, setLocalProducts] = useState<Product[]>(propProducts);

  // Safety Diagnostics toast state
  const [safetyToast, setSafetyToast] = useState<{ type: "success" | "warning"; text: string } | null>(null);

  // Action handler for food safety status
  const handleSafetyAction = (productId: string, action: "DISCARD" | "CALIBRATE", productName: string) => {
    if (action === "DISCARD") {
      const updated = localProducts.map(p => 
        p.id === productId ? { ...p, stock: 0, status: "OUT_OF_STOCK" as const } : p
      );
      setLocalProducts(updated);
      setSafetyToast({
        type: "warning",
        text: `⚠️ [BUANG AMAN] Batch "${productName}" berhasil ditarik dan dibuang sesuai regulasi F&B HACCP.`
      });
    } else {
      setSafetyToast({
        type: "success",
        text: `✅ [KALIBRASI BERHASIL] Sensor & Kompresor pintar untuk "${productName}" telah dikalibrasi ulang ke suhu optimal.`
      });
    }
    setTimeout(() => {
      setSafetyToast(null);
    }, 5000);
  };
  
  // Form states for creating a new product
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newProdMinStock, setNewProdMinStock] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Espresso Drinks");

  // Direct Restocking states (no request needed)
  const [restockProductId, setRestockProductId] = useState("");
  const [restockQty, setRestockQty] = useState("");

  // Analysis sort state
  const [productSortFilter, setProductSortFilter] = useState<"ALL" | "BEST_SELLING" | "MOST_PROFITABLE">("ALL");

  // Form states for submitting restocking request
  const [reqProductName, setReqProductName] = useState("");
  const [reqQuantity, setReqQuantity] = useState("");
  const [reqCost, setReqCost] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqSuccess, setReqSuccess] = useState("");

  // Track inventory request list
  const [submittedRequests, setSubmittedRequests] = useState<any[]>([]);

  // Floating AI Assistant State
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatLog, setAiChatLog] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am your AIBISPRO Context-Aware Operations Assistant. How can I help you optimize your kitchen workflow today?" }
  ]);

  // Customer Guess & Feedback states
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsSortFilter, setReviewsSortFilter] = useState<"ALL" | "HIGH_MARGIN" | "SEPI">("ALL");
  const [aiDraftReplies, setAiDraftReplies] = useState<{ [revId: string]: string }>({});
  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);

  // Sync reviews
  useEffect(() => {
    const checkReviews = () => {
      const stored = localStorage.getItem("aibispro_reviews");
      if (stored) {
        try {
          setReviews(JSON.parse(stored).filter((r: any) => r.companyId === company.id));
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkReviews();
    const interval = setInterval(checkReviews, 1500);
    return () => clearInterval(interval);
  }, [company.id]);

  // Load local state and requests
  useEffect(() => {
    // 1. Sync custom products
    const storedProds = localStorage.getItem("aibispro_products");
    if (storedProds) {
      try {
        setLocalProducts(JSON.parse(storedProds).filter((p: any) => p.companyId === company.id));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem("aibispro_products", JSON.stringify(propProducts));
    }

    // 2. Sync inventory purchase requests
    const syncRequests = () => {
      const stored = localStorage.getItem("aibispro_inventory_requests");
      if (stored) {
        try {
          setSubmittedRequests(JSON.parse(stored).filter((r: any) => r.companyId === company.id));
        } catch (e) {
          console.error(e);
        }
      }
    };
    syncRequests();
    const interval = setInterval(syncRequests, 2000);
    return () => clearInterval(interval);
  }, [company.id, propProducts]);

  // Handle direct cash transaction deduction
  const handleRecordTransaction = (productId: string, quantity: number) => {
    const stored = localStorage.getItem("aibispro_products");
    if (stored) {
      try {
        const parsed: Product[] = JSON.parse(stored);
        const updated = parsed.map((p) => {
          if (p.id === productId) {
            const newStock = Math.max(0, p.stock - quantity);
            return {
              ...p,
              stock: newStock,
              salesCount: p.salesCount + quantity,
              status: newStock === 0 ? "OUT_OF_STOCK" : newStock <= p.minStock ? "LOW_STOCK" : "IN_STOCK"
            } as Product;
          }
          return p;
        });
        localStorage.setItem("aibispro_products", JSON.stringify(updated));
        setLocalProducts(updated.filter((p) => p.companyId === company.id));
        alert(`Recorded direct sales of ${quantity} units. Ingredient inventory successfully deducted.`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Add new product catalog handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock || !newProdMinStock) return;

    const priceNum = parseFloat(newProdPrice);
    const newProduct: Product = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      companyId: company.id,
      name: newProdName,
      category: newProdCategory,
      price: priceNum,
      cogs: Math.round(priceNum * 0.35), // Estimated raw food cost is 35% of price
      stock: parseInt(newProdStock),
      minStock: parseInt(newProdMinStock),
      salesCount: 0,
      status: parseInt(newProdStock) === 0 ? "OUT_OF_STOCK" : parseInt(newProdStock) <= parseInt(newProdMinStock) ? "LOW_STOCK" : "IN_STOCK"
    };

    const stored = localStorage.getItem("aibispro_products") || "[]";
    try {
      const parsed: Product[] = JSON.parse(stored);
      const updated = [newProduct, ...parsed];
      localStorage.setItem("aibispro_products", JSON.stringify(updated));
      setLocalProducts(updated.filter((p) => p.companyId === company.id));
      
      // Reset form
      setNewProdName("");
      setNewProdPrice("");
      setNewProdStock("");
      setNewProdMinStock("");
      alert("Product successfully registered to AIBISPRO Catalog!");
    } catch (err) {
      console.error(err);
    }
  };

  // Submit restocking purchase order request to Owner
  const handleRequestRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProductName || !reqQuantity || !reqCost) return;

    const newRequest = {
      id: `REQ-${Date.now().toString().slice(-3)}`,
      companyId: company.id,
      productName: reqProductName,
      quantity: parseInt(reqQuantity),
      estimatedCost: parseFloat(reqCost),
      notes: reqNotes || "Urgent ingredient replenishment required.",
      submittedTime: new Date().toISOString(),
      status: "PENDING_APPROVAL",
      rejectReason: ""
    };

    const stored = localStorage.getItem("aibispro_inventory_requests") || "[]";
    try {
      const parsed = JSON.parse(stored);
      const updated = [newRequest, ...parsed];
      localStorage.setItem("aibispro_inventory_requests", JSON.stringify(updated));
      setSubmittedRequests(updated.filter((r: any) => r.companyId === company.id));

      // Reset
      setReqProductName("");
      setReqQuantity("");
      setReqCost("");
      setReqNotes("");
      setReqSuccess("Purchase order submitted successfully to Owner's approval queue!");
      setTimeout(() => setReqSuccess(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Direct Restocking handler (No Request Needed)
  const handleDirectRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductId || !restockQty) return;
    const qty = parseInt(restockQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid restocking quantity.");
      return;
    }

    const stored = localStorage.getItem("aibispro_products");
    if (stored) {
      try {
        const parsed: Product[] = JSON.parse(stored);
        let targetName = "";
        const updated = parsed.map((p) => {
          if (p.id === restockProductId) {
            targetName = p.name;
            const newStock = p.stock + qty;
            return {
              ...p,
              stock: newStock,
              status: newStock > p.minStock ? "IN_STOCK" : "LOW_STOCK"
            } as Product;
          }
          return p;
        });
        localStorage.setItem("aibispro_products", JSON.stringify(updated));
        setLocalProducts(updated.filter((p) => p.companyId === company.id));

        // Save a record in inventory log history as AUTOMATICALLY APPROVED / COMPLETED
        const storedLogs = localStorage.getItem("aibispro_inventory_requests") || "[]";
        const parsedLogs = JSON.parse(storedLogs);
        const restockLog = {
          id: `RST-${Date.now().toString().slice(-3)}`,
          companyId: company.id,
          productName: targetName || "Restocked Product",
          quantity: qty,
          estimatedCost: 0, // Direct replenishment
          notes: "Direct manager stock replenishment (Auto-Accepted).",
          submittedTime: new Date().toISOString(),
          status: "APPROVED"
        };
        localStorage.setItem("aibispro_inventory_requests", JSON.stringify([restockLog, ...parsedLogs]));

        alert(`Successfully restocked ${qty} units of "${targetName}" directly! Stock updated instantly.`);
        setRestockQty("");
        setRestockProductId("");
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Chat message helper for Floating AI Assistant
  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const userMsg = aiChatQuery;
    const newLog = [...aiChatLog, { sender: "user" as const, text: userMsg }];
    setAiChatLog(newLog);
    setAiChatQuery("");

    // Simulate smart operational response based on current active tab
    setTimeout(() => {
      let aiResponse = "I can analyze your catalog parameters. Make sure safety stocks match peak times.";
      const queryLower = userMsg.toLowerCase();

      if (activeTab === "INVENTORY") {
        aiResponse = "Reviewing safety stocks. Coffee beans and dairy cartons are currently flagged. Setting up a purchase request for 50 Units will ensure weekend continuity.";
      } else if (activeTab === "REQUEST_CENTER") {
        aiResponse = "I am tracking your submitted restock requests. Once the Business Owner signs off on REQ-098, AIBISPRO will automatically increment your safety stock buffers.";
      } else if (activeTab === "PRODUCT_MANAGER") {
        aiResponse = "Excellent product margins! Beverages average 72% margins. I recommend bundling slow-moving chocolate croissants with lattes to boost profit velocities.";
      } else if (activeTab === "SPREADSHEET_FEED") {
        aiResponse = "Data sync looks clean. No missing parameters or records gap. Regular uploads protect your cash flow charts from telemetry anomalies.";
      } else if (activeTab === "COMBO_CREATOR") {
        aiResponse = "Combining main meals with high-margin coffee generates 22.8% conversion. Pitching a Combo to the Owner is highly advised.";
      }

      if (queryLower.includes("price") || queryLower.includes("harga")) {
        aiResponse = "To maximize customer appeal on the guest page, ensure combos highlight the original and discounted prices (e.g., Was IDR 50K, Now IDR 35K) with attractive posters.";
      } else if (queryLower.includes("stock") || queryLower.includes("stok")) {
        aiResponse = "Your low-stock trigger threshold is set to 15. I recommend replenishing immediately once items dip below 20 to prevent customer disappointment.";
      }

      setAiChatLog([...newLog, { sender: "ai" as const, text: aiResponse }]);
    }, 1000);
  };

  // Currency helper
  const formatValue = (amount: number) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount / EXCHANGE_RATE);
    } else {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
  };

  // Filter logs for active company
  const companyLogs = inventoryLogs.filter((l) => l.companyId === company.id);
  const pendingLogs = companyLogs.filter((l) => l.status === "PENDING_APPROVAL");

  // Filter promotions for active company
  const companyPromotions = promotions.filter((p) => p.companyId === company.id);
  const pendingPromos = companyPromotions.filter((p) => p.status === "PENDING_APPROVAL");

  // Stock counters
  const lowStockProducts = localProducts.filter((p) => p.status === "LOW_STOCK");
  const outOfStockProducts = localProducts.filter((p) => p.status === "OUT_OF_STOCK");
  const safetyProducts = getSafetyDiagnostics(localProducts);

  return (
    <div className="space-y-6 relative pb-16">
      
      {/* Top Welcome Summary Banner */}
      <div className="bg-gradient-to-r from-[#5EABD6] to-[#FFB4B4] text-slate-900 p-6 rounded-3xl border border-[#5EABD6]/20 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_right,rgba(254,251,199,0.4),transparent)]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#E14434] text-white font-mono tracking-wider">
              Manager Operations Workspace
            </span>
            <h2 className="text-xl font-display font-black text-slate-950 mt-1.5">{company.avatarUrl} {company.name} Hub</h2>
            <p className="text-xs text-slate-800 font-medium">Authorize ingredient levels, log direct transactions, draft combos, and submit purchase orders.</p>
          </div>
          
          <div className="flex gap-4 text-xs font-mono">
            <div className="bg-white/80 border border-white/90 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="text-[#E14434] font-black">{pendingLogs.length}</span> <span className="text-slate-700 font-bold">Logs Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview stats block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Size</p>
          <p className="text-xl font-display font-black text-slate-900 mt-1 font-mono">
            {localProducts.length} Products
          </p>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Active Menu Assets</span>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock</p>
          <p className="text-xl font-display font-black text-amber-600 mt-1 font-mono">
            {lowStockProducts.length} Products
          </p>
          <span className="text-[10px] text-amber-500 font-bold uppercase animate-pulse">Needs restocking</span>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Out of Stock</p>
          <p className="text-xl font-display font-black text-red-600 mt-1 font-mono">
            {outOfStockProducts.length} Items
          </p>
          <span className="text-[10px] text-red-500 font-semibold uppercase">Critically depleted</span>
        </div>

        <div className="bg-[#FEFBC7] border border-[#FEFBC7] text-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Purchase Requests</p>
          <p className="text-xl font-display font-black text-[#E14434] mt-1 font-mono">
            {submittedRequests.filter(r => r.status === "PENDING_APPROVAL").length} Pending
          </p>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Awaiting Owner Approval</span>
        </div>
      </div>

      {/* Operational Health & Sustainability Monitor */}
      <div className="bg-[#FEFBC7]/40 text-slate-800 rounded-2xl p-6 border border-[#FEFBC7] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_right,rgba(94,171,214,0.15),transparent)]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#FEFBC7]/80 pb-4 mb-4">
          <div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#E14434] text-white font-mono tracking-wider">
              BI Sustainability & Risk Monitor
            </span>
            <h3 className="text-base font-display font-black text-slate-900 mt-1">
              Active Store Health & Operational Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Store Status:</span>
            <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-black uppercase ${
              company.id === "abc_coffee" 
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                : company.id === "xyz_restaurant"
                  ? "bg-rose-50 text-rose-800 border border-rose-200 animate-pulse"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              {company.id === "abc_coffee" ? "● EXCELLENT & SUSTAINABLE" : company.id === "xyz_restaurant" ? "⚠️ WARNING: REVENUE RISK" : "● STABLE & SUSTAINABLE"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-[#FEFBC7]/80 shadow-xs">
            <p className="text-slate-500 font-black uppercase text-[9px] tracking-wider">Stability Rating</p>
            <p className={`text-sm font-black mt-1 ${company.id === "xyz_restaurant" ? "text-rose-600" : "text-emerald-600"}`}>
              {company.id === "abc_coffee" ? "92% Secure" : company.id === "xyz_restaurant" ? "55% Fluctuation Risk" : "78% Safe"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Based on weekly menu asset margins.</p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#FEFBC7]/80 shadow-xs">
            <p className="text-slate-500 font-black uppercase text-[9px] tracking-wider">Sustainability Index</p>
            <p className="text-sm font-black mt-1 text-slate-800">
              {company.id === "abc_coffee" ? "High Continuity" : company.id === "xyz_restaurant" ? "Moderate (COGS Pressure)" : "Optimal"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Evaluated against raw food costs.</p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#FEFBC7]/80 shadow-xs">
            <p className="text-slate-500 font-black uppercase text-[9px] tracking-wider">Active Growth Opportunity</p>
            <p className="text-sm font-black mt-1 text-[#E14434]">
              {company.id === "abc_coffee" ? "Late Morning Croissant Combo" : company.id === "xyz_restaurant" ? "High-Margin Wagyu Promos" : "Promotional bundling models"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">AI-identified high ticket conversions.</p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#FEFBC7]/80 shadow-xs">
            <p className="text-slate-500 font-black uppercase text-[9px] tracking-wider">Risks & Bottlenecks</p>
            <p className={`text-sm font-black mt-1 ${company.id === "xyz_restaurant" ? "text-rose-600" : "text-amber-600"}`}>
              {company.id === "abc_coffee" ? "Weekend dairy stock buffer" : company.id === "xyz_restaurant" ? "Bali Salmon food cost leak" : "Low ingredient stock notifications"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Tracked via safety stock alerts.</p>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("INVENTORY")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "INVENTORY" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Inventory Approvals</span>
        </button>

        <button
          onClick={() => setActiveTab("REQUEST_CENTER")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "REQUEST_CENTER" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Inventory Request Center</span>
        </button>

        <button
          onClick={() => setActiveTab("PRODUCT_MANAGER")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "PRODUCT_MANAGER" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Product & Stock Manager</span>
        </button>

        <button
          onClick={() => setActiveTab("SPREADSHEET_FEED")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "SPREADSHEET_FEED" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Spreadsheet Feed Upload</span>
        </button>

        <button
          onClick={() => setActiveTab("COMBO_CREATOR")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "COMBO_CREATOR" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Combo Bundle Builder</span>
        </button>

        <button
          onClick={() => setActiveTab("FLYER_UPLOAD")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "FLYER_UPLOAD" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Promo Flyer Broadcast</span>
        </button>

        <button
          onClick={() => setActiveTab("CUSTOMER_GUESS")}
          className={`pb-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "CUSTOMER_GUESS" ? "border-[#E14434] text-[#E14434]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Guess & Feedback</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        
        {/* PANEL 1: INVENTORY APPROVALS & STOCKS */}
        {activeTab === "INVENTORY" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Restocking Signoffs */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-[#5EABD6]/10 text-[#5EABD6] rounded-xl">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-base">Material Restocking Signoffs</h3>
                    <p className="text-xs text-slate-500">Review and authorize ingredient log entries submitted by branch crew members.</p>
                  </div>
                </div>

                <div className="mt-6">
                  {pendingLogs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2.5" />
                      <p className="font-bold text-sm text-slate-800">All Clear!</p>
                      <p className="text-xs text-slate-400 mt-1">No pending restocking requests currently need signatures.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingLogs.map((log) => (
                        <div key={log.id} className="p-4 border border-indigo-100 bg-slate-50/40 hover:bg-slate-50 hover:border-[#5EABD6]/30 transition-all rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 font-mono font-black rounded text-[9px] uppercase tracking-wider">PENDING SIGNOFF</span>
                              <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 mt-2">{log.productName}</p>
                            <p className="text-xs text-slate-600 italic mt-1 bg-white border border-slate-100 p-2 rounded-lg">" {log.notes} "</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onRejectInventoryLog(log.id)}
                              className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
                              title="Tolak Request"
                            >
                              <XCircle className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => onApproveInventoryLog(log.id)}
                              className="bg-[#E14434] hover:bg-[#c23325] text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <CheckCircle className="w-4.5 h-4.5" /> Signoff Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Promotions validation */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-[#5EABD6]/10 text-[#5EABD6] rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-base">Campaign & Promotion Auditing</h3>
                    <p className="text-xs text-slate-500">Draft, review, or authorize pricing discount campaign items.</p>
                  </div>
                </div>

                <div className="mt-6">
                  {pendingPromos.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      No marketing campaign proposals require validation.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingPromos.map((p) => (
                        <div key={p.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-slate-50 hover:border-[#5EABD6]/30 transition-all flex items-center justify-between gap-4">
                          <div>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 font-mono text-[9px] rounded font-black uppercase tracking-wider">Awaiting Auth</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-2">{p.name}</h4>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">Rate: <span className="font-bold text-[#5EABD6]">{p.discountPercent}% Discount</span></p>
                          </div>
                          <button
                            onClick={() => onApprovePromotion(p.id)}
                            className="bg-[#E14434] text-white px-4 py-2 text-xs font-black rounded-xl hover:bg-[#c23325] transition-all cursor-pointer shadow-sm shrink-0"
                          >
                            Approve Campaign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Safety Stock Monitor */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 h-fit">
              <div>
                <h3 className="font-display font-black text-slate-900 text-base flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-[#5EABD6]" />
                  Safety Stock Monitor
                </h3>
                <p className="text-xs text-slate-500">Live safety triggers for ingredient levels.</p>
              </div>

              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {localProducts.map((p) => {
                  const percent = Math.min((p.stock / p.minStock) * 100, 100);
                  const isLow = p.status === "LOW_STOCK";
                  const isOut = p.status === "OUT_OF_STOCK";

                  return (
                    <div key={p.id} className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50/20 hover:bg-slate-50 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-900">{p.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black mt-0.5">{p.category}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs ${
                          isOut ? "bg-rose-50 text-rose-700 border border-rose-100" : isLow ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>{p.stock} porsi</span>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1.5">
                          <span>Min Safety: <strong className="text-slate-700">{p.minStock}</strong></span>
                          <span>Rasio: <strong className={isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"}>{percent.toFixed(0)}%</strong></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOut ? "bg-rose-500" : isLow ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: INVENTORY REQUEST CENTER */}
        {activeTab === "REQUEST_CENTER" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Purchase Request Form */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">Submit Restock Purchase Order</h3>
                <p className="text-xs text-slate-500">Submit restocking items directly to the Owner's approval board.</p>
              </div>

              {reqSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{reqSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRequestRestockSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Ingredient / Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sumatra Arabica Coffee Beans"
                    value={reqProductName}
                    onChange={(e) => setReqProductName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Order Qty</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 50"
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Total Cost (IDR)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 5750000"
                      value={reqCost}
                      onChange={(e) => setReqCost(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Reason / Notes for Owner</label>
                  <textarea
                    placeholder="Provide operational context or peak demand forecasts..."
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E14434] hover:bg-[#c23325] text-white py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer text-center"
                >
                  Submit Order Proposal
                </button>
              </form>
            </div>

            {/* Right: Submitted request tracking list */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">Submitted Requests Tracking Board</h3>
                <p className="text-xs text-slate-500">Live feed tracking approval statuses and Owner remarks.</p>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {submittedRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-20 text-center font-bold">No purchase orders submitted yet.</p>
                ) : (
                  submittedRequests.map((req) => (
                    <div key={req.id} className="p-4 border border-slate-100 rounded-xl space-y-2 bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                            req.status === "APPROVED" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : req.status === "REJECTED" 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                          }`}>
                            {req.status === "PENDING_APPROVAL" ? "PENDING OWNER AUTH" : req.status}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-xs mt-1.5">{req.productName}</h4>
                          <span className="text-[9px] font-mono text-slate-400">{req.id}</span>
                        </div>
                        <span className="font-mono text-xs font-black text-slate-950 bg-white px-2 py-0.5 rounded border">{formatValue(req.estimatedCost)}</span>
                      </div>

                      <p className="text-xs text-slate-600 italic">" {req.notes} "</p>

                      {req.rejectReason && (
                        <div className="p-2.5 bg-white border border-rose-100 rounded-lg text-[11px] text-rose-700 font-bold">
                          Owner Remarks: {req.rejectReason}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t pt-2 border-slate-100">
                        <span>Quantity: {req.quantity} Units</span>
                        <span>Date: {new Date(req.submittedTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: PRODUCT & STOCK MANAGER */}
        {activeTab === "PRODUCT_MANAGER" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column Stack */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Quick Restock Center */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5EABD6] animate-ping"></span>
                    <span className="text-[10px] font-black uppercase text-[#5EABD6] tracking-wider font-mono">Bypass Approval Restock</span>
                  </div>
                  <h3 className="font-display font-black text-slate-950 text-base mt-1">Instant Restock Center</h3>
                  <p className="text-xs text-slate-500 mt-1">Sesuai kebijakan owner, restock dilakukan secara mandiri & langsung terupdate tanpa perlu antrian persetujuan.</p>
                </div>

                <form onSubmit={handleDirectRestockSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Pilih Menu / Produk</label>
                    <select
                      required
                      value={restockProductId}
                      onChange={(e) => setRestockProductId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="">-- Pilih item untuk di-restock --</option>
                      {localProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok saat ini: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Jumlah Unit Restock</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g., 50"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#E14434] hover:bg-[#c23325] text-white py-3 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer text-center"
                  >
                    Update Stok Sekarang
                  </button>
                </form>

                {/* Quick statistics summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <p className="font-bold text-slate-700 uppercase text-[9px] tracking-wider">Quick Stock Alerts</p>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Low Stock Items:</span>
                    <span className="font-bold text-amber-600">{localProducts.filter(p => p.stock <= p.minStock && p.stock > 0).length} Menu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Out of Stock Items:</span>
                    <span className="font-bold text-rose-600">{localProducts.filter(p => p.stock === 0).length} Menu</span>
                  </div>
                </div>
              </div>

              {/* Stock Safety Status Chart Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-display font-black text-slate-950 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-[#E14434]" />
                    Analisis Keamanan Menu
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">Status stok harian menu masakan & minuman aktif secara visual.</p>
                </div>

                <div className="h-[210px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={localProducts.map(p => ({
                        shortName: p.name.length > 12 ? p.name.substring(0, 12) + ".." : p.name,
                        fullName: p.name,
                        stok: p.stock,
                        minStok: p.minStock,
                        status: p.stock === 0 ? "Kritis" : p.stock <= p.minStock ? "Menipis" : "Aman"
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis dataKey="shortName" type="category" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#1e293b' }} width={85} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950 text-white p-3 rounded-xl text-[10px] space-y-1.5 font-sans border border-slate-800 shadow-xl max-w-[200px]">
                                <p className="font-black text-slate-200 leading-tight">{data.fullName}</p>
                                <div className="border-t border-slate-800 pt-1 mt-1 space-y-1">
                                  <p className="text-slate-400">Stok Saat Ini: <span className="font-black text-white text-xs">{data.stok} unit</span></p>
                                  <p className="text-slate-400">Min. Safety Level: <span className="font-bold text-slate-300">{data.minStok} unit</span></p>
                                </div>
                                <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase ${
                                  data.status === "Aman" ? "bg-emerald-500/20 text-emerald-400" : data.status === "Menipis" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                                }`}>
                                  Status: {data.status}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="stok" radius={[0, 6, 6, 0]} barSize={14}>
                        {localProducts.map((p, idx) => {
                          const isOut = p.stock === 0;
                          const isLow = p.stock <= p.minStock;
                          const color = isOut 
                            ? "#ef4444" // red
                            : isLow 
                              ? "#f59e0b" // amber
                              : "#10b981"; // emerald
                          return <Cell key={`cell-${idx}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Aman</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Menipis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Kritis/Habis</span>
                  </div>
                </div>
              </div>

            </div>

            {/* List, Performance Analysis, and AI Demand Timings */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
                <div>
                  <h3 className="font-display font-black text-slate-950 text-base">Menu Catalog & Demand Analytics</h3>
                  <p className="text-xs text-slate-500">Liat performa finansial, harga, margin, dan prediksi jam ramai AI.</p>
                </div>

                {/* Filter Sorters */}
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setProductSortFilter("ALL")}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      productSortFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setProductSortFilter("BEST_SELLING")}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      productSortFilter === "BEST_SELLING" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🔥 Paling Laku
                  </button>
                  <button
                    onClick={() => setProductSortFilter("MOST_PROFITABLE")}
                    className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                      productSortFilter === "MOST_PROFITABLE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    💰 Paling Menguntungkan
                  </button>
                </div>
              </div>

              {/* Display items */}
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {[...localProducts]
                  .sort((a, b) => {
                    if (productSortFilter === "BEST_SELLING") {
                      return b.salesCount - a.salesCount;
                    }
                    if (productSortFilter === "MOST_PROFITABLE") {
                      const profitA = a.price - (a.cogs || a.price * 0.35);
                      const profitB = b.price - (b.cogs || b.price * 0.35);
                      return profitB - profitA;
                    }
                    return 0; // Default
                  })
                  .map((p) => {
                    const unitCost = p.cogs || Math.round(p.price * 0.35);
                    const unitProfit = p.price - unitCost;
                    const marginPercent = Math.round((unitProfit / p.price) * 100);

                    // Peak timing strings
                    const getPeakTiming = (prod: Product) => {
                      const cat = prod.category.toLowerCase();
                      if (cat.includes("coffee") || prod.name.toLowerCase().includes("coffee") || prod.name.toLowerCase().includes("latte") || prod.name.toLowerCase().includes("brew")) {
                        return "🌅 Puncak Pagi (08:00 - 11:30) - Terjual rata-rata 3x lipat selama jam sibuk berangkat kantor & meeting pagi.";
                      } else if (cat.includes("bakery") || prod.name.toLowerCase().includes("croissant") || prod.name.toLowerCase().includes("muffin") || prod.name.toLowerCase().includes("donut")) {
                        return "🥐 Brunch & Coffee-Break (09:00 - 11:30) & (15:00 - 17:00) - Sangat efektif jika dijadikan paket kombo bundling dengan minuman.";
                      } else if (cat.includes("main") || prod.name.toLowerCase().includes("rice") || prod.name.toLowerCase().includes("salmon") || prod.name.toLowerCase().includes("steak")) {
                        return "🍽️ Jam Makan Siang (12:00 - 14:00) & Malam (18:30 - 21:00) - Menjadi kontributor profit terbesar saat weekend dining.";
                      } else if (cat.includes("sushi") || prod.name.toLowerCase().includes("sashimi") || prod.name.toLowerCase().includes("roll")) {
                        return "🍣 Jam Makan Malam (17:30 - 21:00) - Mengalami lonjakan pesanan yang signifikan setiap hari Jumat & Sabtu malam.";
                      } else {
                        return "⚡ Jam Santai Sore (14:00 - 16:30) - Sering dipesan pelanggan untuk nongkrong / cemilan sela jam kerja.";
                      }
                    };

                    const isBestSeller = p.salesCount >= 100;
                    const isHighMargin = marginPercent >= 65;

                    return (
                      <div key={p.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono uppercase">{p.category}</span>
                              {isBestSeller && (
                                <span className="text-[9px] font-black px-2 py-0.5 bg-amber-500 text-white rounded-md flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 fill-white" /> PALING LAKU
                                </span>
                              )}
                              {isHighMargin && (
                                <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500 text-white rounded-md">
                                  💰 UNTUNG TINGGI
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mt-1.5">{p.name}</h4>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs font-black text-slate-800">Harga: <span className="font-mono text-[#261CC1]">{formatValue(p.price)}</span></p>
                            <p className="text-[10px] text-slate-400 font-mono">COGS: {formatValue(unitCost)} ({100 - marginPercent}% Biaya)</p>
                          </div>
                        </div>

                        {/* Financial and Stock breakdown row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] bg-white p-3 rounded-xl border border-slate-200/50">
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Stok Tersedia</p>
                            <p className={`font-extrabold mt-0.5 ${p.stock <= p.minStock ? "text-amber-600 animate-pulse" : "text-slate-800"}`}>
                              {p.stock} Unit ({p.stock === 0 ? "Habis" : p.stock <= p.minStock ? "Kritis" : "Aman"})
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Total Terjual</p>
                            <p className="font-extrabold text-slate-800 mt-0.5">{p.salesCount} porsi</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Keuntungan / Porsi</p>
                            <p className="font-extrabold text-emerald-600 mt-0.5">{formatValue(unitProfit)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Margin Keuntungan</p>
                            <p className="font-extrabold text-indigo-700 mt-0.5">{marginPercent}% Margin</p>
                          </div>
                        </div>

                        {/* AI Peak Hours Timing Section */}
                        <div className="bg-[#5EABD6]/10 border border-[#5EABD6]/20 rounded-xl p-3 flex gap-2">
                          <Clock className="w-4 h-4 text-[#5EABD6] shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase text-indigo-800 tracking-wider font-mono">AIBISPRO Demand Timing AI</p>
                            <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{getPeakTiming(p)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* F&B Safety & Expiry Diagnostics Tracker */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#E14434]/10 text-[#E14434] rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-950 text-sm uppercase tracking-wider">F&B Safety Diagnostic</h3>
                    <p className="text-[11px] text-slate-500">Real-time freshness, hygiene & temperature audits.</p>
                  </div>
                </div>

                {/* Safety Toast Action feedback */}
                {safetyToast && (
                  <div className={`p-3 rounded-xl text-xs font-bold leading-normal transition-all animate-in slide-in-from-top duration-300 ${
                    safetyToast.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-rose-50 border border-rose-100 text-[#E14434]"
                  }`}>
                    {safetyToast.text}
                  </div>
                )}

                {/* Safety Summary Chart */}
                <div className="relative h-[160px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Safe", value: safetyProducts.filter(p => p.status === "SAFE").length, color: "#10b981" },
                          { name: "Warning", value: safetyProducts.filter(p => p.status === "WARN").length, color: "#f59e0b" },
                          { name: "Unsafe", value: safetyProducts.filter(p => p.status === "UNSAFE").length, color: "#E14434" }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          { name: "Safe", value: safetyProducts.filter(p => p.status === "SAFE").length, color: "#10b981" },
                          { name: "Warning", value: safetyProducts.filter(p => p.status === "WARN").length, color: "#f59e0b" },
                          { name: "Unsafe", value: safetyProducts.filter(p => p.status === "UNSAFE").length, color: "#E14434" }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <p className="text-xl font-black text-slate-900">
                      {Math.round((safetyProducts.filter(p => p.status === "SAFE").length / Math.max(1, safetyProducts.length)) * 100)}%
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Health Score</p>
                  </div>
                </div>

                {/* Legends */}
                <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-center border-b pb-4 border-slate-100">
                  <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg border border-emerald-100">
                    <p className="text-xs font-black">{safetyProducts.filter(p => p.status === "SAFE").length}</p>
                    <p className="text-[8px] opacity-80 uppercase">Aman</p>
                  </div>
                  <div className="bg-amber-50 text-amber-700 p-1.5 rounded-lg border border-amber-100">
                    <p className="text-xs font-black">{safetyProducts.filter(p => p.status === "WARN").length}</p>
                    <p className="text-[8px] opacity-80 uppercase">Warning</p>
                  </div>
                  <div className="bg-rose-50 text-[#E14434] p-1.5 rounded-lg border border-rose-100">
                    <p className="text-xs font-black">{safetyProducts.filter(p => p.status === "UNSAFE").length}</p>
                    <p className="text-[8px] opacity-80 uppercase">Kritis</p>
                  </div>
                </div>

                {/* Alert Lists */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Items Needing Immediate Action</p>
                  {safetyProducts.filter(p => p.status !== "SAFE").length === 0 ? (
                    <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                      🎉 All items are fully compliant & healthy!
                    </p>
                  ) : (
                    safetyProducts.filter(p => p.status !== "SAFE").map(p => (
                      <div key={p.id} className={`p-2.5 border rounded-xl flex flex-col gap-1.5 transition-all text-left ${
                        p.status === "UNSAFE" ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100"
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-xs text-slate-800 truncate max-w-[110px]">{p.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            p.status === "UNSAFE" ? "bg-[#E14434] text-white" : "bg-amber-500 text-white"
                          }`}>{p.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal bg-white/80 p-1.5 border border-slate-100 rounded-lg">
                          {p.alertReason}
                        </p>
                        <div className="flex gap-1.5 items-center justify-between">
                          <span className="text-[9px] font-mono text-slate-400 font-bold">
                            {p.targetTemp} • <span className="font-black text-slate-700">{p.actualTemp.toFixed(1)}°C</span>
                          </span>
                          <div className="flex gap-1">
                            {p.status === "UNSAFE" ? (
                              <button
                                onClick={() => handleSafetyAction(p.id, "DISCARD", p.name)}
                                className="px-2 py-1 bg-[#E14434] text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-[#c23325] transition-colors cursor-pointer"
                              >
                                Buang Item
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSafetyAction(p.id, "CALIBRATE", p.name)}
                                className="px-2 py-1 bg-[#5EABD6] text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-[#4b9cbd] transition-colors cursor-pointer"
                              >
                                Kalibrasi
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Safety Status Banner */}
              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-2xl flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold tracking-wider uppercase">F&B HACCP Compliant Monitor</span>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: SPREADSHEET FEED UPLOAD */}
        {activeTab === "SPREADSHEET_FEED" && (
          <ManagerFileUploader />
        )}

        {/* PANEL 5: COMBO BUNDLE BUILDER */}
        {activeTab === "COMBO_CREATOR" && (
          <ManagerComboCreator company={company} products={localProducts} currency={currency} />
        )}

        {/* PANEL 6: FLYER UPLOAD */}
        {activeTab === "FLYER_UPLOAD" && (
          <ManagerFlyerUpload company={company} promotions={promotions} />
        )}

        {/* PANEL 7: CUSTOMER GUESS & FEEDBACK ANALYTICS */}
        {activeTab === "CUSTOMER_GUESS" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#261CC1]" />
                    Analisis Pelanggan & Popularitas Menu (Customer Guess & Feedback)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pantau menu paling menguntungkan, draf strategi penjualan untuk menu yang sepi peminat, serta kelola review pelanggan secara real-time.
                  </p>
                </div>
                
                {/* Switch Filters */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs shrink-0 self-start">
                  <button
                    onClick={() => setReviewsSortFilter("ALL")}
                    className={`px-3 py-1.5 font-bold rounded-lg cursor-pointer transition-all ${reviewsSortFilter === "ALL" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    Semua Menu
                  </button>
                  <button
                    onClick={() => setReviewsSortFilter("HIGH_MARGIN")}
                    className={`px-3 py-1.5 font-bold rounded-lg cursor-pointer transition-all ${reviewsSortFilter === "HIGH_MARGIN" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    Paling Untung
                  </button>
                  <button
                    onClick={() => setReviewsSortFilter("SEPI")}
                    className={`px-3 py-1.5 font-bold rounded-lg cursor-pointer transition-all ${reviewsSortFilter === "SEPI" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    Bahkan Sepi (Kurang Laku)
                  </button>
                </div>
              </div>

              {/* Menu listings based on filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localProducts
                  .filter((p) => {
                    const cost = p.cogs || Math.round(p.price * 0.35);
                    const margin = Math.round(((p.price - cost) / p.price) * 100);
                    if (reviewsSortFilter === "HIGH_MARGIN") return margin >= 65;
                    if (reviewsSortFilter === "SEPI") return p.salesCount < 40;
                    return true;
                  })
                  .map((p) => {
                    const cost = p.cogs || Math.round(p.price * 0.35);
                    const profit = p.price - cost;
                    const margin = Math.round((profit / p.price) * 100);
                    const isSepi = p.salesCount < 40;
                    const isHighMargin = margin >= 65;

                    return (
                      <div key={p.id} className={`p-4 border rounded-2xl transition-all space-y-3 ${isSepi ? "border-amber-100 bg-amber-50/10" : isHighMargin ? "border-emerald-100 bg-emerald-50/10" : "border-slate-100 bg-slate-50/30"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {p.category}
                              </span>
                              {isHighMargin && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#e6fbf2] text-emerald-800 rounded">
                                  💎 MARGIN TINGGI
                                </span>
                              )}
                              {isSepi && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#fef8e7] text-amber-800 rounded">
                                  ⚠️ KURANG LAKU (SEPI)
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mt-1">{p.name}</h4>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-[#261CC1]">{formatValue(p.price)}</span>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">Penjualan: {p.salesCount} porsi</p>
                          </div>
                        </div>

                        {/* Cost breakdown progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>Biaya Pokok (COGS): {formatValue(cost)}</span>
                            <span>Profit Margin: {margin}% ({formatValue(profit)})</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${isSepi ? "bg-amber-500" : isHighMargin ? "bg-emerald-500" : "bg-indigo-600"}`} style={{ width: `${margin}%` }}></div>
                          </div>
                        </div>

                        {/* AI Prescription / Strategic Recommendation */}
                        <div className="p-3 bg-white/70 border border-slate-100 rounded-xl space-y-1">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#261CC1] fill-[#261CC1]" />
                            Rekomendasi Strategis AI
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {isSepi 
                              ? `Menu ini kurang diminati (sepi). AI merekomendasikan memasukkan "${p.name}" ke dalam Paket Kombo Bundling sore hari dengan diskon 15% untuk meningkatkan penjualan tanpa mengikis margin profit secara drastis.` 
                              : isHighMargin 
                                ? `Menu kontributor keuntungan utama! Kampanyekan "${p.name}" melalui flyer promo broadcast di jam-jam sibuk untuk mengoptimalkan akumulasi cash flow harian.` 
                                : `Menu stabil. Pastikan ketersediaan safety stock bahan baku terjaga agar proses pelayanan tetap efisien selama akhir pekan.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Customer Guest Reviews Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#261CC1]" />
                  Kelola Guest Reviews & Customer Guess Feedback
                </h3>
                <p className="text-xs text-slate-500">
                  Berikut adalah ulasan yang masuk langsung dari halaman Customer Guess. Gunakan AI Generator untuk menyusun tanggapan balasan yang taktis dan ramah.
                </p>
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="p-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-bold text-xs">
                    Belum ada ulasan atau customer guess yang masuk untuk perusahaan ini.
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const stars = Array(5).fill(0);
                    const hasDraft = !!aiDraftReplies[rev.id];

                    return (
                      <div key={rev.id} className="p-4 border border-slate-100 bg-slate-50/40 rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-300">
                              {rev.author[0]}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-xs">{rev.author}</h5>
                              <p className="text-[10px] text-slate-400 font-mono">{rev.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-200/50">
                            {stars.map((_, i) => (
                              <svg key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.174-.374.724-.374.898 0l2.582 5.253 5.79.845c.407.06.57.561.275.854l-4.186 4.083 1.114 5.792c.078.406-.35.717-.714.524l-5.18-2.724-5.18 2.724c-.364.193-.792-.118-.714-.524l1.114-5.792-4.186-4.083c-.294-.293-.13-.794.275-.854l5.79-.845 2.582-5.253z" />
                              </svg>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed italic font-medium bg-white p-3 rounded-xl border border-slate-100">
                          " {rev.comment} "
                        </p>

                        {/* AI Reply generator area */}
                        <div className="space-y-2">
                          {!hasDraft ? (
                            <button
                              onClick={() => {
                                setLoadingDraftId(rev.id);
                                setTimeout(() => {
                                  const greeting = rev.author === "Anonymous Guest" ? "Kak" : `Kak ${rev.author}`;
                                  let reply = `Halo ${greeting}, terima kasih banyak atas ulasan dan masukan berharganya untuk ${company.name}! `;
                                  if (rev.rating >= 4) {
                                    reply += `Kami sangat senang jika menu kami memuaskan selera Anda. Kami berkomitmen untuk terus menjaga kualitas cita rasa dan pelayanan terbaik untuk Anda. Sampai jumpa di kunjungan berikutnya! 😊`;
                                  } else {
                                    reply += `Mohon maaf atas ketidaknyamanan yang dirasakan. Masukan mengenai rasa atau layanan ini telah kami teruskan ke tim dapur untuk evaluasi mendalam. Kami berharap dapat memberikan pengalaman yang jauh lebih baik pada kunjungan Anda berikutnya. 🙏`;
                                  }
                                  setAiDraftReplies((prev) => ({ ...prev, [rev.id]: reply }));
                                  setLoadingDraftId(null);
                                }, 800);
                              }}
                              disabled={loadingDraftId === rev.id}
                              className="px-3.5 py-1.5 bg-[#261CC1] hover:bg-[#1C0770] disabled:bg-slate-300 text-white font-mono text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 uppercase"
                            >
                              {loadingDraftId === rev.id ? (
                                <>
                                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                  Membuat Draft...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-[#F1FF5E] fill-[#F1FF5E]" />
                                  Draf Balasan AI
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 animate-in fade-in duration-300">
                              <p className="text-[9px] font-black uppercase text-indigo-800 tracking-wider font-mono flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-indigo-700 fill-indigo-700" />
                                Draf Tanggapan Bisnis Berbasis AI
                              </p>
                              <textarea
                                value={aiDraftReplies[rev.id]}
                                onChange={(e) => setAiDraftReplies({ ...aiDraftReplies, [rev.id]: e.target.value })}
                                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#261CC1]"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    alert("Balasan ulasan berhasil disalin ke clipboard!");
                                    navigator.clipboard.writeText(aiDraftReplies[rev.id]);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] font-black rounded-md cursor-pointer uppercase border-0"
                                >
                                  Salin Balasan
                                </button>
                                <button
                                  onClick={() => {
                                    setAiDraftReplies((prev) => {
                                      const copy = { ...prev };
                                      delete copy[rev.id];
                                      return copy;
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-[9px] font-black rounded-md cursor-pointer uppercase border-0"
                                >
                                  Sembunyikan
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PERSISTENT FLOATING CONTEXT-AWARE AI OPERATIONAL ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showAIAssistant ? (
          <button
            onClick={() => {
              setShowAIAssistant(true);
              // Trigger log entry
              const storedLogs = localStorage.getItem("aibispro_consultant_audit_logs");
              if (storedLogs) {
                try {
                  const parsed = JSON.parse(storedLogs);
                  const newEntry = {
                    id: `LOG-${Date.now()}`,
                    timestamp: new Date().toLocaleString(),
                    action: "AI_ASSISTANT_QUERY",
                    companyId: company.id,
                    companyName: company.name,
                    details: "Manager engaged contextual AI assistant widget."
                  };
                  localStorage.setItem("aibispro_consultant_audit_logs", JSON.stringify([newEntry, ...parsed]));
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            className="w-12 h-12 bg-[#E14434] hover:bg-[#c23325] text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-transform hover:scale-110 active:scale-95 animate-bounce"
            title="AIBISPRO Context-Aware AI Assistant"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-80 h-96 bg-white text-slate-800 rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Title / Header */}
            <div className="p-4 bg-[#FEFBC7] border-b border-[#FEFBC7] flex justify-between items-center shrink-0 text-slate-900">
              <div className="flex items-center gap-1.5">
                <Sparkle className="w-4 h-4 text-[#E14434] animate-pulse" />
                <span className="text-xs font-black font-display uppercase tracking-wider">Contextual Operations AI</span>
              </div>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-slate-500 hover:text-slate-900 text-xs cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none text-xs">
              {aiChatLog.map((log, i) => (
                <div key={i} className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed font-semibold ${
                    log.sender === "user" ? "bg-[#5EABD6] text-white rounded-tr-none" : "bg-[#FEFBC7]/40 text-slate-800 rounded-tl-none border border-[#FEFBC7]"
                  }`}>
                    {log.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Active view tip */}
            <div className="p-3 bg-[#FFB4B4]/10 border-t border-slate-100 text-[10px] text-slate-700 flex items-start gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#E14434] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#E14434]">Active View Context Tip:</p>
                <p className="text-slate-500 mt-0.5 font-medium">
                  {activeTab === "INVENTORY" && "Safety Stock: Ensure dairy and coffee bean stock warnings are cleared via signoffs."}
                  {activeTab === "REQUEST_CENTER" && "Requests: Submit restocking logs to trigger automatic stock updates."}
                  {activeTab === "PRODUCT_MANAGER" && "Products: Deduct cash transactions instantly or append new items."}
                  {activeTab === "SPREADSHEET_FEED" && "Files: Ensure column structures align with standard templates."}
                  {activeTab === "COMBO_CREATOR" && "Combos: Multi-product combos boost average ticket tickets."}
                  {activeTab === "FLYER_UPLOAD" && "Flyers: Visual flyers with high-contrast banners achieve 2x conversion."}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSendAiMessage} className="p-2 border-t border-slate-100 flex bg-white shrink-0">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={aiChatQuery}
                onChange={(e) => setAiChatQuery(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl focus:outline-none focus:border-[#5EABD6] text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                className="p-2 text-[#E14434] hover:text-[#5EABD6] cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
