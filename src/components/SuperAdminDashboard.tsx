/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react";
import { Company, FinancialMetric, Currency } from "../types";
import { PRESET_COMPANIES, DEMO_USERS, EXCHANGE_RATE } from "../mockData";
import {
  ShieldAlert,
  Server,
  Users,
  Activity,
  Cpu,
  HardDrive,
  Network,
  CreditCard,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  Percent,
  FileSpreadsheet,
  Sparkles,
  ClipboardList,
  Clock,
  ArrowUpRight,
  Gauge
} from "lucide-react";

interface SuperAdminDashboardProps {
  companies: Company[];
  metrics: FinancialMetric[];
  currency: Currency;
  onSwitchCompany: (company: Company) => void;
  onChangeView: (view: string) => void;
}

type ConsultantTab = "CLIENTS" | "HEALTH_CENTER" | "BENCHMARK" | "DATA_MONITOR" | "AI_HUB" | "AUDIT_LOG";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  companyId: string;
  companyName: string;
  details: string;
}

export default function SuperAdminDashboard({
  companies,
  metrics,
  currency,
  onSwitchCompany,
  onChangeView,
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<ConsultantTab>("CLIENTS");
  const [selectedCompany, setSelectedCompany] = useState<Company>(companies[0] || PRESET_COMPANIES[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Local state for permissions per company
  const [consultantAccess, setConsultantAccess] = useState<{ [companyId: string]: any }>({});

  // Sync access permissions and audit logs with localStorage
  useEffect(() => {
    // 1. Get access permissions
    const accessMap: { [companyId: string]: any } = {};
    companies.forEach((c) => {
      const stored = localStorage.getItem(`aibispro_consultant_access_${c.id}`);
      if (stored) {
        try {
          accessMap[c.id] = JSON.parse(stored);
        } catch (e) {
          accessMap[c.id] = { analytics: true, inventory: true, expenses: false, capital: false, employee: false };
        }
      } else {
        // Default initial settings
        accessMap[c.id] = {
          analytics: true,
          inventory: true,
          expenses: c.id === "abc_coffee" ? true : false, // let's default abc_coffee to true for demo, others false
          capital: false,
          employee: false
        };
      }
    });
    setConsultantAccess(accessMap);

    // 2. Load audit logs
    const storedLogs = localStorage.getItem("aibispro_consultant_audit_logs");
    if (storedLogs) {
      try {
        setAuditLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialLogs: AuditLogEntry[] = [
        {
          id: `LOG-${Date.now() - 3600000 * 5}`,
          timestamp: new Date(Date.now() - 3600000 * 5).toLocaleString(),
          action: "INITIAL_SYNC",
          companyId: "abc_coffee",
          companyName: "ABC Coffee Roasters",
          details: "Salesforce CRM synchronised API nodes."
        },
        {
          id: `LOG-${Date.now() - 3600000 * 3}`,
          timestamp: new Date(Date.now() - 3600000 * 3).toLocaleString(),
          action: "DATA_INSPECTION",
          companyId: "xyz_restaurant",
          companyName: "Wagyu Prime Bistro",
          details: "Inspected inventory depletion metrics and forecast logs."
        }
      ];
      localStorage.setItem("aibispro_consultant_audit_logs", JSON.stringify(initialLogs));
      setAuditLogs(initialLogs);
    }
  }, [companies]);

  // Log action helper
  const logConsultantAction = (action: string, companyId: string, companyName: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action,
      companyId,
      companyName,
      details
    };
    const updated = [newEntry, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem("aibispro_consultant_audit_logs", JSON.stringify(updated));
  };

  // Local state for interactive To-Do Checklist (Consultant tasks)
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean; category: string }[]>(() => {
    const stored = localStorage.getItem("aibispro_consultant_todos");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      { id: "todo-1", text: "Validate ABC Coffee's newly uploaded CSV sales ledger dataset", completed: true, category: "DATA_VALIDATION" },
      { id: "todo-2", text: "Investigate Wagyu Prime Bistro's warning-level ingredient waste (11.8%)", completed: false, category: "HEALTH_AUDIT" },
      { id: "todo-3", text: "Formulate high-margin Croissant Combo recommendation for ABC Coffee", completed: false, category: "STRATEGY_CONSULT" },
      { id: "todo-4", text: "Check Sushi House's operating margins against SEA average benchmarks", completed: true, category: "BENCHMARKING" },
      { id: "todo-5", text: "Confirm Owner permissions for financial cost analysis visibility", completed: false, category: "SECURITY_GATEWAY" },
      { id: "todo-6", text: "Submit updated revenue forecast prediction results to client meeting logs", completed: false, category: "AI_FORECAST" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("aibispro_consultant_todos", JSON.stringify(todos));
  }, [todos]);

  const toggleTodo = (id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      
      // Log the task action in the audit logs
      const task = prev.find(t => t.id === id);
      if (task) {
        const details = `Consultant marked task [${task.text}] as ${!task.completed ? 'COMPLETED' : 'PENDING'}`;
        logConsultantAction("TASK_TOGGLE", selectedCompany.id, selectedCompany.name, details);
      }
      return updated;
    });
  };

  const completedCount = todos.filter(t => t.completed).length;
  const completionPercentage = Math.round((completedCount / todos.length) * 100);

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

  // Pre-calculate cumulative platform statistics
  const platformStats = useMemo(() => {
    let globalRevenue = 0;
    let globalExpenses = 0;
    let globalCogs = 0;

    metrics.forEach((m) => {
      globalRevenue += m.revenue;
      globalExpenses += m.expenses;
      globalCogs += m.cogs;
    });

    const companyRevs: { [key: string]: number } = {};
    metrics.forEach((m) => {
      if (!companyRevs[m.companyId]) {
        companyRevs[m.companyId] = 0;
      }
      companyRevs[m.companyId] += m.revenue;
    });

    return {
      globalRevenue,
      globalExpenses,
      globalProfit: globalRevenue - globalCogs - globalExpenses,
      companyRevs,
    };
  }, [metrics]);

  // Calculate dynamic parameters for each company to form Health Scores
  const companyHealthData = useMemo(() => {
    return companies.map((c) => {
      const compMetrics = metrics.filter((m) => m.companyId === c.id);
      const totalRev = compMetrics.reduce((sum, m) => sum + m.revenue, 0);
      const totalExp = compMetrics.reduce((sum, m) => sum + m.expenses, 0);
      const totalCogs = compMetrics.reduce((sum, m) => sum + m.cogs, 0);
      const profit = totalRev - totalCogs - totalExp;

      // growth rates & margins
      const profitMargin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
      const revGrowth = c.id === "abc_coffee" ? 14.5 : c.id === "xyz_restaurant" ? -2.4 : 8.1; // Simulated growth
      const wastePct = c.id === "abc_coffee" ? 4.2 : c.id === "xyz_restaurant" ? 11.8 : 5.5; // Simulated waste
      const inventoryTurnover = c.id === "abc_coffee" ? 8.4 : c.id === "xyz_restaurant" ? 4.2 : 6.1; // Simulated turnover (times/mo)

      // health score: weighted parameters
      let healthScore = 75; // base
      if (revGrowth > 0) healthScore += 10; else healthScore -= 15;
      if (profitMargin > 20) healthScore += 10; else if (profitMargin < 10) healthScore -= 10;
      if (wastePct < 6) healthScore += 10; else healthScore -= 12;
      if (inventoryTurnover > 5) healthScore += 5;

      // clamp to 0-100
      healthScore = Math.max(10, Math.min(100, healthScore));

      return {
        company: c,
        healthScore,
        revenue: totalRev,
        profit,
        profitMargin,
        revGrowth,
        wastePct,
        inventoryTurnover,
        status: healthScore >= 80 ? "EXCELLENT" : healthScore >= 60 ? "STABLE" : "WARNING"
      };
    });
  }, [companies, metrics]);

  // Handle active workspace switching
  const handleSelectWorkspace = (c: Company) => {
    setSelectedCompany(c);
    logConsultantAction("WORKSPACE_SWITCH", c.id, c.name, `Consultant switched active corporate focus to ${c.name}`);
  };

  const currentAccess = consultantAccess[selectedCompany.id] || {
    analytics: true,
    inventory: true,
    expenses: false,
    capital: false,
    employee: false,
    maintenance: true
  };

  const isMaintenanceAllowed = currentAccess.hasOwnProperty("maintenance") ? (currentAccess as any).maintenance !== false : true;

  const activeHealth = companyHealthData.find(hd => hd.company.id === selectedCompany.id) || {
    healthScore: 82,
    revGrowth: 14.5,
    profitMargin: 24.2,
    inventoryTurnover: 8.4,
    wastePct: 4.2,
    revenue: 55000000,
    profit: 14000000
  };

  // Mock server nodes stats
  const serverNodes = [
    { name: "Indonesia Main API Node-1 (Jakarta)", status: "HEALTHY", cpu: "14%", ram: "4.2 GB / 8.0 GB", latency: "12ms" },
    { name: "AIBISPRO Global Core VM (Cloud Run)", status: "HEALTHY", cpu: "22%", ram: "3.5 GB / 16.0 GB", latency: "8ms" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Salesforce Consultant Welcome Banner */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_right,rgba(38,28,193,0.3),transparent)]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#261CC1] text-white font-mono tracking-wider">
                Salesforce Consultant Workspace
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#F1FF5E] text-slate-900 font-mono tracking-wider animate-pulse">
                MAINTENANCE & BENCHMARKING ACTIVE
              </span>
            </div>
            <h2 className="text-xl font-display font-extrabold mt-1.5">AIBISPRO Consultant CRM Command Suite</h2>
            <p className="text-xs text-slate-400">Validate dataset health parameters, benchmark corporate structures with F&B averages, and consult client business strategies.</p>
          </div>
          
          {/* Company quick switch widget */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-2xl">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 pl-2">Client Focus:</span>
            <select
              value={selectedCompany.id}
              onChange={(e) => {
                const comp = companies.find(c => c.id === e.target.value);
                if (comp) handleSelectWorkspace(comp);
              }}
              className="bg-slate-950 text-white border border-slate-800 text-xs py-1.5 px-3 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#261CC1]"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.avatarUrl} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modular Tab Switcher */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("CLIENTS")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "CLIENTS"
              ? "border-[#261CC1] text-[#261CC1]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Client Profile Directory</span>
        </button>

        <button
          onClick={() => setActiveTab("HEALTH_CENTER")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "HEALTH_CENTER"
              ? "border-[#261CC1] text-[#261CC1]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Company Health Center</span>
        </button>

        <button
          onClick={() => setActiveTab("BENCHMARK")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "BENCHMARK"
              ? "border-[#261CC1] text-[#261CC1]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>F&B Benchmark Center</span>
        </button>

        <button
          onClick={() => setActiveTab("DATA_MONITOR")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "DATA_MONITOR"
              ? "border-[#261CC1] text-[#261CC1]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Dataset Monitoring Center</span>
        </button>

        <button
          onClick={() => setActiveTab("AI_HUB")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "AI_HUB"
              ? "border-[#261CC1] text-[#261CC1]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Forecast Consult Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT_LOG")}
          className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "AUDIT_LOG"
              ? "border-[#261CC1] text-[#261CC1]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Consultant Audit Logs</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="mt-2">
        
        {/* TAB 1: CLIENTS PROFILE DIRECTORY */}
        {activeTab === "CLIENTS" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: client lists & switcher */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">Workspace Client Directory</h3>
                <p className="text-xs text-slate-500">List of active F&B client portfolios synchronized to AIBISPRO platform.</p>
              </div>

              <div className="space-y-3">
                {companyHealthData.map(({ company: c, healthScore, revenue, status }) => {
                  const isSelected = selectedCompany.id === c.id;
                  const access = consultantAccess[c.id] || { analytics: true, expenses: false };

                  return (
                    <div 
                      key={c.id} 
                      onClick={() => handleSelectWorkspace(c)}
                      className={`p-4 border rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                        isSelected 
                          ? "border-[#261CC1] bg-indigo-50/10 shadow-sm" 
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm shrink-0">{c.avatarUrl}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {c.name}
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#261CC1] animate-ping"></span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{c.type} • {c.branches} Branches</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Score</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-sm font-black font-mono ${
                              status === "EXCELLENT" ? "text-emerald-600" : status === "STABLE" ? "text-amber-500" : "text-rose-600"
                            }`}>{healthScore}/100</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                              status === "EXCELLENT" ? "bg-emerald-50 text-emerald-700" : status === "STABLE" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700 animate-pulse"
                            }`}>{status}</span>
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Scope</p>
                          <div className="flex gap-1 mt-1">
                            <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-mono font-bold rounded uppercase">ANL</span>
                            <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-mono font-bold rounded uppercase">INV</span>
                            <span className={`px-1 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${
                              access.expenses ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                            }`}>EXP</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwitchCompany(c);
                            onChangeView("DASHBOARD");
                            logConsultantAction("IMPERSONATE", c.id, c.name, `Consultant impersonated workspace of ${c.name}`);
                          }}
                          className="bg-[#261CC1] hover:bg-[#1C0770] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer text-center"
                        >
                          Access Workspace
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Monitored Workspace state & sensitive permissions indicators */}
            <div className="space-y-6">
              {/* Client Access State Badge Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 text-indigo-700" />
                  Access Authorizations
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  These authorization bounds are strictly controlled by <span className="font-extrabold text-slate-700">{selectedCompany.name}'s Owner</span>. Access to sensitive financials is restricted by default.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">Analytics & Inventories</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">GRANTED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      {currentAccess.expenses ? (
                        <Unlock className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="text-xs font-bold text-slate-700">Supplier Cost Details</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentAccess.expenses ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"
                    }`}>{currentAccess.expenses ? "GRANTED" : "LOCKED"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      {currentAccess.capital ? (
                        <Unlock className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="text-xs font-bold text-slate-700">Bank Account & Capital</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentAccess.capital ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"
                    }`}>{currentAccess.capital ? "GRANTED" : "LOCKED"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      {currentAccess.employee ? (
                        <Unlock className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="text-xs font-bold text-slate-700">Employee & Crew Rosters</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentAccess.employee ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"
                    }`}>{currentAccess.employee ? "GRANTED" : "LOCKED"}</span>
                  </div>
                </div>
              </div>

              {/* Consultant Task Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <ClipboardList className="w-5 h-5 text-[#261CC1]" />
                    Consultant Task Checklist
                  </h4>
                  <span className="text-[11px] font-mono font-black text-[#261CC1] bg-indigo-50 px-2 py-0.5 rounded-full">
                    {completionPercentage}% Done
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Track and tick off active implementation, auditing, and optimization tasks for client accounts.
                </p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Progress</span>
                    <span>{completedCount} / {todos.length} completed</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-[#261CC1] transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Checklist List */}
                <div className="space-y-2 text-xs pt-2">
                  {todos.map((todo) => (
                    <div 
                      key={todo.id} 
                      onClick={() => toggleTodo(todo.id)}
                      className={`p-3 border rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${
                        todo.completed 
                          ? "bg-slate-50 border-slate-100 text-slate-400 animate-fade-in" 
                          : "bg-white border-slate-200 text-slate-700 hover:border-[#261CC1] hover:bg-slate-50/20"
                      }`}
                    >
                      <button className="focus:outline-none mt-0.5 shrink-0" type="button">
                        {todo.completed ? (
                          <CheckCircle className="w-4 h-4 text-[#261CC1]" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-slate-300 rounded-md hover:border-[#261CC1]"></div>
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-[11px] font-bold leading-tight ${todo.completed ? "line-through text-slate-400 font-medium" : "text-slate-800"}`}>
                          {todo.text}
                        </p>
                        <span className={`text-[8px] font-mono font-black uppercase tracking-wider mt-1 inline-block px-1.5 py-0.5 rounded ${
                          todo.completed 
                            ? "bg-slate-200 text-slate-500" 
                            : "bg-indigo-50 text-indigo-700"
                        }`}>
                          {todo.category.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY HEALTH CENTER (MATRIX VIEW) */}
        {activeTab === "HEALTH_CENTER" && (
          !isMaintenanceAllowed ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-lg">Akses Pemeliharaan & Benchmarking Terkunci</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Owner dari perusahaan <span className="font-bold">{selectedCompany.name}</span> telah membatasi akses ke area pemeliharaan sistem harian, status server, dan integrasi benchmark SaaS.
              </p>
              <div className="p-3 bg-indigo-50 text-[#261CC1] rounded-xl text-xs font-bold inline-block">
                Hubungi Owner untuk mengaktifkan izin "System Maintenance & Industrial Benchmarking" di Owner Dashboard.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">Company Health Center</h3>
                <p className="text-xs text-slate-500">AI monitors and maps essential health parameters for all F&B entities under management.</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Brand / Company</th>
                      <th className="p-4 text-center">Health Score</th>
                      <th className="p-4 text-right">Revenue (30-day)</th>
                    <th className="p-4 text-center">Revenue Growth</th>
                    <th className="p-4 text-center">Gross Margin</th>
                    <th className="p-4 text-center">Inventory Turnover</th>
                    <th className="p-4 text-center">Ingredient Waste</th>
                    <th className="p-4">Recommendation Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {companyHealthData.map((hd) => (
                    <tr key={hd.company.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl bg-slate-100 p-1 rounded">{hd.company.avatarUrl}</span>
                          <div>
                            <p className="font-bold text-slate-800">{hd.company.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">{hd.company.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full font-bold font-mono text-xs ${
                          hd.status === "EXCELLENT" ? "bg-emerald-50 text-emerald-700" : hd.status === "STABLE" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          {hd.healthScore} / 100
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-800 font-bold">
                        {formatValue(hd.revenue)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-mono font-bold flex items-center justify-center gap-1 ${hd.revGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {hd.revGrowth >= 0 ? "+" : ""}{hd.revGrowth}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono">
                        {hd.profitMargin.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center font-mono text-slate-600">
                        {hd.inventoryTurnover}x / mo
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-mono font-bold ${hd.wastePct > 8 ? "text-rose-500" : "text-emerald-600"}`}>
                          {hd.wastePct}%
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#261CC1]">
                        {hd.healthScore >= 80 
                          ? "F&B-OPT-EXC" 
                          : hd.healthScore >= 60 
                            ? "F&B-OPT-STB" 
                            : "F&B-WARN-HIGH-WASTE"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#261CC1] shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-slate-900">AI Consult Center Insights:</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  1 company is flagged under <span className="text-rose-600 font-bold uppercase">"WARNING"</span> due to high food cost and elevated waste percentage (Wagyu Prime Bistro, Waste: 11.8%). Salesforce intervention is recommended to assist in ingredient reorder optimizations.
                </p>
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB 3: BENCHMARK CENTER */}
        {activeTab === "BENCHMARK" && (
          !isMaintenanceAllowed ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-lg">Akses Pemeliharaan & Benchmarking Terkunci</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Owner dari perusahaan <span className="font-bold">{selectedCompany.name}</span> telah membatasi akses ke area pemeliharaan sistem harian, status server, dan integrasi benchmark SaaS.
              </p>
              <div className="p-3 bg-indigo-50 text-[#261CC1] rounded-xl text-xs font-bold inline-block">
                Hubungi Owner untuk mengaktifkan izin "System Maintenance & Industrial Benchmarking" di Owner Dashboard.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">SaaS F&B Industrial Benchmark Center</h3>
                <p className="text-xs text-slate-500">Compares client operations with standardized F&B averages in Southeast Asia.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-slate-400 font-bold">Select portfolio focus:</span>
                <span className="text-xs font-black text-[#261CC1]">{selectedCompany.avatarUrl} {selectedCompany.name}</span>
              </div>
            </div>

            {/* Benchmark Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Benchmark Item 1: Food Cost */}
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Food / Raw Cost Ratio</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Our Client Rate:</span>
                    <span className="font-mono font-bold text-slate-950">{selectedCompany.id === "xyz_restaurant" ? "38.2%" : "31.5%"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">F&B Industry Average:</span>
                    <span className="font-mono font-bold text-slate-400">31.0%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      selectedCompany.id === "xyz_restaurant" ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: selectedCompany.id === "xyz_restaurant" ? "88%" : "70%" }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  {selectedCompany.id === "xyz_restaurant" 
                    ? "⚠️ Food Cost is 7.2% higher than industry benchmarks. Recommend ingredient supplier renegotiation." 
                    : "✅ Cost of raw materials aligns perfectly with the optimal F&B profile."}
                </p>
              </div>

              {/* Benchmark Item 2: Waste Percentage */}
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Ingredient Waste Ratio</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Our Client Rate:</span>
                    <span className="font-mono font-bold text-slate-950">{activeHealth.wastePct}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">F&B Industry Average:</span>
                    <span className="font-mono font-bold text-slate-400">5.0%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      activeHealth.wastePct > 8 ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(activeHealth.wastePct / 15) * 100}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  {activeHealth.wastePct > 8 
                    ? "⚠️ Waste percentage exceeds the healthy threshold of 5%. Recommend portion resizing or AI demand forecasting adjustment." 
                    : "✅ Excellent waste management! Operating within highly acceptable boundaries."}
                </p>
              </div>

              {/* Benchmark Item 3: Profit Margins */}
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Operating Profit Margin</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Our Client Rate:</span>
                    <span className="font-mono font-bold text-slate-950">{activeHealth.profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">F&B Industry Average:</span>
                    <span className="font-mono font-bold text-slate-400">20.0%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(activeHealth.profitMargin / 35) * 100}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  Operating profit margin is strong, demonstrating sound business core and optimized retail pricing strategies.
                </p>
              </div>
            </div>

            {/* SENSITIVE DATA AUTHORIZATION AREA */}
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-700" />
                Sensitive Supplier Costs & Accounts Analysis (Owner Authorization Scope)
              </h4>
              
              {!currentAccess.expenses ? (
                <div className="p-6 bg-white border border-rose-100 rounded-xl text-center space-y-3 shadow-inner">
                  <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-800">Sensitive Financial Stream is Locked</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    The Business Owner of <span className="font-bold">{selectedCompany.name}</span> has restricted access to sensitive expenses. Salesforce cannot see raw supplier contact numbers, detailed cost ledger values, or banking channels.
                  </p>
                  <p className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                    Enable 'Consultant Access Settings' inside Owner dashboard to unlock.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <span>Access Authorized by Owner: Supplier Contract costs unlocked for CRM audit.</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold">Coffee Bean Supplier</p>
                      <p className="font-bold text-slate-800 mt-1">Sumatra Arabica Corp</p>
                      <p className="text-[10px] text-[#261CC1] mt-0.5">Rate: IDR 115.000 / kg (Standard)</p>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold">Dairy Vendor</p>
                      <p className="font-bold text-slate-800 mt-1">Greenfields Dairy Ind</p>
                      <p className="text-[10px] text-[#261CC1] mt-0.5">Rate: IDR 18.500 / Liter</p>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold">Packaging Logistics</p>
                      <p className="font-bold text-slate-800 mt-1">Sentosa Paper Pack</p>
                      <p className="text-[10px] text-[#261CC1] mt-0.5">Rate: IDR 850 / Cup</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )
        )}

        {/* TAB 4: DATASET MONITORING CENTER */}
        {activeTab === "DATA_MONITOR" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-base">Dataset Monitoring Center</h3>
              <p className="text-xs text-slate-500">Monitor CSV/XLSX uploads and quality of business data submitted by Operations Managers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Data quality card */}
              <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center gap-4">
                <FileSpreadsheet className="w-10 h-10 text-indigo-700 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">AIBISPRO Database Sync</p>
                  <p className="text-lg font-black text-slate-800 font-mono mt-0.5">98.5% ACCURATE</p>
                  <span className="text-[10px] font-bold text-emerald-600">No empty files or headers missing</span>
                </div>
              </div>

              {/* Weekly upload schedule status */}
              <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center gap-4">
                <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Routinely Uploaded</p>
                  <p className="text-lg font-black text-slate-800 font-mono mt-0.5">EVERY 3 DAYS</p>
                  <span className="text-[10px] font-bold text-slate-500">Scheduled CSV streams active</span>
                </div>
              </div>

              {/* Data Loss Warnings */}
              <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center gap-4">
                <ShieldAlert className="w-10 h-10 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Missing Values / Gaps</p>
                  <p className="text-lg font-black text-emerald-600 font-mono mt-0.5">0 RECORDS GAP</p>
                  <span className="text-[10px] font-bold text-emerald-600">AI prediction results optimized</span>
                </div>
              </div>
            </div>

            {/* Simulated CSV Upload Log history for the chosen client */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase text-slate-700 tracking-wider">Historical Dataset Submissions ({selectedCompany.name})</p>
              
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-slate-50/20 overflow-hidden text-xs">
                <div className="p-3.5 bg-slate-50 grid grid-cols-1 md:grid-cols-4 font-bold text-slate-500 uppercase text-[10px]">
                  <span>Filename / Data stream</span>
                  <span>Payload Type</span>
                  <span>Records count</span>
                  <span className="text-right">Upload timestamp</span>
                </div>

                <div className="p-3.5 grid grid-cols-1 md:grid-cols-4 items-center">
                  <span className="font-bold text-[#261CC1] truncate">abc_coffee_beans_inventory_june.csv</span>
                  <span className="text-slate-600">Inventory Stream</span>
                  <span className="font-mono text-slate-800">45 records</span>
                  <span className="text-right text-slate-400 font-mono">2026-06-25 10:14</span>
                </div>

                <div className="p-3.5 grid grid-cols-1 md:grid-cols-4 items-center">
                  <span className="font-bold text-[#261CC1] truncate">weekly_sales_recap_abc.xlsx</span>
                  <span className="text-slate-600">Sales Ledger Stream</span>
                  <span className="font-mono text-slate-800">120 records</span>
                  <span className="text-right text-slate-400 font-mono">2026-06-24 18:30</span>
                </div>

                <div className="p-3.5 grid grid-cols-1 md:grid-cols-4 items-center">
                  <span className="font-bold text-[#261CC1] truncate">promo_pricing_draft_q2.csv</span>
                  <span className="text-slate-600">Pricing Ledger</span>
                  <span className="font-mono text-slate-800">12 records</span>
                  <span className="text-right text-slate-400 font-mono">2026-06-16 11:22</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI FORECAST CONSULT HUB */}
        {activeTab === "AI_HUB" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">Salesforce AI Consult Forecast Hub</h3>
                <p className="text-xs text-slate-500">Access and prepare analytical recommendation logs for client consultation meetings.</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-[#261CC1] font-mono text-xs font-bold rounded-xl">AI-CONSULTANT v3.5-Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Forecast 1 */}
              <div className="p-5 border border-indigo-100 bg-indigo-50/10 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-indigo-100 text-[#261CC1] font-mono">Demand Prediction</span>
                  <span className="text-xs text-slate-400 font-bold">Reliability: 94%</span>
                </div>
                <h4 className="text-sm font-black text-slate-800">Menu Restock triggers: Sumatra Arabica Beans</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Historical weekend transactions show a +18.4% rise in dairy and espresso drink sales. Coffee roasters must place restock logs with Sumatra Arabica vendors to satisfy the peak weekend capacity.
                </p>
                <div className="pt-2 border-t border-slate-200/50 flex justify-between text-[11px] font-bold text-indigo-700">
                  <span>Action: Restock log recommendation</span>
                  <span>AIBISPRO Recommendation</span>
                </div>
              </div>

              {/* Forecast 2 */}
              <div className="p-5 border border-indigo-100 bg-indigo-50/10 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-indigo-100 text-[#261CC1] font-mono">Promo Campaign ROI</span>
                  <span className="text-xs text-slate-400 font-bold">Reliability: 89%</span>
                </div>
                <h4 className="text-sm font-black text-slate-800">Bundle Package Pricing strategy: Croissant Combo</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Combining Iced Palm Sugar Latte and Croissant at an aggregate rate yields +22% gross cash velocities compared to single item transactions. Recommending owner launches this combo as standard menu listing.
                </p>
                <div className="pt-2 border-t border-slate-200/50 flex justify-between text-[11px] font-bold text-indigo-700">
                  <span>Action: Publish Bundle menu</span>
                  <span>AIBISPRO Recommendation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONSULTANT AUDIT LOGS */}
        {activeTab === "AUDIT_LOG" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">Consultant Compliance Audit Logs</h3>
                <p className="text-xs text-slate-500">Permanent record of all Salesforce consultant impersonation, switching, and data access.</p>
              </div>
              <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-lg">SECURE STORAGE ACTIVATED</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-center text-slate-400 py-10 font-semibold text-xs">No entries recorded in audit log yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex justify-between items-start text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-bold uppercase ${
                          log.action === "INITIAL_SYNC" ? "bg-slate-100 text-slate-600" : log.action === "WORKSPACE_SWITCH" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                        }`}>{log.action}</span>
                        <span className="font-bold text-slate-800">{log.companyName}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{log.details}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                      <p>{log.timestamp}</p>
                      <p className="text-[8px] mt-0.5 font-bold">{log.id}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
