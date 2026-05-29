import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import { CheckCircle, XCircle, DollarSign, RefreshCw } from "lucide-react";

export default function MemberManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // member id being processed

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/auth/members");
      setMembers(res.data.members || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchMembers();
  }, [user]);

  const approve = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/auth/approve/${id}`);
      await fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    const reason = prompt("Provide rejection reason (optional)");
    if (reason === null) return; // cancelled
    setActionLoading(id);
    try {
      await api.patch(`/auth/reject/${id}`, { reason });
      await fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const markPaid = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/auth/mark-paid/${id}`);
      await fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = members.filter((m) => m.status !== "approved" || !m.registrationFeePaid);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Member Management</h2>
        <button
          onClick={fetchMembers}
          className="p-2 rounded hover:bg-white/10 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-600/20 text-red-200 p-3 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-white/60">Loading members...</div>
      ) : pending.length === 0 ? (
        <div className="text-center text-white/60">No pending members.</div>
      ) : (
        <table className="w-full table-auto text-sm text-white/80">
          <thead className="text-white/40">
            <tr>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Email</th>
              <th className="px-2 py-1 text-left">Status</th>
              <th className="px-2 py-1 text-left">Fee</th>
              <th className="px-2 py-1 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((m) => (
              <tr key={m._id} className="border-b border-white/5">
                <td className="px-2 py-2">{m.fullName}</td>
                <td className="px-2 py-2">{m.email}</td>
                <td className="px-2 py-2 capitalize">{m.status}</td>
                <td className="px-2 py-2">
                  {m.registrationFeePaid ? (
                    <span className="text-green-400">Paid</span>
                  ) : (
                    <span className="text-yellow-400">Unpaid</span>
                  )}
                </td>
                <td className="px-2 py-2 flex justify-center gap-2">
                  <button
                    onClick={() => approve(m._id)}
                    disabled={actionLoading === m._id}
                    className="p-1 text-green-400 hover:text-green-300"
                    title="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => reject(m._id)}
                    disabled={actionLoading === m._id}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  {!m.registrationFeePaid && (
                    <button
                      onClick={() => markPaid(m._id)}
                      disabled={actionLoading === m._id}
                      className="p-1 text-amber-400 hover:text-amber-300"
                      title="Mark fee paid"
                    >
                      <DollarSign className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
