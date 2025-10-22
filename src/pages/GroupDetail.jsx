// frontend/src/pages/GroupDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Toast from "../components/Toast.jsx";
import Avatar from "../components/Avatar.jsx";
import { getPlan } from "../lib/subscription";


const NGN = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const fmtDate = (d) => {
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  return x.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
};

export default function GroupDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [group, setGroup] = useState(null);
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  // Add-expense modal
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitMode, setSplitMode] = useState("equal");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customShares, setCustomShares] = useState({});

  // Settle-up modal
  const [showSettle, setShowSettle] = useState(false);
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // current user (for permissions and “your balance”)
  let me = {};
  try {
    me = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (_) {}
  const meId = me?.id || me?._id || null;

  // guard: require token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/login");
  }, [nav]);

  // quick header name from cache
  useEffect(() => {
    const raw = localStorage.getItem("groups_cache");
    let local = [];
    try {
      local = raw ? JSON.parse(raw) : [];
    } catch (_) {}
    const g = Array.isArray(local) ? local.find((x) => x._id === id) : null;
    setGroup(g || { _id: id, name: "Group" });
  }, [id]);

  // load latest group, expenses, balances
  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [ex, bal] = await Promise.all([
        api.get(`/expenses/${id}`),
        api.get(`/expenses/balances/${id}`),
      ]);
      setItems(Array.isArray(ex.data) ? ex.data : []);
      setBalances(typeof bal.data === "object" && bal.data ? bal.data : {});

      const gRes = await api.get(`/groups/${id}`);
      setGroup(gRes.data);

      const members = gRes.data.members || [];
      const initShares = {};
      members.forEach((m) => (initShares[m._id] = 0));
      setCustomShares((prev) => (Object.keys(prev).length ? prev : initShares));

      const defaultPayer =
        (members.find((m) => m._id === meId)?._id) || (members[0]?._id) || "";
      setPaidBy((prev) => prev || defaultPayer);

      const defaultReceiver =
        members.find((m) => m._id !== meId)?._id || members[0]?._id || "";
      setSettleTo((prev) => prev || defaultReceiver);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // clipboard helper
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: "✅ Join code copied" });
    } catch {
      setToast({ message: "Copied (fallback).", type: "success" });
    }
  };

  // custom split helpers
  const setShare = (userId, value) => {
    const v = Number(value);
    setCustomShares((s) => ({ ...s, [userId]: Number.isFinite(v) ? v : 0 }));
  };

  const clearCustom = () => {
    if (!group?.members) return;
    const init = {};
    group.members.forEach((m) => (init[m._id] = 0));
    setCustomShares(init);
  };

  const autoFillEqual = () => {
    if (!group?.members || !group.members.length)
      return setError("No members to split");
    const amt = Math.floor(Number(amount) || 0);
    if (!amt || amt <= 0) return setError("Enter a valid amount first");

    const n = group.members.length;
    const base = Math.floor(amt / n);
    let rem = amt % n;

    const next = {};
    group.members.forEach((m, i) => {
      next[m._id] = base + (i < rem ? 1 : 0);
    });

    setSplitMode("custom");
    setCustomShares(next);
  };

  const totalCustom = Object.values(customShares || {}).reduce(
    (a, b) => a + Number(b || 0),
    0
  );
  const amtNum = Number(amount || 0);
  const customMismatch =
    splitMode === "custom" && Math.round(totalCustom) !== Math.round(amtNum);

  // actions
  const addExpense = async () => {
    setError("");

    if (!id) return setError("Invalid group. Please reopen the group.");
    const amt = Number(amount);
    if (!amt || Number.isNaN(amt) || amt <= 0)
      return setError("Enter a valid amount");
    if (!paidBy) return setError("Select who paid");
    if (splitMode === "custom" && customMismatch)
      return setError("Custom splits total must equal the amount");

    try {
      const payload = {
        groupId: id,
        amount: amt,
        paidBy,
        mode: splitMode,
        category: category.trim(),
        description: desc.trim() || category.trim() || "Expense",
        date,
      };
      if (splitMode === "custom") {
        payload.splits = Object.entries(customShares).map(
          ([userId, share]) => ({ userId, share: Number(share || 0) })
        );
      }

      await api.post("/expenses", payload);

      setShowAdd(false);
      setAmount("");
      setCategory("");
      setDesc("");
      setDate(new Date().toISOString().slice(0, 10));
      setSplitMode("equal");
      await load();
      setToast({ message: "✅ Expense added successfully!" });
    } catch (e) {
      setError(e?.response?.data?.error || "Add failed");
    }
  };

  const settleUp = async () => {
    setError("");
    const amt = Number(settleAmount);
    if (!settleTo) return setError("Choose who you paid");
    if (!amt || Number.isNaN(amt) || amt <= 0)
      return setError("Enter a valid amount");

    try {
      await api.post("/expenses", {
        groupId: id,
        description: "Settle up",
        category: "Repayment",
        amount: amt,
        mode: "custom",
        paidBy: meId,
        splits: [{ userId: settleTo, share: amt }],
        date: new Date().toISOString().slice(0, 10),
      });
      setShowSettle(false);
      setSettleAmount("");
      await load();
      setToast({ message: "✅ Repayment recorded" });
    } catch (e) {
      setError(e?.response?.data?.error || "Could not record repayment");
    }
  };

  // delete expense (creator-only; button rendered conditionally)
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      await load();
      setToast({ message: "🗑 Expense deleted" });
    } catch (e) {
      setError(e?.response?.data?.error || "Delete failed");
    }
  };

  // group management
  const handleLeaveGroup = async () => {
    if (!confirm("Leave this group?")) return;
    try {
      await api.post(`/groups/${id}/leave`);
      setToast({ message: "👋 You left the group" });
      nav("/groups");
    } catch (e) {
      setError(e?.response?.data?.error || "Could not leave group");
    }
  };

  const handleRemoveMember = async (userId, displayName) => {
    if (!confirm(`Remove ${displayName || "this member"} from the group?`))
      return;
    try {
      await api.post(`/groups/${id}/remove`, { userId });
      await load();
      setToast({ message: "✅ Member removed" });
    } catch (e) {
      setError(e?.response?.data?.error || "Could not remove member");
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Permanently delete this group? This cannot be undone."))
      return;
    try {
      await api.delete(`/groups/${id}`);
      setToast({ message: "🗑 Group deleted" });
      nav("/groups");
    } catch (e) {
      setError(e?.response?.data?.error || "Could not delete group");
    }
  };

  // my balance
  const myNet =
    meId && balances && Object.prototype.hasOwnProperty.call(balances, meId)
      ? Number(balances[meId] || 0)
      : 0;

  return (
    <div className="min-h-screen bg-white">
      <header
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: "#06623B", color: "white" }}
      >
        <button
          onClick={() => nav("/groups")}
          className="text-white text-xl"
          aria-label="Back"
        >
          &lsaquo;
        </button>
        <div className="text-lg font-semibold">{group?.name || "Group"}</div>

        <div className="flex items-center gap-2">
          {/* Leave group (always visible) */}
          <button
            className="text-xs underline text-white/90 hover:text-white"
            onClick={handleLeaveGroup}
            title="Leave group"
          >
            Leave
          </button>

          {/* Owner-only: Delete group */}
          {String(group?.owner) === String(meId) && (
            <button
              className="text-xs underline text-red-200 hover:text-white"
              onClick={handleDeleteGroup}
              title="Delete group"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      {/* Members & Copy Code */}
      <div className="px-5 pt-4">
        <div className="bg-white shadow rounded-xl p-4">
         <div className="flex items-center justify-between gap-2">
  <div className="text-sm text-gray-600">Members</div>
  <div className="flex items-center gap-2">
    <button
      className={`text-xs px-3 py-1 rounded-lg border ${
        getPlan() === "premium" ? "" : "opacity-90"
      }`}
      onClick={() => {
        if (getPlan() !== "premium") {
          // Send to Upgrade and come back here after
          nav("/upgrade", { state: { backTo: `/groups/${id}/reminders` } });
        } else {
          nav(`/groups/${id}/reminders`);
        }
      }}
      title={getPlan() === "premium" ? "Open Reminders" : "Premium feature"}
    >
      {getPlan() === "premium" ? "Reminders" : "Reminders 🔒"}
    </button>

    {group?.joinCode && (
      <button
        className="text-xs bg-[#06623B] text-white px-3 py-1 rounded-lg"
        onClick={() => copy(group.joinCode)}
      >
        Copy Code: {group.joinCode}
      </button>
    )}
  </div>
</div>

          <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar py-1">
            {(group?.members || []).map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              >
                <Avatar name={m.name || m.email} size={28} />
                <span className="text-sm">{m.name || m.email}</span>

                {/* Owner-only remove (cannot remove owner) */}
                {String(group?.owner) === String(meId) &&
                  String(m._id) !== String(group?.owner) && (
                    <button
                      className="ml-2 text-xs text-red-600 underline"
                      onClick={() =>
                        handleRemoveMember(m._id, m.name || m.email)
                      }
                      title="Remove member"
                    >
                      Remove
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="p-5 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Your balance */}
        <div className="bg-white shadow rounded-xl p-4">
          <div className="text-sm text-gray-600 mb-1">Your balance</div>
          <div
            className={`text-lg font-semibold ${
              myNet >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {myNet >= 0
              ? `You are owed ${NGN(myNet)}`
              : `You owe ${NGN(Math.abs(myNet))}`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="rounded-xl px-4 py-3 font-semibold text-white bg-[#06623B]"
            onClick={() => {
              setShowAdd(true);
              setError("");
            }}
          >
            Add Expense
          </button>

          <button
            className="rounded-xl px-4 py-3 font-semibold bg-[#F7C948] text-gray-900"
            onClick={() => {
              setShowSettle(true);
              setError("");
            }}
          >
            Settle up
          </button>
        </div>

        {/* Recent activity */}
        <div className="bg-white shadow rounded-xl">
          <div className="p-4 border-b text-sm text-gray-600">
            Recent activity
          </div>
          {loading ? (
            <div className="p-4 text-gray-600">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-gray-600">No expenses yet.</div>
          ) : (
            <ul>
              {items.map((it) => (
                <li key={it._id} className="p-4 border-t">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={it?.paidBy?.name || it?.paidBy?.email || "?"}
                        size={28}
                      />
                      <div className="font-medium">
                        {(it?.paidBy?.name || "Someone")} paid
                      </div>
                    </div>
                    <div className="text-sm font-semibold flex items-center gap-3">
                      {NGN(it.amount)}
                      {String(it.createdBy) === String(meId) && (
                        <button
                          className="text-xs text-red-600 underline"
                          onClick={() => handleDeleteExpense(it._id)}
                          title="Delete this expense"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center justify-between mt-0.5">
                    <span>{it.category || it.description}</span>
                    <span>{fmtDate(it.date || it.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Per-member balances */}
        {group?.members && group.members.length > 0 && (
          <div className="bg-white shadow rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-2">Balances by member</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Member</th>
                  <th className="py-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {group.members.map((m) => {
                  const val = Number(balances[m._id] || 0);
                  return (
                    <tr key={m._id} className="border-t">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name || m.email} size={28} />
                          <span>{m.name || m.email}</span>
                        </div>
                      </td>
                      <td
                        className={`py-2 font-medium ${
                          val >= 0 ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {val >= 0
                          ? `+${NGN(val)}`
                          : `-${NGN(Math.abs(val))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3">
            <div className="text-lg font-semibold">Add Expense</div>

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                className="w-full rounded-xl border pl-8 pr-3 py-2"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Paid By */}
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Paid by</div>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {(group?.members || []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name || m.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Split mode */}
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Split</div>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={splitMode}
                onChange={(e) => setSplitMode(e.target.value)}
              >
                <option value="equal">Split equally</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Category & Desc */}
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Category (e.g., Groceries)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            {/* Date */}
            <div className="text-sm">
              <div className="text-gray-600 mb-1">Date</div>
              <input
                type="date"
                className="w-full rounded-xl border px-3 py-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Custom Split with controls, avatars, progress */}
            {splitMode === "custom" && group?.members && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Custom split</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs px-3 py-1 rounded-lg border"
                      onClick={clearCustom}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="text-xs px-3 py-1 rounded-lg bg-[#06623B] text-white"
                      onClick={autoFillEqual}
                    >
                      Auto-fill equal
                    </button>
                  </div>
                </div>

                {group.members.map((m) => (
                  <div key={m._id} className="flex items-center gap-3">
                    <Avatar name={m.name || m.email} size={26} />
                    <div className="flex-1 text-sm">{m.name || m.email}</div>
                    <input
                      type="number"
                      min="0"
                      className="w-24 rounded-xl border px-3 py-2 text-right"
                      placeholder="0"
                      value={customShares[m._id] ?? ""}
                      onChange={(e) => setShare(m._id, e.target.value)}
                    />
                  </div>
                ))}

                <div
                  className={`text-xs ${
                    customMismatch ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  Total entered: {NGN(totalCustom)} / Amount: {NGN(amtNum)}
                </div>

                {(() => {
                  const percent =
                    amtNum > 0
                      ? Math.min(100, Math.round((totalCustom / amtNum) * 100))
                      : 0;
                  const barWidth = `${percent}%`;
                  const barColor = customMismatch ? "bg-red-500" : "bg-[#06623B]";
                  return (
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: barWidth }} />
                      </div>
                      <div className="text-xs text-gray-600">{percent}% allocated</div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl px-4 py-2 bg-gray-200"
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                  setSplitMode("equal");
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl px-4 py-2 text-white bg-[#06623B]"
                onClick={addExpense}
              >
                Add
              </button>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
      )}

      {/* Settle-up Modal */}
      {showSettle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3">
            <div className="text-lg font-semibold">Settle up</div>

            <div className="text-sm">
              <div className="text-gray-600 mb-1">You paid</div>
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={settleTo}
                onChange={(e) => setSettleTo(e.target.value)}
              >
                {(group?.members || [])
                  .filter((m) => m._id !== meId)
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name || m.email}
                    </option>
                  ))}
              </select>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                className="w-full rounded-xl border pl-8 pr-3 py-2"
                placeholder="Amount"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl px-4 py-2 bg-gray-200"
                onClick={() => {
                  setShowSettle(false);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl px-4 py-2 text-white bg-[#06623B]"
                onClick={settleUp}
              >
                Save
              </button>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
      )}

      {/* Toast */}
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