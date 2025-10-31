import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/groups"); // redirect to main dashboard
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06623B] text-white">
      <div className="bg-white text-gray-900 rounded-xl shadow-lg w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-[#06623B]">
          Welcome Back 👋
        </h2>
        <p className="text-center text-gray-500">Login to your BudgetSplit account</p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded text-sm">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06623B]"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06623B]"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <a href="#/forgot" className="text-sm text-[#06623B] hover:underline">
              Forgot password?
            </a>
            <a href="#/register" className="text-sm text-[#06623B] hover:underline">
              Create account
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06623B] text-white rounded-lg py-2 font-semibold hover:opacity-90 active:scale-[0.98]"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}