import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Groups() {
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  <button
  className="text-xs underline text-white/90 hover:text-white"
  onClick={() => nav("/upgrade")}
>
  Upgrade
</button>

  // Modals + inputs
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) nav("/login");
  }, [nav]);

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const { data } = await api.get("/groups/mine");
        setGroups(data);
        localStorage.setItem("groups_cache", JSON.stringify(data));
      } catch (e) {
        setError(e?.response?.data?.error || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createGroup = async () => {
    setError("");
    if (!name.trim()) return setError("Enter a group name");
    try {
      const { data } = await api.post("/groups", { name: name.trim() });
      const next = [data, ...groups];
      setGroups(next);
      localStorage.setItem("groups_cache", JSON.stringify(next));
      setName("");
      setShowCreate(false);
      alert(`Group created. Join code: ${data.joinCode}`);
    } catch (e) {
      setError(e?.response?.data?.error || "Create failed");
    }
  };

  const joinByCode = async () => {
    setError("");
    if (!code.trim()) return setError("Enter a join code");
    try {
      const { data } = await api.post("/groups/join", { code: code.trim().toUpperCase() });
      const next = [data, ...groups.filter((x) => x._id !== data._id)];
      setGroups(next);
      localStorage.setItem("groups_cache", JSON.stringify(next));
      setCode("");
      setShowJoin(false);
      alert(`Joined group: ${data.name}`);
    } catch (e) {
      setError(e?.response?.data?.error || "Join failed");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SINGLE header with Logout */}
      <header className="px-5 py-4 flex items-center justify-between" style={{ background:"#06623B", color:"white" }}>
        <h1 className="text-xl font-semibold">My Groups</h1>
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
          className="bg-white text-[#06623B] px-3 py-1 rounded-lg text-sm font-medium"
        >
          Logout
        </button>
      </header>

      <main className="p-5 space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="rounded-xl px-4 py-3 font-semibold text-white bg-[#06623B]"
            onClick={() => setShowCreate(true)}
          >
            Create Group
          </button>
          <button
            className="rounded-xl px-4 py-3 font-semibold bg-[#F7C948] text-gray-900"
            onClick={() => setShowJoin(true)}
          >
            Join by Code
          </button>
        </div>

        {/* List */}
        <div className="bg-white shadow rounded-xl">
          <div className="p-4 border-b text-sm text-gray-600">Your groups</div>

          {loading ? (
            <div className="p-4 text-gray-600">Loading…</div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-gray-600">No groups yet.</div>
          ) : (
            <ul>
              {groups.map((g) => (
                <li
                  key={g._id}
                  className="p-4 border-t flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => nav(`/groups/${g._id}`)}
                >
                  <div>
                    <div className="font-medium capitalize">{g.name}</div>
                    <div className="text-xs text-gray-500">Code: {g.joinCode}</div>
                  </div>
                  <span className="text-gray-400">›</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Create Group modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3">
            <div className="text-lg font-semibold">Create Group</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g., Couple"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl px-4 py-2 bg-gray-200" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="flex-1 rounded-xl px-4 py-2 text-white bg-[#06623B]" onClick={createGroup}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join by code modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3">
            <div className="text-lg font-semibold">Join by Code</div>
            <input
              className="w-full rounded-xl border px-3 py-2 uppercase"
              placeholder="e.g., AB4F9Q"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl px-4 py-2 bg-gray-200" onClick={() => setShowJoin(false)}>
                Cancel
              </button>
              <button className="flex-1 rounded-xl px-4 py-2 text-white bg-[#06623B]" onClick={joinByCode}>
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}