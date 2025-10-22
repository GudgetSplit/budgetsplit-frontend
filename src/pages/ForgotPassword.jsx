import { useState } from "react";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/forgot", { email });
      setSent(true);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to send reset link");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-5">
      <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center text-[#06623B]">Reset your password</h1>

        {sent ? (
          <div className="text-sm text-gray-700">
            If an account exists for <b>{email}</b>, a reset link has been generated.
            <br />
            <span className="text-gray-500">Dev mode:</span> Check your <b>backend console</b> for the link.
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                className="w-full border rounded-xl px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="w-full py-2 rounded-xl bg-[#06623B] text-white font-semibold">
                Send reset link
              </button>
            </form>
          </>
        )}
        <a href="/login" className="block text-center text-sm text-[#06623B]">Back to login</a>
      </div>
    </div>
  );
}