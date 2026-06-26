/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DEMO_USERS } from "../mockData";
import { User } from "../types";
import { KeyRound, Mail, AlertCircle, Building2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [usersList] = useState<User[]>(() => {
    const stored = localStorage.getItem("aibispro_users_list");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Clean out stale user logs or passwords
        if (parsed.some((u: any) => u.password === "1A345678" || u.email.includes("brainadmin") || u.email.includes("admin@company.com"))) {
          localStorage.setItem("aibispro_users_list", JSON.stringify(DEMO_USERS));
          return DEMO_USERS;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse stored users list", e);
      }
    }
    localStorage.setItem("aibispro_users_list", JSON.stringify(DEMO_USERS));
    return DEMO_USERS;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Authenticate with dynamic credentials, matching trailing / leading @ typos
    const searchEmail = email.trim().toLowerCase().replace(/^@/, "");
    const foundUser = usersList.find((u) => {
      const uEmail = u.email.trim().toLowerCase().replace(/^@/, "");
      return uEmail === searchEmail;
    });

    if (foundUser) {
      const storedPass = foundUser.password || "1A234567";
      if (password === storedPass) {
        setError("");
        onLoginSuccess(foundUser);
      } else {
        setError("Incorrect password. Please try again.");
      }
    } else {
      setError("Invalid credentials. Try using one of the demo credentials below.");
    }
  };

  const handleQuickLogin = (demoUser: User, pass: string) => {
    setEmail(demoUser.email);
    setPassword(pass);
    onLoginSuccess(demoUser);
  };

  const handleGuestEntrance = () => {
    onLoginSuccess({
      email: "guest@company.com",
      name: "Guest Customer",
      role: "CUSTOMER",
      assignedCompanies: ["abc_coffee", "xyz_restaurant", "sushi_house", "burger_factory", "central_kitchen"]
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="w-12 h-12 bg-[#FEFBC7] text-[#E14434] rounded-xl flex items-center justify-center text-2xl font-black shadow-lg border border-[#E14434]/10">
            A
          </div>
          <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
            AIBIS<span className="text-[#5EABD6]">PRO</span>
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 font-display">
          Business Intelligence Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enterprise Multi-Company Analytics Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5EABD6] focus:border-[#5EABD6] sm:text-sm bg-slate-50 hover:bg-slate-50/50 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5EABD6] focus:border-[#5EABD6] sm:text-sm bg-slate-50 hover:bg-slate-50/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                id="login-btn"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-[#E14434] hover:bg-[#c23325] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5EABD6] transition-all cursor-pointer"
              >
                Sign In to Workspace
              </button>
            </div>
          </form>

          {/* Or Customer Guest Entrance */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="relative flex justify-center text-xs uppercase mb-4">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                Customer View
              </span>
            </div>
            <button
              onClick={handleGuestEntrance}
              id="customer-guest-btn"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 hover:border-[#5EABD6] rounded-xl text-xs font-extrabold text-slate-700 hover:text-[#5EABD6] bg-slate-50 hover:bg-[#5EABD6]/10 shadow-sm transition-all cursor-pointer group"
            >
              <Building2 className="w-4 h-4 text-slate-400 group-hover:text-[#5EABD6]" />
              <span>Browse Menu & Promotions as Guest Customer</span>
              <span className="text-[#5EABD6] font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>

          {/* Quick Demo Login Cards */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#5EABD6]" />
              Select Workspace Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              {usersList.map((user) => {
                const pass = user.password || "1A234567";
                return (
                  <button
                    key={user.email}
                    onClick={() => handleQuickLogin(user, pass)}
                    id={`demo-${user.role.toLowerCase()}`}
                    className="p-3 text-left border border-slate-200 hover:border-[#5EABD6] hover:bg-[#5EABD6]/10 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-800 group-hover:text-[#5EABD6] truncate">
                        {user.name.split(" ")[0]}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate uppercase">
                        {user.role.replace("_", " ")}
                      </p>
                    </div>
                    <span className="text-[9px] text-[#5EABD6] mt-1 font-bold group-hover:underline truncate">
                      ({pass})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
