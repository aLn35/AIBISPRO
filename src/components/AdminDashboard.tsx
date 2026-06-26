/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Company, Product, Sale, Promotion, Currency } from "../types";
import { EXCHANGE_RATE } from "../mockData";
import {
  PlusCircle,
  ShoppingBag,
  Coins,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarDays,
  FileSpreadsheet,
} from "lucide-react";

interface AdminDashboardProps {
  company: Company;
  products: Product[];
  promotions: Promotion[];
  currency: Currency;
  onAddProduct: (product: Omit<Product, "id" | "companyId" | "salesCount" | "status">) => void;
  onRegisterSale: (sale: Omit<Sale, "id" | "companyId" | "date">) => void;
  onAddPromotion: (promo: Omit<Promotion, "id" | "companyId" | "conversionRate" | "revenueGenerated">) => void;
}

export default function AdminDashboard({
  company,
  products,
  promotions,
  currency,
  onAddProduct,
  onRegisterSale,
  onAddPromotion,
}: AdminDashboardProps) {

  // Filter products for company
  const companyProducts = products.filter((p) => p.companyId === company.id);

  // States for adding a new product
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Coffee");
  const [pPrice, setPPrice] = useState("");
  const [pCogs, setPCogs] = useState("");
  const [pStock, setPStock] = useState("");
  const [pMinStock, setPMinStock] = useState("");
  const [pSuccessMsg, setPSuccessMsg] = useState("");

  // States for registering a sale
  const [saleItems, setSaleItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [payMethod, setPayMethod] = useState("Cash");
  const [saleSuccessMsg, setSaleSuccessMsg] = useState("");

  // Campaign templates for selection
  const CAMPAIGN_TEMPLATES = [
    {
      name: "Coffee Morning Rush Booster",
      type: "DISCOUNT" as const,
      discountPercent: 15,
      description: "15% off espresso-based drinks from 7:00 AM to 10:00 AM to stimulate early-day transactions.",
    },
    {
      name: "Afternoon Sweet Tooth Combo",
      type: "BUNDLE" as const,
      discountPercent: 20,
      description: "Special dessert paired with black coffee to elevate high-margin snack sales between lunch and dinner.",
    },
    {
      name: "Rainy Day Warm-up Deal",
      type: "DISCOUNT" as const,
      discountPercent: 10,
      description: "10% rainy-weather discount on warm meals and beverages to attract customers when foot traffic drops.",
    },
    {
      name: "Sunday Family Feast Platter",
      type: "BUY_1_GET_1" as const,
      discountPercent: 50,
      description: "Buy 1 Get 1 free on selected main courses to drive large group family diners on weekends.",
    }
  ];

  // States for proposing a promo
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<string>("custom");
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState<"DISCOUNT" | "BUNDLE" | "BUY_1_GET_1">("DISCOUNT");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoSuccessMsg, setPromoSuccessMsg] = useState("");

  const handleTemplateChange = (val: string) => {
    setSelectedTemplateIndex(val);
    if (val === "custom") {
      setPromoName("");
      setPromoType("DISCOUNT");
      setPromoDiscount("");
      setPromoDescription("");
    } else {
      const idx = parseInt(val, 10);
      const template = CAMPAIGN_TEMPLATES[idx];
      setPromoName(template.name);
      setPromoType(template.type);
      setPromoDiscount(template.discountPercent ? template.discountPercent.toString() : "");
      setPromoDescription(template.description);
    }
  };

  // Format helper
  const formatValue = (amount: number) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(amount / EXCHANGE_RATE);
    } else {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPrice || !pCogs || !pStock || !pMinStock) return;

    onAddProduct({
      name: pName,
      category: pCategory,
      price: parseFloat(pPrice),
      cogs: parseFloat(pCogs),
      stock: parseInt(pStock, 10),
      minStock: parseInt(pMinStock, 10),
    });

    setPSuccessMsg(`Successfully added "${pName}" to products database.`);
    setPName("");
    setPPrice("");
    setPCogs("");
    setPStock("");
    setPMinStock("");
    setTimeout(() => setPSuccessMsg(""), 4000);
  };

  const handleAddSaleItem = () => {
    if (!selectedProductId) return;
    const prod = companyProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if already exists in basket
    const existingIdx = saleItems.findIndex((item) => item.product.id === prod.id);
    if (existingIdx > -1) {
      const updated = [...saleItems];
      updated[existingIdx].quantity += selectedQuantity;
      setSaleItems(updated);
    } else {
      setSaleItems([...saleItems, { product: prod, quantity: selectedQuantity }]);
    }
    setSelectedQuantity(1);
  };

  const handleRemoveSaleItem = (idx: number) => {
    const updated = [...saleItems];
    updated.splice(idx, 1);
    setSaleItems(updated);
  };

  const handleCheckout = () => {
    if (saleItems.length === 0) return;

    const items = saleItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      cogs: item.product.cogs,
    }));

    const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = totalAmount * 0.1; // 10% VAT

    onRegisterSale({
      totalAmount,
      tax,
      paymentMethod: payMethod,
      items,
    });

    setSaleSuccessMsg(`Sale of ${formatValue(totalAmount + tax)} processed successfully!`);
    setSaleItems([]);
    setTimeout(() => setSaleSuccessMsg(""), 4000);
  };

  const handleProposePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName || !promoStart || !promoEnd) return;

    onAddPromotion({
      name: promoName,
      type: promoType,
      discountPercent: promoType === "DISCOUNT" && promoDiscount ? parseInt(promoDiscount, 10) : undefined,
      startDate: promoStart,
      endDate: promoEnd,
      status: "PENDING_APPROVAL", // operational admin drafts as pending for managers to approve
      description: promoDescription,
    });

    setPromoSuccessMsg(`Proposal for "${promoName}" forwarded for Manager & Owner review!`);
    setPromoName("");
    setPromoDiscount("");
    setPromoStart("");
    setPromoEnd("");
    setPromoDescription("");
    setSelectedTemplateIndex("custom");
    setTimeout(() => setPromoSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Center Column: Register Sales Desk & Proposals */}
        <div className="lg:col-span-2 space-y-6">
          {/* REGISTER SALE TRANSACTION (CHECKOUT) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-display font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#261CC1]" />
              Register Branch Sale Transaction
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit real customer checkouts. This automatically decreases raw inventory counts and updates platform BI charts.
            </p>

            {saleSuccessMsg && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4 rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-emerald-700 font-semibold">{saleSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-slate-100 pb-4 mb-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Item</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  id="checkout-select-product"
                  className="block w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#261CC1]"
                >
                  <option value="">-- Choose Product --</option>
                  {companyProducts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock === 0}>
                      {p.name} ({formatValue(p.price)} • Stock: {p.stock} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10))}
                  id="checkout-quantity"
                  className="block w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={handleAddSaleItem}
                  id="checkout-add-item-btn"
                  className="w-full bg-[#5EABD6] hover:bg-[#4396c2] text-white py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Tray</span>
                </button>
              </div>
            </div>

            {/* Tray List */}
            {saleItems.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-semibold italic bg-slate-50 border border-dashed rounded-xl">
                Checkout tray is empty. Add items from the drop-down above.
              </p>
            ) : (
              <div className="space-y-2 mb-6">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Checkout Tray</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {saleItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} x {formatValue(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {formatValue(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveSaleItem(idx)}
                          className="p-1 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => setPayMethod("Cash")}
                          className={`px-3 py-1 border rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            payMethod === "Cash" ? "bg-white border-[#E14434] text-[#E14434] shadow-sm font-black" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Cash</span>
                        </button>
                        <button
                          onClick={() => setPayMethod("Card")}
                          className={`px-3 py-1 border rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            payMethod === "Card" ? "bg-white border-[#E14434] text-[#E14434] shadow-sm font-black" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Card</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-l border-slate-200 h-10 mx-2"></div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total (Inc 10% Tax)</span>
                      <p className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                        {formatValue(
                          saleItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0) * 1.1
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    id="checkout-submit-btn"
                    className="bg-[#E14434] hover:bg-[#c23325] text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    Confirm & Complete Checkout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DRAFT PROMOTION CAMPAIGN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-display font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#E14434]" />
              Propose Discount Campaign / Promo
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a pre-designed strategic marketing campaign template or formulate a custom one. It will go to the Manager and Owner for live approval.
            </p>

            {promoSuccessMsg && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4 rounded-md text-sm text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {promoSuccessMsg}
              </div>
            )}

            <form onSubmit={handleProposePromo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Choose Strategic Template</label>
                <select
                  value={selectedTemplateIndex}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-indigo-50/40 text-slate-900 font-bold"
                >
                  <option value="custom">&mdash; Formulation Custom Campaign &mdash;</option>
                  {CAMPAIGN_TEMPLATES.map((tpl, idx) => (
                    <option key={idx} value={idx}>{tpl.name} ({tpl.type === "DISCOUNT" ? `${tpl.discountPercent}% Off` : tpl.type.replace(/_/g, " ")})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="e.g. Students Mid-Year Smash Special"
                  id="promo-form-name"
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Promo Mechanism</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as any)}
                  id="promo-form-type"
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                >
                  <option value="DISCOUNT">Percentage Discount</option>
                  <option value="BUY_1_GET_1">Buy 1 Get 1 Free</option>
                  <option value="BUNDLE">Special Menu Bundle Combo</option>
                </select>
              </div>

              {promoType === "DISCOUNT" && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Discount Percent (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(e.target.value)}
                    placeholder="e.g. 15"
                    id="promo-form-percent"
                    className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900 font-mono font-bold"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Campaign Goal & Description</label>
                <textarea
                  required
                  value={promoDescription}
                  onChange={(e) => setPromoDescription(e.target.value)}
                  placeholder="Explain the strategy or promotional goals..."
                  rows={2}
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={promoStart}
                    onChange={(e) => setPromoStart(e.target.value)}
                    id="promo-form-start"
                    className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={promoEnd}
                    onChange={(e) => setPromoEnd(e.target.value)}
                    id="promo-form-end"
                    className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  id="promo-submit-btn"
                  className="bg-[#261CC1] hover:bg-[#1C0770] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Forward Proposal to Owner
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Add New Product to catalog */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
          <h3 className="font-display font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#261CC1]" />
            Register Product in Catalog
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Incorporate a brand new offering into your branch sales menu.
          </p>

          {pSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg mb-4 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {pSuccessMsg}
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
              <input
                type="text"
                required
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="e.g. Avocado Choco Macchiato"
                id="product-form-name"
                className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category Group</label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                id="product-form-category"
                className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
              >
                <option value="Coffee">Coffee Group</option>
                <option value="Non-Coffee">Non-Coffee Drinks</option>
                <option value="Bakery">Bakery / Pastry</option>
                <option value="Main Course">Main Meals</option>
                <option value="Sides">Sides / Snacks</option>
                <option value="Dessert">Dessert Specials</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (IDR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  placeholder="35000"
                  id="product-form-price"
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unit COGS (IDR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pCogs}
                  onChange={(e) => setPCogs(e.target.value)}
                  placeholder="9000"
                  id="product-form-cogs"
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  placeholder="100"
                  id="product-form-stock"
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reorder Point Level</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pMinStock}
                  onChange={(e) => setPMinStock(e.target.value)}
                  placeholder="25"
                  id="product-form-min-stock"
                  className="block w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              id="product-submit-btn"
              className="w-full bg-[#261CC1] hover:bg-[#1C0770] text-white py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md mt-2"
            >
              Add to Catalog Registry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
