// frontend/src/pages/Reminders.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { getPlan } from "../lib/subscription";
import Toast from "../components/Toast.jsx";

const fmtDate = (d) => {
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  return x.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
};

export default function Reminders() {
  const { id } = useParams(); // groupId
  const nav = useNavigate();

  // 🔒 Premium gate (also guards direct URL access)
  if (getPlan() !== "premium") {
    nav("/upgrade", { state: { backTo: `/groups/${id}/reminders` }, replace: true });
    return null;
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  // form
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // current user id (for delete permission)
  let me = {};
  try { me = JSON.parse(localStorage.getItem("user") || "{}"); } catch(_) {}
  const meId = me?.id || me?._id || null;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reminders/${id}`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const add = async () => {
    setError("");
    if (!name.trim() || !expiresAt) {
      setError("Name and expiry date are required");
      return;
    }
    try {
      let imageUrl = "";
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = up.data?.url || "";
      }

      await api.post("/reminders", {
        groupId: id,
        name: name.trim(),
        quantity: Number(quantity) || 0,
        unit: unit.trim(),
        notes: notes.trim(),
        expiresAt,
        imageUrl,
      });

      // reset form & reload
      setName(""); setQuantity(""); setUnit(""); setNotes(""); setExpiresAt("");
      setFile(null); setPreview("");
      await load();
      setToast({ message: "✅ Product saved" });
    } catch (e) {
      setError(e?.response?.data?.error || "Could not save");
    }
  };

  const removeItem = async (rid) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/reminders/${rid}`);
      await load();
      setToast({ message: "🗑 Reminder deleted" });
    } catch (e) {
      setError(e?.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "#06623B", color: "white" }}
      >
        <button onClick={() => nav(`/groups/${id}`)} className="text-white text-xl" aria-label="Back">
          &lsaquo;
        </button>
        <div className="text-lg font-semibold">Reminders</div>
        <div />
      </header>

      <main className="p-5 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
        )}

        {/* Add form */}
        <div className="bg-white shadow rounded-2xl p-4 space-y-3">
          <div className="text-sm text-gray-600 font-medium">Add product (with photo)</div>

          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={handleFile} />
            {preview && (
              <img src={preview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
            )}
          </div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Product name (e.g., Milk)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex gap-3">
            <input
              className="w-1/3 rounded-xl border px-3 py-2"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              className="w-2/3 rounded-xl border px-3 py-2"
              placeholder="Unit (e.g., pcs, bottles)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />

          <textarea
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            className="rounded-xl px-4 py-3 font-semibold text-white bg-[#06623B]"
            onClick={add}
          >
            Save
          </button>
        </div>

        {/* List */}
        <div className="bg-white shadow rounded-2xl">
          <div className="p-4 border-b text-sm text-gray-600">All items</div>
          {loading ? (
            <div className="p-4 text-gray-600">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-gray-600">No reminders yet.</div>
          ) : (
            <ul>
              {items.map((it) => {
                const days = Number(it.daysLeft || 0);
                const badge =
                  days < 0
                    ? "bg-gray-200 text-gray-700"
                    : days <= 2
                    ? "bg-red-100 text-red-700"
                    : days <= 4
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-700";

                const canDelete =
                  String(it.addedBy?._id || it.addedBy) === String(meId);

                return (
                  <li key={it._id} className="p-4 border-t">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-14 h-14 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg border flex items-center justify-center text-xs text-gray-500">
                            No Photo
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {it.name} {it.quantity ? `× ${it.quantity}` : ""}{" "}
                            {it.unit ? `(${it.unit})` : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            Expires: {fmtDate(it.expiresAt)}
                          </div>
                          {it.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {it.notes}
                            </div>
                          )}
                          <div className="text-[11px] text-gray-500 mt-1">
                            Added by: {it?.addedBy?.name || it?.addedBy?.email || "Unknown"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${badge}`}>
                          {days < 0 ? "Expired" : days === 0 ? "Today" : `${days} day(s) left`}
                        </span>

                        {canDelete && (
                          <button
                            className="text-xs text-red-600 underline"
                            onClick={() => removeItem(it._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type="success"
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}