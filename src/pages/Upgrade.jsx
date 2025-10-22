import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { getPlan, setPlan } from "../lib/subscription";

export default function Upgrade() {
  const nav = useNavigate();
  const loc = useLocation();
  const plan = getPlan();
  const backTo = loc.state?.backTo || "/groups";

  const startPaystack = async () => {
    try {
      // choose a test price (NGN)
      const { data } = await api.post("/billing/paystack/init", { amountNgn: 1500 });
      if (data?.authorization_url) {
        window.location.href = data.authorization_url; // go to Paystack checkout
      } else {
        alert("Could not start payment");
      }
    } catch (e) {
      alert(e?.response?.data?.error || "Payment init failed");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="px-5 py-4" style={{ background:"#06623B", color:"white" }}>
        <div className="text-lg font-semibold">Upgrade</div>
      </header>

      <main className="max-w-md mx-auto p-5 space-y-5">
        <div className="bg-white shadow rounded-2xl p-5 space-y-3">
          <div className="text-2xl font-bold">FreshAlert Premium</div>
          <p className="text-sm text-gray-600">
            Upload product photos, set expiry dates, and get automatic reminders 3 days before items expire.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Expiry reminders with photos</li>
            <li>Auto alerts 3 days before expiry</li>
            <li>Business-friendly list views (coming)</li>
            <li>Priority support</li>
          </ul>

          {plan === "premium" ? (
            <button
              onClick={() => nav(backTo)}
              className="w-full rounded-xl px-4 py-3 font-semibold bg-gray-200"
            >
              You’re already Premium ✓
            </button>
          ) : (
            <button
              onClick={startPaystack}
              className="w-full rounded-xl px-4 py-3 font-semibold text-white bg-[#06623B]"
            >
              Upgrade with Paystack
            </button>
          )}

          <div className="text-xs text-gray-500">
            Current plan: <b>{plan}</b>
          </div>
        </div>
      </main>
    </div>
  );
}