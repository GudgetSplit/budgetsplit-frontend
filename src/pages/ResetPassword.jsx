import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(params.get("email") || "");
    setToken(params.get("token") || "");
  }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset", { email, token, password });
      setDone(true);
      setTimeout(() => nav("/login"), 1200);
    } catch (e) {
      setError(e?.response?.data?.error || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-5">
      <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center text-[#06623B]">Set a new password</h1>

        {done ? (
          <div className="text-sm text-green-700">Password updated. Redirecting to login…</div>
        ) : (
          <>
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <input
                type="password"
                placeholder="New password"
                className="w-full border rounded-xl px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="w-full py-2 rounded-xl bg-[#06623B] text-white font-semibold">
                Update password
              </button>
            </form>
          </>
        )}
        <a href="/login" className="block text-center text-sm text-[#06623B]">Back to login</a>
      </div>
    </div>
  );
}