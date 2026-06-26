/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Role, Company } from "../types";
import { 
  User as UserIcon, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Building,
  Eye,
  EyeOff,
  UserPlus
} from "lucide-react";
import { motion } from "motion/react";
import { DEMO_USERS } from "../mockData";

interface AccountSettingsProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  companies: Company[];
}

export default function AccountSettings({ currentUser, setCurrentUser, companies }: AccountSettingsProps) {
  // All users database loaded from localStorage
  const [users, setUsers] = useState<User[]>([]);
  
  // Role upgrade request state
  const [roleRequest, setRoleRequest] = useState<{
    id: string;
    userEmail: string;
    userName: string;
    currentRole: Role;
    requestedRole: Role;
    status: "PENDING" | "APPROVED" | "REJECTED";
    timestamp: string;
  } | null>(null);

  // Sync role requests
  useEffect(() => {
    const fetchRequest = () => {
      const stored = localStorage.getItem("aibispro_role_requests");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const req = parsed.find((r: any) => r.userEmail.toLowerCase() === currentUser.email.toLowerCase());
          if (req) {
            setRoleRequest(req);
            
            // Auto-upgrade local session if request has been approved
            if (req.status === "APPROVED" && currentUser.role === "MANAGER") {
              const upgradedUser = { ...currentUser, role: "OWNER" as Role };
              setCurrentUser(upgradedUser);
              localStorage.setItem("aibispro_user", JSON.stringify(upgradedUser));
              
              // Also update the general users list in storage
              const storedUsers = localStorage.getItem("aibispro_users_list");
              if (storedUsers) {
                const uList = JSON.parse(storedUsers);
                const updatedList = uList.map((u: any) => 
                  u.email.toLowerCase() === currentUser.email.toLowerCase() 
                    ? { ...u, role: "OWNER" } 
                    : u
                );
                localStorage.setItem("aibispro_users_list", JSON.stringify(updatedList));
                setUsers(updatedList);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchRequest();
    const interval = setInterval(fetchRequest, 1500);
    return () => clearInterval(interval);
  }, [currentUser, setCurrentUser]);

  const handleSubmitRoleRequest = () => {
    const newRequest = {
      id: "REQ-" + Math.floor(100 + Math.random() * 900),
      userEmail: currentUser.email,
      userName: currentUser.name,
      currentRole: currentUser.role,
      requestedRole: "OWNER" as Role,
      status: "PENDING" as const,
      timestamp: new Date().toISOString()
    };

    const stored = localStorage.getItem("aibispro_role_requests");
    let all: any[] = [];
    if (stored) {
      try {
        all = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    const filtered = all.filter((r: any) => r.userEmail.toLowerCase() !== currentUser.email.toLowerCase());
    const updated = [newRequest, ...filtered];
    localStorage.setItem("aibispro_role_requests", JSON.stringify(updated));
    setRoleRequest(newRequest);
  };

  // Forms & Edit states
  const [activeTab, setActiveTab] = useState<"profile" | "directory">("profile");
  
  // My Profile Edit State
  const [profileName, setProfileName] = useState(currentUser.name || "");
  const [profileEmail, setProfileEmail] = useState(currentUser.email || "");
  const [profilePassword, setProfilePassword] = useState(currentUser.password || "1A345678");
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("ADMIN");
  const [newUserCompanies, setNewUserCompanies] = useState<string[]>([]);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newErrorMessage, setNewErrorMessage] = useState<string | null>(null);
  const [newSuccessMessage, setNewSuccessMessage] = useState<string | null>(null);

  // Directory Editing State
  const [editingUserEmail, setEditingUserEmail] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState<Role>("ADMIN");
  const [editUserCompanies, setEditUserCompanies] = useState<string[]>([]);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  // Load and synchronize user accounts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("aibispro_users_list");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsers(parsed);
      } catch (e) {
        setUsers(DEMO_USERS);
      }
    } else {
      localStorage.setItem("aibispro_users_list", JSON.stringify(DEMO_USERS));
      setUsers(DEMO_USERS);
    }
  }, []);

  // Password validation: must contain letters and numbers
  const validatePassword = (password: string): boolean => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
  };

  // Helper to save users list back to storage
  const saveUsersList = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem("aibispro_users_list", JSON.stringify(updatedUsers));
  };

  // Update current user's profile info
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!profileName.trim() || !profileEmail.trim() || !profilePassword) {
      setProfileMessage({ type: "error", text: "Please fill in all profile fields." });
      return;
    }

    // Validate email format and check for leading @ typos
    const cleanEmail = profileEmail.trim().replace(/^@/, "");

    // Validate password constraint
    if (!validatePassword(profilePassword)) {
      setProfileMessage({ 
        type: "error", 
        text: "🔐 Password restriction failed: The password must contain both alphabetical letters and numeric digits!" 
      });
      return;
    }

    // Check if email already exists for another user
    const emailConflict = users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.email.toLowerCase() !== currentUser.email.toLowerCase());
    if (emailConflict) {
      setProfileMessage({ type: "error", text: "This email address is already in use by another workspace user." });
      return;
    }

    const updatedCurrentUser = {
      ...currentUser,
      name: profileName.trim(),
      email: cleanEmail,
      password: profilePassword
    };

    // Update inside list of all users
    const updatedUsersList = users.map(u => {
      if (u.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return updatedCurrentUser;
      }
      return u;
    });

    saveUsersList(updatedUsersList);
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem("aibispro_user", JSON.stringify(updatedCurrentUser));

    setProfileMessage({ type: "success", text: "Your profile security logs and credentials updated successfully!" });
  };

  // Create new user account
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setNewErrorMessage(null);
    setNewSuccessMessage(null);

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setNewErrorMessage("Please fill in all fields.");
      return;
    }

    const cleanEmail = newUserEmail.trim().replace(/^@/, "");

    // Verify duplication
    const duplicate = users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (duplicate) {
      setNewErrorMessage("A user with this email address already exists.");
      return;
    }

    // Validate password requirement
    if (!validatePassword(newUserPassword)) {
      setNewErrorMessage("🔐 Password restriction failed: The password must contain both alphabetical letters and numeric digits!");
      return;
    }

    if (newUserCompanies.length === 0) {
      setNewErrorMessage("Please assign at least one company to this account.");
      return;
    }

    const newUser: User = {
      name: newUserName.trim(),
      email: cleanEmail,
      role: newUserRole,
      password: newUserPassword,
      assignedCompanies: newUserCompanies
    };

    const updatedList = [...users, newUser];
    saveUsersList(updatedList);

    // Reset form
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("ADMIN");
    setNewUserCompanies([]);
    setNewSuccessMessage(`Account for ${newUser.name} created successfully! New baristas, managers or admins can now sign in using these credentials.`);
  };

  // Toggle assigned company for new/editing users
  const toggleCompanySelection = (companyId: string, isEditing: boolean) => {
    if (isEditing) {
      if (editUserCompanies.includes(companyId)) {
        setEditUserCompanies(editUserCompanies.filter(id => id !== companyId));
      } else {
        setEditUserCompanies([...editUserCompanies, companyId]);
      }
    } else {
      if (newUserCompanies.includes(companyId)) {
        setNewUserCompanies(newUserCompanies.filter(id => id !== companyId));
      } else {
        setNewUserCompanies([...newUserCompanies, companyId]);
      }
    }
  };

  // Start editing a user in the directory
  const handleStartEdit = (userToEdit: User) => {
    setEditingUserEmail(userToEdit.email);
    setEditUserName(userToEdit.name);
    setEditUserPassword(userToEdit.password || "1A345678");
    setEditUserRole(userToEdit.role);
    setEditUserCompanies(userToEdit.assignedCompanies || []);
    setEditErrorMessage(null);
  };

  // Save edits to a user in the directory
  const handleSaveEdit = (originalEmail: string) => {
    setEditErrorMessage(null);

    if (!editUserName.trim() || !editUserPassword) {
      setEditErrorMessage("Fields cannot be empty.");
      return;
    }

    // Validate password
    if (!validatePassword(editUserPassword)) {
      setEditErrorMessage("🔐 Password restriction failed: The password must contain both alphabetical letters and numeric digits!");
      return;
    }

    if (editUserCompanies.length === 0) {
      setEditErrorMessage("Please select at least one assigned company.");
      return;
    }

    const updatedList = users.map(u => {
      if (u.email.toLowerCase() === originalEmail.toLowerCase()) {
        const updatedUser: User = {
          ...u,
          name: editUserName.trim(),
          password: editUserPassword,
          role: editUserRole,
          assignedCompanies: editUserCompanies
        };

        // If the edited user is the current logged-in user, update session as well
        if (originalEmail.toLowerCase() === currentUser.email.toLowerCase()) {
          setCurrentUser(updatedUser);
          localStorage.setItem("aibispro_user", JSON.stringify(updatedUser));
          setProfileName(updatedUser.name);
          setProfileEmail(updatedUser.email);
          setProfilePassword(updatedUser.password || "");
        }

        return updatedUser;
      }
      return u;
    });

    saveUsersList(updatedList);
    setEditingUserEmail(null);
  };

  // Delete user from directory
  const handleDeleteUser = (emailToDelete: string) => {
    if (emailToDelete.toLowerCase() === currentUser.email.toLowerCase()) {
      alert("You cannot delete your own active session account!");
      return;
    }

    const updatedList = users.filter(u => u.email.toLowerCase() !== emailToDelete.toLowerCase());
    saveUsersList(updatedList);
  };

  // Check roles permissions
  const canManageDirectory = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#261CC1]" />
            Security & Account Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Manage your personal login credentials, view your assigned companies, and control corporate administrative credentials.
          </p>
        </div>

        {/* Tab Switcher */}
        {canManageDirectory && (
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "profile" 
                  ? "bg-white text-[#261CC1] shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Security Profile
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "directory" 
                  ? "bg-white text-[#261CC1] shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Workspace User Directory ({users.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Content Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile/Tab Left Side Info (Assigned Companies Summary etc) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Active Workspace Session
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#3A9AFF]/10 text-[#3A9AFF] flex items-center justify-center font-extrabold text-lg border border-[#3A9AFF]/20 shadow-inner">
                  {currentUser.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">{currentUser.name}</h4>
                  <span className="text-[10px] font-mono font-bold bg-[#5EABD6]/10 text-[#5EABD6] px-2 py-0.5 rounded-full uppercase tracking-wider block mt-0.5 w-fit">
                    {currentUser.role.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Login Email:</span>
                  <span className="font-mono text-slate-700 font-semibold">{currentUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">User Role Level:</span>
                  <span className="font-bold text-[#E14434]">{currentUser.role}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" />
              Assigned Companies
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 font-semibold">
              You are authorized to analyze, modify inventory, and review financial ledgers for these companies:
            </p>
            <div className="mt-3 space-y-2">
              {companies
                .filter(c => currentUser.assignedCompanies.includes(c.id) || currentUser.role === "SUPER_ADMIN")
                .map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.avatarUrl}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{c.type}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-extrabold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                      {c.branches} BR
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Password Restriction Alert Info Box */}
          <div className="p-5 bg-gradient-to-br from-[#FEFBC7] via-[#FFB4B4]/20 to-[#FEFBC7] text-slate-800 rounded-2xl shadow-sm border border-[#FEFBC7] relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white select-none">
              <KeyRound className="w-32 h-32" />
            </div>
            <h4 className="text-xs font-mono font-bold text-[#E14434] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Security Directive Alert
            </h4>
            <p className="text-xs font-bold mt-2 leading-relaxed">
              To prevent security vulnerabilities across franchises, any password modification or new account creations must fulfill our corporate directive:
            </p>
            <div className="mt-3 bg-white/80 p-3 rounded-xl border border-[#FEFBC7]/80 space-y-1 text-[11px] font-semibold text-slate-700">
              <p className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#E14434] shrink-0" />
                Must contain alphabetical letters (A-Z)
              </p>
              <p className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#E14434] shrink-0" />
                Must contain numeric digits (0-9)
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Center Panel based on Active Tab */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === "profile" && (<>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#261CC1]" />
                Modify Security Profile Info
              </h3>

              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
                {profileMessage && (
                  <div className={`p-4 rounded-xl flex items-start gap-2 border ${
                    profileMessage.type === "success" 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : "bg-red-50 border-red-100 text-red-800"
                  }`}>
                    {profileMessage.type === "success" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs font-semibold">{profileMessage.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                    <div className="mt-1 relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] sm:text-xs bg-slate-50"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                    <div className="mt-1 relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] sm:text-xs bg-slate-50"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Change Security Password</label>
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">Must contain both alphabet (letters) and numeric digits.</p>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showProfilePassword ? "text" : "password"}
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="block w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] sm:text-xs bg-slate-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#261CC1] hover:bg-[#1C0770] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Security Profile
                  </button>
                </div>
              </form>
            </div>

            {currentUser.role === "MANAGER" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Request Ownership Upgrade (Manager &rarr; Owner)
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Are you ready to manage all franchise inventory signoffs and receive company-wide ledger updates? Submit an ownership transition proposal directly to the Admin Owner.
                </p>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {roleRequest ? `Transition Status: ${roleRequest.status}` : "No transition proposal active"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      {roleRequest 
                        ? `Proposal submitted on ${new Date(roleRequest.timestamp).toLocaleString()}` 
                        : "Transition requires owner confirmation."}
                    </p>
                  </div>

                  {(!roleRequest || roleRequest.status === "REJECTED") ? (
                    <button
                      onClick={handleSubmitRoleRequest}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow"
                    >
                      Submit Ownership Request
                    </button>
                  ) : roleRequest.status === "PENDING" ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg animate-pulse uppercase">
                      Awaiting Owner Confirmation
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg uppercase">
                      Approved & Upgraded
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
          )}

          {activeTab === "directory" && canManageDirectory && (
            <div className="space-y-6">
              
              {/* Form to Register / Create New User */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  Register New Corporate Account
                </h3>

                <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
                  {newErrorMessage && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold">{newErrorMessage}</span>
                    </div>
                  )}

                  {newSuccessMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold">{newSuccessMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Sarah Barista"
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] text-xs bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="sarah@company.com"
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] text-xs bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Access Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as Role)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] text-xs bg-slate-50"
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN (Global Core Control)</option>
                        <option value="OWNER">OWNER (Cross-Franchise CEO)</option>
                        <option value="MANAGER">MANAGER (Operations Supervisor)</option>
                        <option value="ADMIN">ADMIN (In-Branch Register & Stocker)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Password (Requires letters + digits)</label>
                      <div className="relative mt-1">
                        <input
                          type={showNewUserPassword ? "text" : "password"}
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="e.g. Barista101"
                          className="block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#261CC1] text-xs bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Company Assignments for the New Account */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Authorized Companies Access</label>
                    <div className="flex flex-wrap gap-2">
                      {companies
                        .filter(c => currentUser.role === "SUPER_ADMIN" || currentUser.assignedCompanies.includes(c.id))
                        .map(c => {
                          const isSelected = newUserCompanies.includes(c.id);
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => toggleCompanySelection(c.id, false)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border flex items-center gap-1.5 cursor-pointer ${
                                isSelected 
                                  ? "bg-[#261CC1] text-white border-[#261CC1]" 
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{c.avatarUrl}</span>
                              <span>{c.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Register New User Account
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing User Directory Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="border-b pb-3 border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#261CC1]" />
                    Corporate User Database Index
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">
                    {users.length} TOTAL USERS
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-3 px-2">User Details</th>
                        <th className="py-3 px-2">Access Role</th>
                        <th className="py-3 px-2">Password Log</th>
                        <th className="py-3 px-2">Authorizations</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(u => {
                        const isSelf = u.email.toLowerCase() === currentUser.email.toLowerCase();
                        const isEditing = editingUserEmail === u.email;

                        return (
                          <tr key={u.email} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? "bg-indigo-50/40" : ""}`}>
                            
                            {/* User details */}
                            <td className="py-3.5 px-2">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editUserName}
                                  onChange={(e) => setEditUserName(e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                />
                              ) : (
                                <div>
                                  <p className="font-extrabold text-slate-800 flex items-center gap-1">
                                    {u.name} 
                                    {isSelf && <span className="text-[9px] bg-slate-200 text-slate-500 px-1 rounded">You</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</p>
                                </div>
                              )}
                            </td>

                            {/* Access role */}
                            <td className="py-3.5 px-2">
                              {isEditing ? (
                                <select
                                  value={editUserRole}
                                  onChange={(e) => setEditUserRole(e.target.value as Role)}
                                  className="px-1.5 py-1 border border-slate-200 rounded-lg text-xs"
                                >
                                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                                  <option value="OWNER">OWNER</option>
                                  <option value="MANAGER">MANAGER</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              ) : (
                                <span className={`text-[9px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded-full ${
                                  u.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" :
                                  u.role === "OWNER" ? "bg-blue-100 text-blue-800" :
                                  u.role === "MANAGER" ? "bg-amber-100 text-amber-800" :
                                  "bg-slate-100 text-slate-800"
                                }`}>
                                  {u.role.replace("_", " ")}
                                </span>
                              )}
                            </td>

                            {/* Password visibility */}
                            <td className="py-3.5 px-2 font-mono text-[10px] text-slate-600">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editUserPassword}
                                  onChange={(e) => setEditUserPassword(e.target.value)}
                                  className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                />
                              ) : (
                                <span>{u.password || "1A345678"}</span>
                              )}
                            </td>

                            {/* Authorizations / Companies */}
                            <td className="py-3.5 px-2">
                              {isEditing ? (
                                <div className="space-y-1">
                                  {companies
                                    .filter(c => currentUser.role === "SUPER_ADMIN" || currentUser.assignedCompanies.includes(c.id))
                                    .map(c => {
                                      const checked = editUserCompanies.includes(c.id);
                                      return (
                                        <label key={c.id} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleCompanySelection(c.id, true)}
                                            className="rounded"
                                          />
                                          <span>{c.avatarUrl} {c.name}</span>
                                        </label>
                                      );
                                    })}
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {u.role === "SUPER_ADMIN" ? (
                                    <span className="text-[10px] font-bold text-[#261CC1] bg-[#261CC1]/5 px-2 py-0.5 rounded-lg">All Entities Authorized</span>
                                  ) : (
                                    companies
                                      .filter(c => (u.assignedCompanies || []).includes(c.id))
                                      .map(c => (
                                        <span key={c.id} title={c.name} className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg">
                                          {c.avatarUrl}
                                        </span>
                                      ))
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Edit / Delete actions */}
                            <td className="py-3.5 px-2 text-right">
                              {isEditing ? (
                                <div className="flex flex-col gap-1 items-end">
                                  {editErrorMessage && <p className="text-[9px] text-red-600 font-bold max-w-[120px] leading-tight mb-1 text-right">{editErrorMessage}</p>}
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleSaveEdit(u.email)}
                                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                                      title="Save edits"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingUserEmail(null)}
                                      className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer text-[10px] font-bold px-2"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => handleStartEdit(u)}
                                    className="p-1.5 border border-slate-200 hover:border-[#261CC1] hover:bg-slate-50 text-slate-600 hover:text-[#261CC1] rounded-lg transition-colors cursor-pointer"
                                    title="Edit user details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.email)}
                                    disabled={isSelf}
                                    className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                                      isSelf 
                                        ? "opacity-30 border-slate-100 text-slate-300 cursor-not-allowed" 
                                        : "border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-400 hover:text-red-500"
                                    }`}
                                    title={isSelf ? "Cannot delete active session" : "Delete user"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
