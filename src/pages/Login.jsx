import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async () => {
    setError("");
    if (!email || !password) return setError("Enter email and password");
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { email, password });
      // save auth
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // if backend returns plan, store it; otherwise keep existing value
      if (data.user?.plan) localStorage.setItem("plan", data.user.plan);
      nav("/groups", { replace: true });
    } catch (e) {
      setError(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Brand header */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{ background: "#06623B" }}
        >
          <div className="text-2xl font-bold">BudgetSplit</div>
          <div className="text-sm opacity-90">
            No more wahala over who owes who.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-3">
          <label className="block text-sm text-gray-700">Email</label>
          <input
            className="w-full rounded-xl border px-3 py-2 bg-yellow-50"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />

          <label className="block text-sm text-gray-700">Password</label>
          <input
            className="w-full rounded-xl border px-3 py-2 bg-yellow-50"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />

          {/* Forgot password link */}
          <div className="text-right">
            <button
              className="text-xs text-[#06623B] underline"
              onClick={() => nav("/forgot")}
              type="button"
            >
              Forgot password?
            </button>
          </div>

          {/* Log in button */}
          <button
            className="w-full rounded-xl px-4 py-3 font-semibold text-white bg-[#06623B] active:scale-[0.99] disabled:opacity-50"
            onClick={doLogin}
            disabled={loading}
            type="button"
          >
            {loading ? "Please wait..." : "Log in"}
          </button>

          <div className="text-center text-xs text-gray-500">or</div>

          {/* Get Started → go to Register page */}
          <button
            className="w-full rounded-xl px-4 py-3 font-semibold bg-[#F4C84A] active:scale-[0.99]"
            onClick={() => nav("/register")}
            type="button"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}