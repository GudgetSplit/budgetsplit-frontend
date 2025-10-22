import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { setPlan } from "../lib/subscription";

export default function UpgradeCallback() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(loc.search);
        const reference = params.get("reference");
        if (!reference) {
          alert("No reference received");
          return nav("/upgrade", { replace: true });
        }
        const { data } = await api.get(`/billing/paystack/verify?reference=${reference}`);
        if (data?.ok) {
          setPlan("premium");
          // also update local user copy if returned
          if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
          // if you stored backTo in history state, use that; else go to groups
          nav("/groups", { replace: true });
        } else {
          alert("Payment not successful");
          nav("/upgrade", { replace: true });
        }
      } catch (e) {
        alert(e?.response?.data?.error || "Verification failed");
        nav("/upgrade", { replace: true });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-700">Finalizing your upgrade…</div>
    </div>
  );
}