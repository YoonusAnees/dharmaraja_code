import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import { Search, Mail, Phone, Award, Calendar, HeartHandshake, RefreshCw, Landmark, UserCheck ,Home   } from "lucide-react";

export default function Directory() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/auth/members/directory");
      setMembers(res.data.members || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter members based on search term and exclude current user
  const filteredMembers = members.filter((member) => {
    if (user && member._id === user._id) return false;

    const term = search.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(term) ||
      (member.batchYear && member.batchYear.toLowerCase().includes(term)) ||
      (member.branch && member.branch.toLowerCase().includes(term)) ||
      (member.badge?.name && member.badge.name.toLowerCase().includes(term))
    );
  });

  const getBadgeColors = (badgeName) => {

    if (!badgeName) return "text-white/40 bg-white/5 border-white/5";
    const name = badgeName.toLowerCase();
    if (name.includes("gold")) return "text-gold bg-gold/10 border-gold/20";
    if (name.includes("silver")) return "text-slate-300 bg-slate-300/10 border-slate-300/20";
    if (name.includes("bronze")) return "text-amber-600 bg-amber-600/10 border-amber-600/20";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Title */}
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide">OBA Directory</h1>
            <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-medium">Connect and see fellow Dharmaraja College Old Boys Association members.</p>
          </div>
          <button
            onClick={fetchMembers}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white/60 hover:text-white"
            title="Refresh directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, batch, branch, or badge..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-gold transition-colors text-sm font-medium shadow-md placeholder-white/30"
        />
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-200 border border-red-500/30 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Members Grid */}
      {loading && members.length === 0 ? (
        <div className="py-20 text-center text-white/50 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold mb-3" />
          Loading OBA members directory...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center text-white/40 border border-dashed border-white/10 rounded-3xl text-sm bg-white/5">
          No members matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const totalDonated = member.donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
            return (
              <div
                key={member._id}
                className="rounded-3xl bg-white/5 border border-white/5 p-5 hover:border-white/10 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between shadow-xl space-y-4"
              >
                {/* Header Profile Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-snug">{member.fullName}</h3>
                      <p className="text-white/40 text-xs font-semibold mt-0.5">
                        {member.batchYear ? `Batch of ${member.batchYear}` : "OBA Member"}
                      </p>
                    </div>
                    {member.badge && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wide uppercase shrink-0 ${getBadgeColors(member.badge.name)}`}>
                        <Award className="w-2.5 h-2.5" />
                        {member.badge.name}
                      </span>
                    )}
                  </div>

                  {/* Branch detail */}
                  {member.branch && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                      <Landmark className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{member.branch} Branch</span>
                    </div>
                  )}

                  {/* Contact Info (if provided) */}
                  <div className="text-[11px] text-white/40 space-y-1 font-medium pt-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-white/20 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.contactNumber && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-white/20 shrink-0" />
                        <span>{member.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
                 {/* Job Title */}
                  {member.jobTitle && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                      <UserCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{member.jobTitle}</span>
                    </div>
                  )}
                  {/* Address */}
                  {member.address && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                      <Home className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{member.address}</span>
                    </div>
                  )}
                {/* Contribution details */}
                <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-3.5 space-y-2.5 text-xs">
                  {/* Donations */}
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" /> Donated:
                    </span>
                    <span className="font-black text-emerald-400">
                      {totalDonated > 0 ? `LKR ${totalDonated.toLocaleString()}` : "LKR 0"}
                    </span>
                  </div>

                  {/* Registered events count */}
                  <div className="flex justify-between items-center border-t border-white/5 pt-2">
                    <span className="text-white/40 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" /> Events:
                    </span>
                    <span className="font-semibold text-white/80">
                      {member.events?.length || 0} registered  
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
