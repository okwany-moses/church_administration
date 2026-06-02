import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Key, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  HelpCircle,
  Clock,
  ShieldAlert
} from "lucide-react";
import { User } from "../types";

interface AuthInterfaceProps {
  onAuthChange: (token: string | null, user: User | null) => void;
  currentUser: User | null;
  currentToken: string | null;
}

export default function AuthInterface({ onAuthChange, currentUser, currentToken }: AuthInterfaceProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"member" | "author">("member");
  
  // Forgot / Reset states
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [resetTokenId, setResetTokenId] = useState<string | null>(null);

  // Status indicators
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear alerts when switching modes
    setError(null);
    setSuccess(null);
    setSimulatedCode(null);
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please key in both email address and security passcode.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login credentials authentication failed.");
      }
      localStorage.setItem("vyin_session_token", data.token);
      localStorage.setItem("vyin_session_user", JSON.stringify(data.user));
      onAuthChange(data.token, data.user);
      setSuccess("Session authorized successfully. Access granted.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during database lookup.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Please complete all registration system parameters.");
      return;
    }
    if (password.length < 6) {
      setError("Passcode strength check failed. Must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "System registration registry rejected the write.");
      }
      localStorage.setItem("vyin_session_token", data.token);
      localStorage.setItem("vyin_session_user", JSON.stringify(data.user));
      onAuthChange(data.token, data.user);
      setSuccess("Account successfully instantiated on the network ledger.");
    } catch (err: any) {
      setError(err.message || "An exception occurred during ledger allocation.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Email address is required to locate the secure key.");
      return;
    }
    setLoading(true);
    setError(null);
    setSimulatedCode(null);
    try {
      const response = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "No active account matches the requested record.");
      }
      setSimulatedCode(data.simulationCode);
      setResetTokenId(data.tokenId);
      setSuccess("Reset code generated. For testing, use the 6-digit verification code below.");
      setMode("reset");
    } catch (err: any) {
      setError(err.message || "Failed to trigger security key reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setError("Please specify the 6-digit verification code and your new passcode.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New passcode must contain 6 or more characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetCode,
          newPassword,
          tokenId: resetTokenId
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Reset verification failed.");
      }
      setSuccess("Security passcode updated successfully. You can now log in.");
      setMode("login");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update record in the ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vyin_session_token");
    localStorage.removeItem("vyin_session_user");
    onAuthChange(null, null);
    setSuccess("Session terminated securely.");
    setMode("login");
  };

  if (currentUser) {
    return (
      <div className="bg-slate-900 border border-emerald-900/20 p-6 rounded-sm space-y-4 max-w-sm ml-auto" id="auth-panel-active">
        <div className="flex items-start gap-3" id="active-user-meta">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400" id="user-avatar">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1" id="active-user-text">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100">{currentUser.fullName}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-xs">
                {currentUser.role}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{currentUser.email}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          id="btn-auth-logout"
          className="w-full py-2.5 bg-slate-950 hover:bg-red-950/10 hover:text-red-400 border border-slate-800 hover:border-red-900/30 text-xs font-mono font-bold uppercase tracking-widest text-slate-350 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Secure Exit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-emerald-900/20 p-6 rounded-sm w-full max-w-sm mx-auto" id="auth-panel-form">
      <div className="text-center mb-6" id="auth-header-wrapper">
        <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-emerald-400 mb-1">
          {mode === "login" && "System Gatekeeper"}
          {mode === "register" && "Ledger Registration"}
          {mode === "forgot" && "Reset Coordinator"}
          {mode === "reset" && "Passcode Instantiation"}
        </h3>
        <p className="text-[11px] text-slate-400 leading-normal font-sans">
          {mode === "login" && "Authenticate representative session credentials."}
          {mode === "register" && "Institute new representative profiles on the alliance ledger."}
          {mode === "forgot" && "Initiate credentials security reset process."}
          {mode === "reset" && "Update system security key values."}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/10 border border-red-900/30 text-red-400 rounded-sm text-[11px] flex gap-2 mb-4" id="auth-alert-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-sm text-[11px] flex gap-2 mb-4" id="auth-alert-success">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* SPECIAL SIMULATION HELPER BOX */}
      {simulatedCode && (
        <div className="p-4 bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 text-emerald-400 rounded-sm text-xs mb-5 font-mono space-y-2 text-center" id="auth-alert-sim-helper">
          <div className="flex justify-center items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Developer Simulation Console
          </div>
          <p className="text-[10px] text-slate-300">Security SMTP offline. Your generated reset verification key:</p>
          <div className="text-lg tracking-[0.4em] font-black bg-slate-950 py-1.5 rounded-sm select-all">
            {simulatedCode}
          </div>
          <p className="text-[9px] text-emerald-500/70">Enter this code in the reset sequence below.</p>
        </div>
      )}

      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-4" id="form-login">
          <div className="space-y-1.5" id="field-login-email">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Registry Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="name@organization.com"
            />
          </div>

          <div className="space-y-1.5" id="field-login-password">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Access Key / Passcode
              </label>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-[10px] text-emerald-500 hover:underline hover:text-emerald-400 cursor-pointer font-mono"
              >
                Key Loss?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="btn-login-submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Authorizing Ledger..." : "Acquire Token Session"}
          </button>

          <div className="text-center pt-2" id="toggle-to-register">
            <span className="text-[10px] text-slate-450 mr-1.5">Need a system profile?</span>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="text-[10px] text-emerald-500 hover:underline font-bold font-mono cursor-pointer"
            >
              Request Access Roster
            </button>
          </div>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={handleRegister} className="space-y-3" id="form-register">
          <div className="space-y-1" id="field-reg-name">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Representative Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="e.g. Dr. Jane Smith"
            />
          </div>

          <div className="space-y-1" id="field-reg-email">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Registry Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="representative@domain.com"
            />
          </div>

          <div className="space-y-1" id="field-reg-password">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Define Access Passcode
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="At least 6 characters"
            />
          </div>

          <div className="space-y-1.5" id="field-reg-role">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              System Authorization Level
            </label>
            <div className="grid grid-cols-2 gap-2" id="reg-role-options">
              <button
                type="button"
                onClick={() => setRole("member")}
                className={`py-2 text-[10px] font-mono font-bold uppercase border cursor-pointer rounded-sm tracking-wider transition-all text-center ${
                  role === "member"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-slate-950 border-slate-805 text-slate-450 hover:bg-slate-900"
                }`}
              >
                Member Active
              </button>
              <button
                type="button"
                onClick={() => setRole("author")}
                className={`py-2 text-[10px] font-mono font-bold uppercase border cursor-pointer rounded-sm tracking-wider transition-all text-center ${
                  role === "author"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-slate-950 border-slate-805 text-slate-450 hover:bg-slate-900"
                }`}
              >
                Author Active
              </button>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal font-mono pt-1">
              * Author-level profiles acquire structural permissions to drafts, edits, and deletions.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            id="btn-register-submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Allocating Node..." : "Allocate System Index"}
          </button>

          <div className="text-center pt-2" id="toggle-to-login">
            <span className="text-[10px] text-slate-450 mr-1.5">Already certified?</span>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[10px] text-emerald-500 hover:underline font-bold font-mono cursor-pointer"
            >
              Sign In Gate
            </button>
          </div>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleForgotPassword} className="space-y-4" id="form-forgot">
          <div className="space-y-1.5" id="field-forgot-email">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Registered Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="e.g. administrator@network.org"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="btn-forgot-submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Searching Directory..." : "Dispatch Password Reset Key"}
          </button>

          <div className="text-center pt-2" id="toggle-forgot-back-login">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[10px] text-slate-400 hover:text-emerald-400 hover:underline font-mono cursor-pointer"
            >
              Return to Gateholder Menu
            </button>
          </div>
        </form>
      )}

      {mode === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-4" id="form-reset-password">
          <div className="space-y-1.5" id="field-reset-code">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> 6-Digit Simulated Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm tracking-[0.25em] text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="000000"
            />
          </div>

          <div className="space-y-1.5" id="field-reset-newpass">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Define New Access Passcode
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="btn-reset-commit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? "Re-encrypting..." : "Update Credentials Token"}
          </button>

          <div className="text-center pt-2" id="toggle-reset-abort">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[10px] text-red-500 hover:underline font-mono cursor-pointer"
            >
              Abort Key Reset Flow
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
