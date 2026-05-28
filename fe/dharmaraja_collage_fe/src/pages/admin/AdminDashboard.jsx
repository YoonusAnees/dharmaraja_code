import { useEffect, useState } from "react";
import api from "../../api/axios";
import StatCard from "../../components/common/StatCard";
import {
  Check,
  Mail,
  Phone,
  DollarSign,
  RefreshCw,
  Landmark,
  Edit,
  Trash2,
  X,
} from "lucide-react";

export default function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // =========================
  // SEPARATE LOADING STATES
  // =========================
  const [loadingState, setLoadingState] = useState({
    approve: null,
    paid: null,
    delete: null,
    edit: null,
    deletePayment: null,
    reject: null,
  });

  const setLoadingAction = (type, id) => {
    setLoadingState((prev) => ({
      ...prev,
      [type]: id,
    }));
  };

  const clearLoadingAction = (type) => {
    setLoadingState((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  // =========================
  // FETCH MEMBERS
  // =========================
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/auth/members");

      setMembers(res.data.members || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load members"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH PENDING PAYMENTS
  // =========================
  const fetchPendingPayments = async () => {
    try {
      setLoadingPayments(true);
      setError("");

      const res = await api.get("/payments/pending");

      setPendingPayments(res.data.payments || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load pending payments"
      );
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
      fetchPendingPayments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // =========================
  // APPROVE MEMBER
  // =========================
  const handleApprove = async (memberId) => {
    setLoadingAction("approve", memberId);

    setSuccessMsg("");
    setError("");

    try {
      await api.patch(`/auth/approve/${memberId}`);

      setSuccessMsg(
        "Member approved successfully! Login credentials sent."
      );

      fetchMembers();

      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Approval failed"
      );
    } finally {
      clearLoadingAction("approve");
    }
  };

  // =========================
  // MARK AS PAID
  // =========================
  const handleMarkPaid = async (memberId) => {
    setLoadingAction("paid", memberId);

    setSuccessMsg("");
    setError("");

    try {
      await api.patch(`/auth/mark-paid/${memberId}`);

      setSuccessMsg("Member marked as paid successfully!");

      fetchMembers();

      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to mark as paid"
      );
    } finally {
      clearLoadingAction("paid");
    }
  };

  // =========================
  // REJECT MEMBER
  // =========================
  const handleReject = async (memberId) => {
    const reason = window.prompt("Enter rejection reason (optional):");
    setLoadingAction("reject", memberId);
    setSuccessMsg("");
    setError("");
    try {
      await api.patch(`/auth/reject/${memberId}`, { reason });
      setSuccessMsg("Member rejected and removed successfully!");
      fetchMembers();
      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Rejection failed"
      );
    } finally {
      clearLoadingAction("reject");
    }
  };

  // =========================
  // DELETE MEMBER
  // =========================
  const handleDelete = async (memberId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this member?"
    );

    if (!confirmDelete) return;

    setLoadingAction("delete", memberId);

    setSuccessMsg("");
    setError("");

    try {
      await api.delete(`/auth/members/${memberId}`);

      setSuccessMsg("Member deleted successfully!");

      fetchMembers();

      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to delete member"
      );
    } finally {
      clearLoadingAction("delete");
    }
  };

  // =========================
  // DELETE PENDING PAYMENT
  // =========================
  const handleDeletePayment = async (paymentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pending payment from the database?"
    );

    if (!confirmDelete) return;

    setLoadingAction("deletePayment", paymentId);

    setSuccessMsg("");
    setError("");

    try {
      await api.delete(`/payments/${paymentId}`);

      setSuccessMsg("Pending payment deleted successfully!");

      fetchPendingPayments();
      fetchMembers();

      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to delete payment"
      );
    } finally {
      clearLoadingAction("deletePayment");
    }
  };

  // =========================
  // EDIT MODAL
  // =========================
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

  // =========================
  // UPDATE MEMBER
  // =========================
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    setLoadingAction("edit", selectedMember._id);

    setError("");
    setSuccessMsg("");

    try {
      await api.put(
        `/auth/members/${selectedMember._id}`,
        editForm
      );

      setSuccessMsg("Member updated successfully!");

      setIsEditModalOpen(false);

      fetchMembers();

      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update member"
      );
    } finally {
      clearLoadingAction("edit");
    }
  };

  // =========================
  // STATS
  // =========================
  const totalMembers = members.length;

  const pendingApprovals = members.filter(
    (m) => m.status === "pending"
  ).length;

  const paidMembers = members.filter(
    (m) => m.registrationFeePaid
  ).length;

  const unpaidMembers = members.filter(
    (m) => !m.registrationFeePaid
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">
            Admin Dashboard
          </h1>

          <p className="text-white/60 text-sm mt-1">
            Manage registrations and approvals
          </p>
        </div>

        <button
          onClick={() => {
            fetchMembers();
            fetchPendingPayments();
          }}
          className="flex items-center gap-2 bg-emerald-950 border border-white/10 hover:bg-emerald-900 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading || loadingPayments ? "animate-spin" : ""
              }`}
          />

          Refresh
        </button>
      </div>

      {/* SUCCESS */}
      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Members"
          value={totalMembers.toString()}
        />

        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.toString()}
        />

        <StatCard
          title="Paid Registration"
          value={paidMembers.toString()}
        />

        <StatCard
          title="Unpaid Members"
          value={unpaidMembers.toString()}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
        <h2 className="text-xl font-black text-white mb-6">
          Manage Members
        </h2>

        {loading ? (
          <div className="py-20 text-center text-white/50">
            <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3" />
            Loading members...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase">
                  <th className="py-4 px-4">Member</th>
                  <th className="py-4 px-4">Batch</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => (
                  <tr
                    key={member._id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    {/* MEMBER */}
                    <td className="py-5 px-4">
                      <div>
                        <div className="font-bold text-white">
                          {member.fullName}
                        </div>

                        <div className="flex gap-4 mt-1 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-yellow-400" />
                            {member.email}
                          </span>

                          {member.contactNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-yellow-400" />
                              {member.contactNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* BATCH */}
                    <td className="py-5 px-4 ">
                      <div className="text-white text-sm">
                        {member.batchYear || "N/A"}
                      </div>

                      {member.branch && (
                        <div className="text-xs text-white/40 flex items-center gap-1 mt-1">
                          <Landmark className="w-3.5 h-3.5 text-yellow-400" />
                          {member.branch}
                        </div>
                      )}
                    </td>

                    {/* PAYMENT */}
                    <td className="py-5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${member.registrationFeePaid
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                      >
                        {member.registrationFeePaid
                          ? "Paid"
                          : "Unpaid"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="py-5 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${member.status === "approved"
                          ? "bg-emerald-500 text-black"
                          : member.status === "pending"
                            ? "bg-yellow-400 text-black"
                            : "bg-red-500 text-black"
                          }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-5 px-4">
                      <div className="flex justify-end gap-2">


                        {/* APPROVE */}
                        {member.status === "pending" && (
                          <button
                            onClick={() =>
                              handleApprove(member._id)
                            }
                            disabled={
                              loadingState.approve ===
                              member._id
                            }
                            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl px-3 py-2"
                          >
                            {loadingState.approve ===
                              member._id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}

                            Approve
                          </button>
                        )}

                        {/* REJECT */}
                        {member.status === "pending" && (
                          <button
                            onClick={() => handleReject(member._id)}
                            disabled={loadingState.reject === member._id}
                            className="inline-flex items-center gap-1 bg-gray-500 hover:bg-gray-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl px-3 py-2"
                          >
                            {loadingState.reject === member._id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        )}

                        {/* EDIT */}
                        <button
                          onClick={() =>
                            handleEditClick(member)
                          }
                          className="p-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-black"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() =>
                            handleDelete(member._id)
                          }
                          disabled={
                            loadingState.delete ===
                            member._id
                          }
                          className="p-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-xl text-black"
                        >
                          {loadingState.delete ===
                            member._id ? (
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
        )}
      </div>


      {/* PENDING PAYMENTS SECTION */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
        <h2 className="text-xl font-black text-white mb-6">
          Manage Pending Payments
        </h2>

        {loadingPayments ? (
          <div className="py-20 text-center text-white/50">
            <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3 text-gold" />
            Loading pending payments...
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl text-sm bg-white/5">
            No pending payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase">
                  <th className="py-4 px-4">User</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Item Details</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    {/* USER */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">
                        {payment.user?.fullName || "Unknown"}
                      </div>
                      <div className="text-xs text-white/40">
                        {payment.user?.email || "N/A"}
                      </div>
                    </td>

                    {/* TYPE */}
                    <td className="py-4 px-4">
                      <span className="capitalize text-white text-sm">
                        {payment.type}
                      </span>
                    </td>

                    {/* ITEM DETAILS */}
                    <td className="py-4 px-4">
                      <div className="text-white text-sm">
                        {payment.type === "donation" && payment.item?.name
                          ? `Campaign: ${payment.item.name}`
                          : payment.type === "event" && payment.item?.title
                            ? `Event: ${payment.item.title}`
                            : payment.type === "badge" && payment.item?.name
                              ? `Badge: ${payment.item.name}`
                              : payment.type === "registration"
                                ? "Membership Registration Fee"
                                : "N/A"}
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">
                        LKR {payment.amount.toLocaleString()}
                      </div>
                    </td>

                    {/* DATE */}
                    <td className="py-4 px-4 text-white/60 text-sm">
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                        : "N/A"}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDeletePayment(payment._id)}
                          disabled={
                            loadingState.deletePayment === payment._id
                          }
                          className="p-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-xl text-black"
                          title="Delete Pending Payment"
                        >
                          {loadingState.deletePayment === payment._id ? (
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
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg text-white">
            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <h3 className="text-xl font-bold">
                Edit Member
              </h3>

              <button
                onClick={() =>
                  setIsEditModalOpen(false)
                }
                className="p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleEditSubmit}
              className="space-y-4"
            >
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    fullName: e.target.value,
                  })
                }
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              />

              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    email: e.target.value,
                  })
                }
                placeholder="Email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              />

              <input
                type="text"
                value={editForm.contactNumber}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    contactNumber: e.target.value,
                  })
                }
                placeholder="Contact Number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setIsEditModalOpen(false)
                  }
                  className="px-5 py-2 border border-white/10 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loadingState.edit ===
                    selectedMember?._id
                  }
                  className="px-5 py-2 bg-yellow-400 text-black rounded-xl font-bold flex items-center gap-2"
                >
                  {loadingState.edit ===
                    selectedMember?._id && (
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