import { useEffect, useState } from "react";
import api from "../../api/axios";
import StatCard from "../../components/common/StatCard";
import { Check, Mail, Phone, Users, ShieldAlert, Clock, DollarSign, RefreshCw, Landmark, Edit, Trash2, X } from "lucide-react";

export default function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

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
    fetchMembers();
  }, []);

  const handleApprove = async (memberId) => {
    setActionLoading(memberId);
    setSuccessMsg("");
    setError("");
    try {
      await api.patch(`/auth/approve/${memberId}`);
      setSuccessMsg("Member approved successfully! Login credentials email sent via Brevo.");
      fetchMembers();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (memberId) => {
    setActionLoading(memberId);
    setSuccessMsg("");
    setError("");
    try {
      await api.patch(`/auth/mark-paid/${memberId}`);
      setSuccessMsg("Member marked as paid successfully!");
      fetchMembers();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to mark as paid");
    } finally {
      setActionLoading(null);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    batchYear: "",
    branch: "",
    role: "member",
    status: "pending",
    registrationFeePaid: false,
  });

  const handleEditClick = (member) => {
    setSelectedMember(member);
    setEditForm({
      fullName: member.fullName || "",
      email: member.email || "",
      contactNumber: member.contactNumber || "",
      batchYear: member.batchYear || "",
      branch: member.branch || "",
      role: member.role || "member",
      status: member.status || "pending",
      registrationFeePaid: member.registrationFeePaid || false,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(selectedMember._id);
    setError("");
    setSuccessMsg("");
    try {
      await api.put(`/auth/members/${selectedMember._id}`, editForm);
      setSuccessMsg("Member updated successfully!");
      setIsEditModalOpen(false);
      fetchMembers();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) {
      return;
    }
    setActionLoading(memberId);
    setError("");
    setSuccessMsg("");
    try {
      await api.delete(`/auth/members/${memberId}`);
      setSuccessMsg("Member deleted successfully!");
      fetchMembers();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete member");
    } finally {
      setActionLoading(null);
    }
  };

  const totalMembers = members.length;
  const pendingApprovals = members.filter((m) => m.status === "pending").length;
  const paidMembers = members.filter((m) => m.registrationFeePaid).length;
  const unpaidMembers = members.filter((m) => !m.registrationFeePaid).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">Admin Dashboard</h1>
            <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">Manage member registrations, payments, and approvals</p>
          </div>
          <button
            onClick={fetchMembers}
            className="flex items-center gap-2 bg-emerald-950 border border-white/10 hover:bg-emerald-900 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm">
          <Check className="w-5 h-5 bg-emerald-500 text-black rounded-full p-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 text-red-200 border border-red-500/30 p-4 rounded-2xl text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Members" value={totalMembers.toString()} />
        <StatCard title="Pending Approvals" value={pendingApprovals.toString()} />
        <StatCard title="Paid Registration" value={paidMembers.toString()} />
        <StatCard title="Unpaid Members" value={unpaidMembers.toString()} />
      </div>

      {/* Members Section */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden">
        <h2 className="text-lg sm:text-xl font-black text-white mb-6">Manage Registrations & Payments</h2>

        {loading && members.length === 0 ? (
          <div className="py-20 text-center text-white/50">
            <RefreshCw className="w-10 h-10 animate-spin mx-auto text-gold mb-3" />
            Loading registered members...
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
            No registered members found.
          </div>
        ) : (
          <>
            {/* ================= DESKTOP TABLE VIEW ================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Member Info</th>
                    <th className="py-4 px-4">Batch / Branch</th>
                    <th className="py-4 px-4">Fee Payment</th>
                    <th className="py-4 px-4">System Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      {/* Member Info */}
                      <td className="py-5 px-4">
                        <div>
                          <div className="font-bold text-white text-base leading-snug">{member.fullName}</div>
                          <div className="flex gap-4 mt-1.5 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-gold" />
                              {member.email}
                            </span>
                            {member.contactNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-gold" />
                                {member.contactNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Batch & Branch */}
                      <td className="py-5 px-4">
                        <div>
                          <div className="text-white text-sm font-medium">
                            {member.batchYear ? `Batch: ${member.batchYear}` : "N/A"}
                          </div>
                          {member.branch && (
                            <div className="text-xs text-white/40 flex items-center gap-1 mt-1">
                              <Landmark className="w-3.5 h-3.5 text-gold" />
                              {member.branch}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Fee Payment */}
                      <td className="py-5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            member.registrationFeePaid
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {member.registrationFeePaid ? "Paid (LKR 1,000)" : "Unpaid"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-5 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            member.status === "approved"
                              ? "bg-emerald-500 text-black"
                              : member.status === "pending"
                              ? "bg-gold text-black animate-pulse"
                              : "bg-red-500 text-black"
                          }`}
                        >
                          {member.status === "approved"
                            ? "Approved"
                            : member.status === "pending"
                            ? "Pending"
                            : "Rejected"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {!member.registrationFeePaid && (
                            <button
                              onClick={() => handleMarkPaid(member._id)}
                              disabled={actionLoading !== null}
                              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black text-xs font-bold rounded-xl px-2.5 py-1.5 shadow transition-colors cursor-pointer"
                              title="Mark as Paid"
                            >
                              {actionLoading === member._id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <DollarSign className="w-3.5 h-3.5" />
                              )}
                              Paid
                            </button>
                          )}
                          
                          {member.status === "pending" && (
                            <button
                              onClick={() => handleApprove(member._id)}
                              disabled={actionLoading !== null}
                              className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black text-xs font-bold rounded-xl px-2.5 py-1.5 shadow transition-colors cursor-pointer"
                              title="Approve Member"
                            >
                              {actionLoading === member._id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => handleEditClick(member)}
                            disabled={actionLoading !== null}
                            className="p-1.5 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-black rounded-xl shadow transition-colors cursor-pointer"
                            title="Edit Member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(member._id)}
                            disabled={actionLoading !== null}
                            className="p-1.5 bg-red-500 hover:bg-red-400 disabled:bg-red-500/50 text-black rounded-xl shadow transition-colors cursor-pointer"
                            title="Delete Member"
                          >
                            {actionLoading === member._id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE CARD LIST VIEW ================= */}
            <div className="md:hidden space-y-4">
              {members.map((member) => (
                <div 
                  key={member._id}
                  className="rounded-2xl bg-white/5 border border-white/5 p-4.5 space-y-4 hover:border-white/10 transition-all shadow-lg"
                >
                  {/* Name and Meta */}
                  <div className="space-y-1.5">
                    <div className="font-black text-white text-base leading-snug">{member.fullName}</div>
                    <div className="text-[11px] text-white/40 font-semibold space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.contactNumber && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>{member.contactNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-t border-b border-white/5 py-3">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold">Registration</span>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        member.registrationFeePaid
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}>
                        {member.registrationFeePaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold">System Status</span>
                      <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        member.status === "approved"
                          ? "bg-emerald-500 text-black border-emerald-500/30"
                          : member.status === "pending"
                          ? "bg-gold text-black border-gold/30 animate-pulse"
                          : "bg-red-500 text-black border-red-500/30"
                      }`}>
                        {member.status === "approved" ? "Approved" : member.status === "pending" ? "Pending" : "Rejected"}
                      </span>
                    </div>
                    {member.batchYear && (
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold">Batch</span>
                        <span className="font-semibold text-white mt-1 block">{member.batchYear}</span>
                      </div>
                    )}
                    {member.branch && (
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase tracking-wider font-bold">Branch</span>
                        <span className="font-semibold text-white mt-1 block truncate max-w-[120px]" title={member.branch}>{member.branch}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-end">
                    {!member.registrationFeePaid && (
                      <button
                        onClick={() => handleMarkPaid(member._id)}
                        disabled={actionLoading !== null}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl px-3 py-2 flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-amber-500/10"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Paid
                      </button>
                    )}
                    {member.status === "pending" && (
                      <button
                        onClick={() => handleApprove(member._id)}
                        disabled={actionLoading !== null}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl px-3 py-2 flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-emerald-500/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(member)}
                      className="p-2 bg-blue-500 hover:bg-blue-400 text-black rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="p-2 bg-red-500 hover:bg-red-400 text-black rounded-xl transition-colors cursor-pointer shadow-md shadow-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-white space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-gold">Edit Member Details</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-white/50 font-bold uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 font-bold uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 font-bold uppercase">Contact Number</label>
                  <input
                    type="text"
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 font-bold uppercase">Batch Year</label>
                  <input
                    type="text"
                    value={editForm.batchYear}
                    onChange={(e) => setEditForm({ ...editForm, batchYear: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase">Branch</label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 font-bold uppercase">System Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 font-bold uppercase">Approval Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="registrationFeePaid"
                  checked={editForm.registrationFeePaid}
                  onChange={(e) => setEditForm({ ...editForm, registrationFeePaid: e.target.checked })}
                  className="w-4 h-4 accent-gold cursor-pointer"
                />
                <label htmlFor="registrationFeePaid" className="text-sm font-semibold select-none cursor-pointer">
                  Registration Fee Paid (LKR 1,000)
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-5 py-2 bg-gold hover:bg-yellow-500 disabled:bg-gold/50 text-black rounded-xl text-sm font-bold shadow-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  {actionLoading === selectedMember?._id && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}