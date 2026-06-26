/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Company, User, Currency, Product, FinancialMetric, Promotion, Bundle, RevenueForecast, AiInsight, Event, Expense, Notification, InventoryLog, ChatbotLog, Sale } from "./types";
import {
  PRESET_COMPANIES,
  getInitialFinancialMetrics,
  getInitialProducts,
  getInitialPromotions,
  getInitialBundles,
  getInitialForecasts,
  getInitialInsights,
  getInitialEvents,
  getInitialExpenses,
  getInitialNotifications,
  getInitialInventoryLogs,
  getInitialChatbotLogs,
} from "./mockData";

// Modular UI Views
import Login from "./components/Login";
import CompanySelection from "./components/CompanySelection";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Dashboards
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";

// Module views
import FinancialIntelligence from "./components/FinancialIntelligence";
import AiAssistant from "./components/AiAssistant";
import AccountSettings from "./components/AccountSettings";

// Lucide Icons
import {
  Bell,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Bot,
  MessageCircle,
  MessageSquare,
  Smile
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  // Authentication & Workspace States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState<Currency>("IDR");
  const [activeView, setActiveView] = useState<string>("DASHBOARD");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Business Intelligence Databases (Loaded from storage or initial mocks)
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [forecasts, setForecasts] = useState<RevenueForecast[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [chatbotLogs, setChatbotLogs] = useState<ChatbotLog[]>([]);

  // AI assistant network states
  const [isAiSending, setIsAiSending] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  // 1. Initial Load from LocalStorage or fall back to preset values
  useEffect(() => {
    // Authenticate user from session state if any
    const storedUser = localStorage.getItem("aibispro_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    const storedCompany = localStorage.getItem("aibispro_company");
    if (storedCompany) {
      setCurrentCompany(JSON.parse(storedCompany));
    }

    const storedCurrency = localStorage.getItem("aibispro_currency");
    if (storedCurrency) {
      setCurrentCurrency(storedCurrency as Currency);
    }

    // Load transactional states or seed them
    const p = localStorage.getItem("aibispro_products");
    if (p) setProducts(JSON.parse(p));
    else setProducts(getInitialProducts());

    const m = localStorage.getItem("aibispro_metrics");
    if (m) setMetrics(JSON.parse(m));
    else setMetrics(getInitialFinancialMetrics());

    const pr = localStorage.getItem("aibispro_promotions");
    if (pr) setPromotions(JSON.parse(pr));
    else setPromotions(getInitialPromotions());

    const b = localStorage.getItem("aibispro_bundles");
    if (b) setBundles(JSON.parse(b));
    else setBundles(getInitialBundles());

    const fc = localStorage.getItem("aibispro_forecasts");
    if (fc) setForecasts(JSON.parse(fc));
    else setForecasts(getInitialForecasts());

    const ins = localStorage.getItem("aibispro_insights");
    if (ins) setInsights(JSON.parse(ins));
    else setInsights(getInitialInsights());

    const ev = localStorage.getItem("aibispro_events");
    if (ev) setEvents(JSON.parse(ev));
    else setEvents(getInitialEvents());

    const ex = localStorage.getItem("aibispro_expenses");
    if (ex) setExpenses(JSON.parse(ex));
    else setExpenses(getInitialExpenses());

    const not = localStorage.getItem("aibispro_notifications");
    if (not) setNotifications(JSON.parse(not));
    else setNotifications(getInitialNotifications());

    const inv = localStorage.getItem("aibispro_inventory_logs");
    if (inv) setInventoryLogs(JSON.parse(inv));
    else setInventoryLogs(getInitialInventoryLogs());

    const chat = localStorage.getItem("aibispro_chatbot_logs");
    if (chat) setChatbotLogs(JSON.parse(chat));
    else setChatbotLogs(getInitialChatbotLogs());
  }, []);

  // 2. Synchronization of state changes to LocalStorage and server proxy
  useEffect(() => {
    if (products.length > 0) localStorage.setItem("aibispro_products", JSON.stringify(products));
    if (metrics.length > 0) localStorage.setItem("aibispro_metrics", JSON.stringify(metrics));
    if (promotions.length > 0) localStorage.setItem("aibispro_promotions", JSON.stringify(promotions));
    if (bundles.length > 0) localStorage.setItem("aibispro_bundles", JSON.stringify(bundles));
    if (forecasts.length > 0) localStorage.setItem("aibispro_forecasts", JSON.stringify(forecasts));
    if (insights.length > 0) localStorage.setItem("aibispro_insights", JSON.stringify(insights));
    if (events.length > 0) localStorage.setItem("aibispro_events", JSON.stringify(events));
    if (expenses.length > 0) localStorage.setItem("aibispro_expenses", JSON.stringify(expenses));
    if (notifications.length > 0) localStorage.setItem("aibispro_notifications", JSON.stringify(notifications));
    if (inventoryLogs.length > 0) localStorage.setItem("aibispro_inventory_logs", JSON.stringify(inventoryLogs));
    if (chatbotLogs.length > 0) localStorage.setItem("aibispro_chatbot_logs", JSON.stringify(chatbotLogs));

    // Send complete database sync packet to Express backend so it remains fully persistent
    if (products.length > 0) {
      fetch("/api/data/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          metrics,
          promotions,
          inventoryLogs,
          chatbotLogs,
        }),
      }).catch((e) => console.log("State sync warning:", e));
    }
  }, [products, metrics, promotions, bundles, forecasts, insights, events, expenses, notifications, inventoryLogs, chatbotLogs]);

  // Auth helper callbacks
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("aibispro_user", JSON.stringify(user));

    // Default routing based on role
    if (user.role === "SUPER_ADMIN") {
      setActiveView("SUPER_ADMIN");
    } else if (user.role === "OWNER") {
      setActiveView("DASHBOARD");
    } else if (user.role === "MANAGER") {
      setActiveView("MANAGER_DASHBOARD");
    } else if (user.role === "ADMIN") {
      setActiveView("ADMIN_DASHBOARD");
    }

    // Auto-select company if they have only one assigned
    if (user.role !== "SUPER_ADMIN" && user.assignedCompanies.length === 1) {
      const singleId = user.assignedCompanies[0];
      const found = PRESET_COMPANIES.find((c) => c.id === singleId);
      if (found) {
        handleSelectCompany(found);
      }
    }
  };

  const handleSelectCompany = (company: Company) => {
    setCurrentCompany(company);
    localStorage.setItem("aibispro_company", JSON.stringify(company));

    // Set view appropriately if owner or manager
    if (currentUser?.role === "OWNER") {
      setActiveView("DASHBOARD");
    } else if (currentUser?.role === "MANAGER") {
      setActiveView("MANAGER_DASHBOARD");
    } else if (currentUser?.role === "ADMIN") {
      setActiveView("ADMIN_DASHBOARD");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentCompany(null);
    localStorage.removeItem("aibispro_user");
    localStorage.removeItem("aibispro_company");
  };

  const handleSwitchCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem("aibispro_currency", currency);
  };

  // Live Operations Callbacks:
  // Add a new product to active catalog
  const handleAddProduct = (newP: Omit<Product, "id" | "companyId" | "salesCount" | "status">) => {
    if (!currentCompany) return;

    const prodId = `${currentCompany.id}_p_${Date.now()}`;
    const productRecord: Product = {
      ...newP,
      id: prodId,
      companyId: currentCompany.id,
      salesCount: 0,
      status: newP.stock === 0 ? "OUT_OF_STOCK" : newP.stock <= newP.minStock ? "LOW_STOCK" : "IN_STOCK",
    };

    setProducts((prev) => [productRecord, ...prev]);

    // Create system log notification
    const logNot: Notification = {
      id: `not_${Date.now()}`,
      companyId: currentCompany.id,
      title: "New Product Cataloged",
      message: `Operational Admin registered "${newP.name}" with initial stock of ${newP.stock}.`,
      type: "INFO",
      read: false,
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications((prev) => [logNot, ...prev]);
  };

  // Register a sales transaction (interactive checkout)
  const handleRegisterSale = (newSale: Omit<Sale, "id" | "companyId" | "date">) => {
    if (!currentCompany) return;

    const saleId = `${currentCompany.id}_sale_${Date.now()}`;
    const dateStr = new Date().toISOString().split("T")[0];

    const saleRecord: Sale = {
      ...newSale,
      id: saleId,
      companyId: currentCompany.id,
      date: dateStr,
    };

    // Update product stock counts and sales metrics in state
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => {
        const checkedItem = newSale.items.find((item) => item.productId === p.id);
        if (checkedItem) {
          const newStock = Math.max(0, p.stock - checkedItem.quantity);
          const newStatus = newStock === 0 ? "OUT_OF_STOCK" : newStock <= p.minStock ? "LOW_STOCK" : "IN_STOCK";

          // If stock falls below min level, trigger a pending manager reorder log and system warning!
          if (newStock <= p.minStock && p.stock > p.minStock) {
            triggerAutomatedReorderLog(p, p.minStock * 4);
          }

          return {
            ...p,
            stock: newStock,
            salesCount: p.salesCount + checkedItem.quantity,
            status: newStatus as any,
          };
        }
        return p;
      });
      return updated;
    });

    // Update active financial metrics for today's date
    setMetrics((prevMetrics) => {
      // Find today's metric for this company
      const idx = prevMetrics.findIndex((m) => m.companyId === currentCompany.id && m.date === dateStr);
      if (idx > -1) {
        const updated = [...prevMetrics];
        updated[idx].revenue += newSale.totalAmount;
        updated[idx].cogs += newSale.items.reduce((sum, item) => sum + item.cogs * item.quantity, 0);
        updated[idx].profit = updated[idx].revenue - updated[idx].cogs - updated[idx].expenses;
        return updated;
      }
      return prevMetrics;
    });

    // Generate Success Notification
    const saleNot: Notification = {
      id: `not_${Date.now()}`,
      companyId: currentCompany.id,
      title: "New Sale Processed",
      message: `Branch transaction of ${newSale.items.length} items completed. Total: Rp ${newSale.totalAmount.toLocaleString()}`,
      type: "SUCCESS",
      read: false,
      date: dateStr,
    };
    setNotifications((prev) => [saleNot, ...prev]);
  };

  const triggerAutomatedReorderLog = (p: Product, reorderQty: number) => {
    if (!currentCompany) return;

    // Insert pending manager approval restock log
    const logId = `inv_log_${Date.now()}`;
    const restockLog: InventoryLog = {
      id: logId,
      companyId: currentCompany.id,
      productId: p.id,
      productName: p.name,
      type: "IN",
      quantity: reorderQty,
      date: new Date().toISOString().split("T")[0],
      notes: `Automated reorder triggered. Current stock (${p.stock}) is below safety threshold (${p.minStock}).`,
      status: "PENDING_APPROVAL",
    };

    setInventoryLogs((prev) => [restockLog, ...prev]);

    // Create system low-stock notification
    const lowStockNot: Notification = {
      id: `not_low_${Date.now()}`,
      companyId: currentCompany.id,
      title: "Low Stock Alert",
      message: `"${p.name}" has breached safety margins (${p.stock} left). Pending restocking request created.`,
      type: "ALERT",
      read: false,
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications((prev) => [lowStockNot, ...prev]);
  };

  // Setup a new drafted promotion code
  const handleAddPromotion = (newPromo: Omit<Promotion, "id" | "companyId" | "conversionRate" | "revenueGenerated">) => {
    if (!currentCompany) return;

    const promoId = `promo_${Date.now()}`;
    const promoRecord: Promotion = {
      ...newPromo,
      id: promoId,
      companyId: currentCompany.id,
      conversionRate: 0,
      revenueGenerated: 0,
    };

    setPromotions((prev) => [promoRecord, ...prev]);

    // System notification
    const promoNot: Notification = {
      id: `not_p_${Date.now()}`,
      companyId: currentCompany.id,
      title: "Promotion Proposed",
      message: `Admin drafted promotion "${newPromo.name}" for Manager authorization.`,
      type: "INFO",
      read: false,
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications((prev) => [promoNot, ...prev]);
  };

  // Manager authorizes raw material restocking logs
  const handleApproveInventoryLog = (logId: string) => {
    if (!currentCompany) return;

    const targetLog = inventoryLogs.find((l) => l.id === logId);
    if (!targetLog) return;

    // Set log status to approved
    setInventoryLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: "APPROVED", approvedBy: currentUser?.name || "Manager" } : l))
    );

    // Increase product stock count
    setProducts((prevProds) =>
      prevProds.map((p) => {
        if (p.id === targetLog.productId) {
          const updatedStock = p.stock + targetLog.quantity;
          return {
            ...p,
            stock: updatedStock,
            status: updatedStock === 0 ? "OUT_OF_STOCK" : updatedStock <= p.minStock ? "LOW_STOCK" : "IN_STOCK",
          };
        }
        return p;
      })
    );

    // Log success alert
    const appNot: Notification = {
      id: `not_app_${Date.now()}`,
      companyId: currentCompany.id,
      title: "Restock Order Approved",
      message: `Restocking of ${targetLog.quantity} units for "${targetLog.productName}" authorized and added to inventory.`,
      type: "SUCCESS",
      read: false,
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications((prev) => [appNot, ...prev]);
  };

  const handleRejectInventoryLog = (logId: string) => {
    setInventoryLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, status: "COMPLETED", notes: "REJECTED BY MANAGER" } : l)));
  };

  // Manager authorizes marketing campaign promotions
  const handleApprovePromotion = (promoId: string) => {
    if (!currentCompany) return;

    setPromotions((prev) =>
      prev.map((p) => (p.id === promoId ? { ...p, status: "ACTIVE", conversionRate: 15.4, revenueGenerated: 84000000 } : p))
    );

    const appNot: Notification = {
      id: `not_promo_app_${Date.now()}`,
      companyId: currentCompany.id,
      title: "Campaign Approved",
      message: `Drafted marketing promotion was approved and is now active across all branches.`,
      type: "SUCCESS",
      read: false,
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications((prev) => [appNot, ...prev]);
  };

  const handleRejectPromotion = (promoId: string, reason: string) => {
    if (!currentCompany) return;

    setPromotions((prev) =>
      prev.map((p) => (p.id === promoId ? { ...p, status: "REJECTED", rejectReason: reason } : p))
    );

    const rejNot: Notification = {
      id: `not_promo_rej_${Date.now()}`,
      companyId: currentCompany.id,
      title: "Campaign Rejected",
      message: `Promotion proposal was rejected by Owner. Reason: ${reason}`,
      type: "ALERT",
      read: false,
      date: new Date().toISOString().split("T")[0],
    };
    setNotifications((prev) => [rejNot, ...prev]);
  };

  // AI Assistant Chat submit handler
  const handleSendAiMessage = async (msg: string) => {
    if (!currentCompany || isAiSending) return;

    const userLog: ChatbotLog = {
      id: `chat_${Date.now()}`,
      companyId: currentCompany.id,
      sender: "USER",
      message: msg,
      timestamp: new Date().toISOString(),
    };

    setChatbotLogs((prev) => [...prev, userLog]);
    setIsAiSending(true);

    try {
      // Collect current context data for the selected company
      const companyProducts = products.filter((p) => p.companyId === currentCompany.id);
      const companyMetrics = metrics.filter((m) => m.companyId === currentCompany.id);
      const companyForecast = forecasts.find((f) => f.companyId === currentCompany.id);
      const companyPromotions = promotions.filter((p) => p.companyId === currentCompany.id);
      const lowStockCount = companyProducts.filter((p) => p.status === "LOW_STOCK").length;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: chatbotLogs.filter((l) => l.companyId === currentCompany.id).slice(-10), // pass sliding window history
          company: currentCompany,
          currency: currentCurrency,
          contextData: {
            products: companyProducts.slice(0, 8),
            metrics: companyMetrics,
            forecasts: companyForecast,
            promotions: companyPromotions,
            lowStockCount,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiLog: ChatbotLog = {
        id: `chat_ai_${Date.now()}`,
        companyId: currentCompany.id,
        sender: "AI",
        message: data.message || "⚠️ **System Response Warning**\n\nI was unable to retrieve a response. Please try sending your prompt again.",
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setChatbotLogs((prev) => [...prev, aiLog]);

    } catch (err: any) {
      console.error("AI Assistant network error:", err);
      const errLog: ChatbotLog = {
        id: `chat_ai_err_${Date.now()}`,
        companyId: currentCompany.id,
        sender: "AI",
        message: "⚠️ **Operational Link Interrupted**\n\nI was unable to connect to the AIBISPRO secure server node. Please verify your internet connection or reload the application tab.",
        timestamp: new Date().toISOString(),
      };
      setChatbotLogs((prev) => [...prev, errLog]);
    } finally {
      setIsAiSending(false);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentCompany) return;
    setNotifications((prev) => prev.map((n) => (n.companyId === currentCompany.id ? { ...n, read: true } : n)));
  };

  // Helper counts
  const currentCompanyProducts = currentCompany ? products.filter((p) => p.companyId === currentCompany.id) : [];
  const lowStockCount = currentCompanyProducts.filter((p) => p.status === "LOW_STOCK").length;
  const pendingApprovalsCount = currentCompany
    ? inventoryLogs.filter((l) => l.companyId === currentCompany.id && l.status === "PENDING_APPROVAL").length
    : 0;

  const currentCompanyNotifications = currentCompany ? notifications.filter((n) => n.companyId === currentCompany.id) : [];
  const unreadNotificationCount = currentCompanyNotifications.filter((n) => !n.read).length;

  const activeForecast = currentCompany ? forecasts.find((f) => f.companyId === currentCompany.id) : undefined;
  const activeInsights = currentCompany ? insights.filter((i) => i.companyId === currentCompany.id) : [];

  // Routing View render logic
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (!currentCompany && currentUser.role !== "SUPER_ADMIN") {
    return (
      <CompanySelection
        currentUser={currentUser}
        onSelectCompany={handleSelectCompany}
        onLogout={handleLogout}
      />
    );
  }

  if (currentUser.role === "CUSTOMER") {
    return (
      <CustomerDashboard
        companies={PRESET_COMPANIES}
        products={products}
        promotions={promotions}
        currency={currentCurrency}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex bg-[#F7F9FC] min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onChangeView={(view) => {
          if (view === "AI_ASSISTANT") {
            setShowFloatingChat(true);
          } else {
            setActiveView(view);
          }
        }}
        lowStockCount={lowStockCount}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentCompany={currentCompany || PRESET_COMPANIES[0]}
          currentUser={currentUser}
          currentCurrency={currentCurrency}
          onSwitchCompany={handleSelectCompany}
          onSwitchCurrency={handleSwitchCurrency}
          onLogout={handleLogout}
          unreadNotificationCount={unreadNotificationCount}
          onToggleNotificationDrawer={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
        />

        {/* Dynamic Workspace Panel Content */}
        <main className="p-6 flex-1 overflow-y-auto">
          {activeView === "SUPER_ADMIN" && currentUser.role === "SUPER_ADMIN" && (
            <SuperAdminDashboard
              companies={PRESET_COMPANIES}
              metrics={metrics}
              currency={currentCurrency}
              onSwitchCompany={handleSelectCompany}
              onChangeView={setActiveView}
            />
          )}

          {activeView === "DASHBOARD" && currentCompany && (
            <ExecutiveDashboard
              company={currentCompany}
              metrics={metrics.filter((m) => m.companyId === currentCompany.id)}
              products={currentCompanyProducts}
              promotions={promotions.filter((p) => p.companyId === currentCompany.id)}
              forecast={activeForecast}
              currency={currentCurrency}
              onChangeView={setActiveView}
              onApprovePromotion={handleApprovePromotion}
              onRejectPromotion={handleRejectPromotion}
            />
          )}

          {activeView === "MANAGER_DASHBOARD" && currentCompany && (
            <ManagerDashboard
              company={currentCompany}
              products={products}
              inventoryLogs={inventoryLogs}
              promotions={promotions}
              currency={currentCurrency}
              onApproveInventoryLog={handleApproveInventoryLog}
              onRejectInventoryLog={handleRejectInventoryLog}
              onApprovePromotion={handleApprovePromotion}
            />
          )}

          {activeView === "ADMIN_DASHBOARD" && currentCompany && (
            <AdminDashboard
              company={currentCompany}
              products={products}
              promotions={promotions}
              currency={currentCurrency}
              onAddProduct={handleAddProduct}
              onRegisterSale={handleRegisterSale}
              onAddPromotion={handleAddPromotion}
            />
          )}

          {activeView === "FINANCIAL_INTELLIGENCE" && currentCompany && (
            <FinancialIntelligence
              company={currentCompany}
              metrics={metrics}
              products={currentCompanyProducts}
              promotions={promotions}
              currency={currentCurrency}
            />
          )}

          {activeView === "OPERATIONS" && currentCompany && (
            <ManagerDashboard
              company={currentCompany}
              products={products}
              inventoryLogs={inventoryLogs}
              promotions={promotions}
              currency={currentCurrency}
              onApproveInventoryLog={handleApproveInventoryLog}
              onRejectInventoryLog={handleRejectInventoryLog}
              onApprovePromotion={handleApprovePromotion}
            />
          )}

          {activeView === "PRODUCTS" && currentCompany && (
            <AdminDashboard
              company={currentCompany}
              products={products}
              promotions={promotions}
              currency={currentCurrency}
              onAddProduct={handleAddProduct}
              onRegisterSale={handleRegisterSale}
              onAddPromotion={handleAddPromotion}
            />
          )}

          {activeView === "AI_ASSISTANT" && currentCompany && (
            <AiAssistant
              company={currentCompany}
              chatbotLogs={chatbotLogs}
              products={currentCompanyProducts}
              metrics={metrics}
              promotions={promotions.filter((p) => p.companyId === currentCompany.id)}
              forecast={activeForecast}
              currency={currentCurrency}
              onSendMessage={handleSendAiMessage}
              isSending={isAiSending}
            />
          )}

          {activeView === "ACCOUNT_SETTINGS" && currentUser && (
            <AccountSettings
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              companies={PRESET_COMPANIES}
            />
          )}
        </main>
      </div>

      {/* Notifications Drawer (Side Overlay) */}
      {showNotificationsDrawer && currentCompany && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowNotificationsDrawer(false)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#E14434]" />
                <h3 className="font-display font-extrabold text-slate-800 text-sm">Workspace Alerts & logs</h3>
              </div>
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentCompanyNotifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-medium italic">No active ledger warnings or notifications.</p>
              ) : (
                currentCompanyNotifications.map((n) => (
                  <div key={n.id} className={`p-3 border rounded-xl relative group ${
                    n.type === "ALERT" ? "bg-red-50 border-red-100" : n.type === "SUCCESS" ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"
                  }`}>
                    <button
                      onClick={() => handleDismissNotification(n.id)}
                      className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex items-start gap-2 pr-4">
                      {n.type === "ALERT" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                      {n.type === "SUCCESS" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      {n.type === "INFO" && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                      
                      <div>
                        <p className={`text-xs font-bold ${
                          n.type === "ALERT" ? "text-red-800" : n.type === "SUCCESS" ? "text-emerald-800" : "text-blue-800"
                        }`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 block font-mono">{n.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between shrink-0">
              <button
                onClick={handleMarkAllNotificationsRead}
                className="text-xs font-bold text-[#5EABD6] hover:underline cursor-pointer"
              >
                Mark all read
              </button>
              <button
                onClick={() => setNotifications([])}
                className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer"
              >
                Clear all logs
              </button>
            </div>
          </div>
        </>
      )}

      {/* Global Floating AI Advisor Widget */}
      {currentUser && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Chat Window Popup Container */}
          {showFloatingChat && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mb-4 w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <AiAssistant
                company={currentCompany || PRESET_COMPANIES[0]}
                chatbotLogs={chatbotLogs}
                products={currentCompanyProducts}
                metrics={metrics}
                promotions={promotions.filter((p) => p.companyId === (currentCompany?.id || PRESET_COMPANIES[0].id))}
                forecast={activeForecast}
                currency={currentCurrency}
                onSendMessage={handleSendAiMessage}
                isSending={isAiSending}
                isFloating={true}
                onClose={() => setShowFloatingChat(false)}
              />
            </motion.div>
          )}

          {/* Glowing FAB Button */}
          <button
            onClick={() => setShowFloatingChat(!showFloatingChat)}
            id="floating-ai-button"
            className="w-14 h-14 bg-gradient-to-br from-[#5EABD6] via-[#FFB4B4] to-[#E14434] text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white/60 transition-all cursor-pointer group hover:scale-110 active:scale-95 relative overflow-visible"
            title="Ask AIBISPRO AI Advisor"
          >
            {/* Status indicator badge */}
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse z-10 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
            
            {showFloatingChat ? (
              <X className="w-6 h-6 text-white transition-transform duration-300" />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Micro rabbit/chibi ears sticking out of the button */}
                <span className="absolute -top-1.5 left-2.5 w-3.5 h-3.5 bg-[#FFB4B4] rounded-full border border-white transition-transform group-hover:scale-110"></span>
                <span className="absolute -top-1.5 right-2.5 w-3.5 h-3.5 bg-[#FFB4B4] rounded-full border border-white transition-transform group-hover:scale-110"></span>
                {/* Blushing cheeks on the button itself */}
                <span className="absolute bottom-3 left-2 w-2.5 h-1 bg-white/40 rounded-full"></span>
                <span className="absolute bottom-3 right-2 w-2.5 h-1 bg-white/40 rounded-full"></span>
                <Smile className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
