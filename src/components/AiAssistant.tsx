/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Company, ChatbotLog, Product, FinancialMetric, RevenueForecast, Promotion, Currency } from "../types";
import { Send, Bot, User, Sparkles, Zap, ArrowRight, HelpCircle, X, Smile } from "lucide-react";

interface AiAssistantProps {
  company: Company;
  chatbotLogs: ChatbotLog[];
  products: Product[];
  metrics: FinancialMetric[];
  promotions: Promotion[];
  forecast: RevenueForecast | undefined;
  currency: Currency;
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export default function AiAssistant({
  company,
  chatbotLogs,
  products,
  metrics,
  promotions,
  forecast,
  currency,
  onSendMessage,
  isSending,
  onClose,
  isFloating,
}: AiAssistantProps) {
  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter logs for this company
  const companyLogs = chatbotLogs.filter((l) => l.companyId === company.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [companyLogs, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;
    onSendMessage(userInput.trim());
    setUserInput("");
  };

  const handleChipClick = (query: string) => {
    if (isSending) return;
    onSendMessage(query);
  };

  const suggestionChips = [
    { label: "Compare this month's revenue", query: "Compare this month to last month's revenue." },
    { label: "What is our current profit margin?", query: "What is our current profit margin and how can we improve it?" },
    { label: "Which products need restocking?", query: "Which products need restocking immediately?" },
    { label: "How can we increase revenue?", query: "How can we increase revenue or improve margins next month?" },
    { label: "Forecast next month's revenue", query: "Forecast next month's revenue and what will be our best selling category." },
  ];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${
      isFloating ? "h-full border-none rounded-none" : "h-[calc(100vh-140px)]"
    }`}>
      {/* Consultant Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Custom Super Cute Chibi Bot mascot icon */}
          <div className="relative w-10 h-10 bg-gradient-to-br from-[#5EABD6] to-[#FEFBC7] rounded-full flex items-center justify-center shadow-md shrink-0 border-2 border-white overflow-visible select-none group/mascot">
            {/* Playful Ears/Antennas */}
            <span className="absolute -top-1.5 -left-1 w-3.5 h-3.5 bg-[#FFB4B4] rounded-full border border-white transition-transform group-hover/mascot:scale-110"></span>
            <span className="absolute -top-1.5 -right-1 w-3.5 h-3.5 bg-[#FFB4B4] rounded-full border border-white transition-transform group-hover/mascot:scale-110"></span>
            {/* Cute antenna with pulsing tip */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3.5 bg-[#E14434] rounded-full">
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FEFBC7] rounded-full shadow-sm animate-pulse"></span>
            </span>
            {/* Blush cheeks */}
            <span className="absolute bottom-2 left-1.5 w-2.5 h-1 bg-rose-400 rounded-full opacity-60"></span>
            <span className="absolute bottom-2 right-1.5 w-2.5 h-1 bg-rose-400 rounded-full opacity-60"></span>
            {/* Cute smiling face */}
            <Smile className="w-5.5 h-5.5 text-slate-800 transition-transform duration-300 group-hover/mascot:scale-115" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 font-display flex items-center gap-1.5">
              <span>AIBISPRO AI Advisor</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-mono font-bold rounded-lg tracking-wider">ONLINE</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold truncate max-w-[130px] sm:max-w-xs">
              Advising: <span className="text-[#E14434] font-black">{company.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sync Indicator */}
          {!isFloating && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline font-bold uppercase">Dynamic Context Engaged</span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0 select-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          Query Guide:
        </span>
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip.query)}
            disabled={isSending}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#261CC1] hover:bg-slate-50 text-slate-600 hover:text-[#261CC1] rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {companyLogs.map((log) => {
          const isAi = log.sender === "AI";
          return (
            <div key={log.id} className={`flex ${isAi ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-350`}>
              <div className={`flex gap-3 max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}>
                {isAi ? (
                  <div className="relative w-8 h-8 bg-gradient-to-br from-[#5EABD6] to-[#FEFBC7] rounded-full flex items-center justify-center shadow-sm shrink-0 border border-white/60 select-none group/mini">
                    {/* Cute micro ears */}
                    <span className="absolute -top-1 -left-0.5 w-2.5 h-2.5 bg-[#FFB4B4] rounded-full border border-white"></span>
                    <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 bg-[#FFB4B4] rounded-full border border-white"></span>
                    {/* Blush cheeks */}
                    <span className="absolute bottom-1 left-1 w-1.5 h-0.5 bg-rose-400 rounded-full opacity-60"></span>
                    <span className="absolute bottom-1 right-1 w-1.5 h-0.5 bg-rose-400 rounded-full opacity-60"></span>
                    <Smile className="w-4 h-4 text-slate-800" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#E14434] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border border-white">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-slate-800 text-xs shadow-sm leading-relaxed border ${
                  isAi 
                    ? "bg-slate-50 border-slate-100 rounded-tl-none font-sans" 
                    : "bg-[#5EABD6]/10 text-slate-900 border-[#5EABD6]/20 rounded-tr-none font-medium"
                }`}>
                  {/* Markdown rendering simulation (handling lists, bullet points, headers, bold, and warning highlights) */}
                  <div className="space-y-2 whitespace-pre-wrap">
                    {(log?.message || "").split("\n").map((line, lIdx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={lIdx} className="font-display font-black text-sm text-[#E14434] mt-3 border-b pb-1 border-slate-100">{line.replace("### ", "")}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return (
                          <div key={lIdx} className="flex items-start gap-1.5 ml-1 my-1">
                            <span className="text-[#E14434] mt-1 shrink-0">&bull;</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ") || line.startsWith("4. ")) {
                        return (
                          <div key={lIdx} className="flex items-start gap-1.5 ml-1 my-1">
                            <span className="font-bold text-[#E14434] shrink-0">{(line || "").split(".")[0]}.</span>
                            <span>{line.substring(3)}</span>
                          </div>
                        );
                      }
                      return <p key={lIdx}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Loading bubble */}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%] flex-row">
              <div className="relative w-8 h-8 bg-gradient-to-br from-[#5EABD6] to-[#FEFBC7] rounded-full flex items-center justify-center shadow-sm shrink-0 border border-white/60 select-none animate-bounce">
                {/* Cute micro ears */}
                <span className="absolute -top-1 -left-0.5 w-2.5 h-2.5 bg-[#FFB4B4] rounded-full border border-white"></span>
                <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 bg-[#FFB4B4] rounded-full border border-white"></span>
                <Smile className="w-4 h-4 text-slate-800" />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none text-slate-400 text-xs shadow-sm flex items-center gap-2">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-[#5EABD6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-[#E14434] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-[#FFB4B4] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="font-semibold font-mono text-[9px] text-slate-500 uppercase tracking-wider">AIBISPRO AI is calculating...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Footer Input form */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isSending}
            placeholder={`Ask about ${company.name}'s revenue, restock needs, promotions, margins or strategic strategy...`}
            id="ai-chat-input-field"
            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5EABD6] focus:border-[#5EABD6] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isSending}
            id="ai-chat-submit-btn"
            className="bg-[#E14434] hover:bg-[#c23325] text-white p-3 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4.5 h-4.5 text-white" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 font-semibold text-center mt-2 uppercase tracking-wide">
          AIBISPRO Virtual Consultant uses real-time context. All chats are archived.
        </p>
      </div>
    </div>
  );
}
