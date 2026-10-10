import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { adminLogin } from "../../services/authService";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@smartcart.com");
  const [password, setPassword] = useState("Admin@123");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const data = await adminLogin(email, password);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@smartcart.com");
    setPassword("Admin@123");
  };

  return (
    <div className="flex min-h-[calc(100dvh-58px)] items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <button
          onClick={() => navigate("/")}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Store</span>
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Manager Access
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Sign in to oversee live store inventory and orders.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartcart.com"
                autoComplete="email"
                className="w-full min-h-[46px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full min-h-[46px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-slate-900 font-bold text-xs text-white shadow-sm transition active:scale-95 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Sign In to Admin Portal"}
          </button>

          {/* Quick Demo Fill Helper */}
          <button
            type="button"
            onClick={handleFillDemo}
            className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
          >
            <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
            <span>Use Demo Credentials (admin@smartcart.com)</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;