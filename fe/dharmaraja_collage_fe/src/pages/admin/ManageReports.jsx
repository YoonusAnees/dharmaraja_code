import { useState, useEffect } from "react";
import api from "../../api/axios";
import {
  TrendingUp, TrendingDown, DollarSign, PieChart, Printer, Plus, X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ManageReports() {
  const [analytics, setAnalytics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    targetType: "campaign",
    campaign: "",
    event: "",
    title: "",
    description: "",
    amount: "",
    receipt: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, campaignsRes, eventsRes] = await Promise.all([
        api.get("/reports/analytics"),
        api.get("/campaigns"),
        api.get("/events"),
      ]);
      setAnalytics(analyticsRes.data.data);
      setCampaigns(campaignsRes.data.campaigns || []);
      setEvents(eventsRes.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 0);
    return () => clearTimeout(t);
  }, []);

  const uploadExpense = async (e) => {
    e.preventDefault();
    const data = new FormData();
    if (expenseForm.targetType === "campaign" && expenseForm.campaign) data.append("campaign", expenseForm.campaign);
    if (expenseForm.targetType === "event" && expenseForm.event) data.append("event", expenseForm.event);
    data.append("title", expenseForm.title);
    data.append("description", expenseForm.description);
    data.append("amount", expenseForm.amount);
    if (expenseForm.receipt) data.append("receipt", expenseForm.receipt);
    try {
      await api.post("/reports/expense", data, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Expense saved!");
      setShowExpenseForm(false);
      setExpenseForm({ targetType: "campaign", campaign: "", event: "", title: "", description: "", amount: "", receipt: null });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error uploading expense");
    }
  };

  const handlePrint = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("OBA Financial Analytics Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Total Income: Rs. ${analytics.totalIncome.toLocaleString()}`, 14, 32);
    doc.text(`Total Expenses: Rs. ${analytics.totalExpenses.toLocaleString()}`, 14, 40);
    doc.text(`Net Balance: Rs. ${analytics.netBalance.toLocaleString()}`, 14, 48);
    let y = 58;
    doc.text("Income Breakdown:", 14, y);
    y += 8;
    Object.entries(analytics.incomeBreakdown).forEach(([type, amount]) => {
      doc.text(`- ${type.toUpperCase()}: Rs. ${amount.toLocaleString()}`, 20, y);
      y += 7;
    });
    autoTable(doc, {
      startY: y + 4,
      head: [["Event", "Budget", "Income", "Expense", "Profit"]],
      body: analytics.eventData.map(ev => [ev.name, ev.budget.toLocaleString(), ev.income.toLocaleString(), ev.expense.toLocaleString(), ev.profit.toLocaleString()]),
      theme: "grid", headStyles: { fillColor: [41, 128, 185] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Campaign", "Target", "Collected", "Expense", "Profit"]],
      body: analytics.campaignData.map(c => [c.name, c.target.toLocaleString(), c.income.toLocaleString(), c.expense.toLocaleString(), c.profit.toLocaleString()]),
      theme: "grid", headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save("OBA_Financial_Analytics_Report.pdf");
  };

  if (loading) return (
    <div className="text-white/60 p-8 text-center text-sm animate-pulse">Analysing financials…</div>
  );

  if (!analytics) return (
    <div className="text-white/40 p-8 text-center text-sm">Unable to load analytics.</div>
  );

  const inp = "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-gold focus:outline-none transition-colors";

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 hide-on-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Financial Analytics</h1>
          <p className="text-white/50 text-xs mt-0.5">Real-time income &amp; expense overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl px-3 py-2 text-xs transition-all cursor-pointer"
          >
            {showExpenseForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showExpenseForm ? "Cancel" : "Add Expense"}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl px-3 py-2 text-xs transition-all shadow-lg shadow-gold/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="print-only hidden text-black text-xl font-black mb-4 border-b border-black pb-3">
        OBA Financial Analytics Report
      </div>

      {/* Expense Form */}
      {showExpenseForm && (
        <form onSubmit={uploadExpense} className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 hide-on-print">
          <h2 className="text-sm font-bold text-white">Record New Expense</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Target</label>
              <select value={expenseForm.targetType} onChange={e => setExpenseForm({ ...expenseForm, targetType: e.target.value })} className={inp}>
                <option value="campaign">Campaign</option>
                <option value="event">Event</option>
                <option value="general">General</option>
              </select>
            </div>

            {expenseForm.targetType === "campaign" && (
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Campaign</label>
                <select required value={expenseForm.campaign} onChange={e => setExpenseForm({ ...expenseForm, campaign: e.target.value })} className={inp}>
                  <option value="">-- Select --</option>
                  {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {expenseForm.targetType === "event" && (
              <div>
                <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Event</label>
                <select required value={expenseForm.event} onChange={e => setExpenseForm({ ...expenseForm, event: e.target.value })} className={inp}>
                  <option value="">-- Select --</option>
                  {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Title</label>
              <input required placeholder="e.g. Venue Booking" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Amount (LKR)</label>
              <input required type="number" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inp} />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Description</label>
            <textarea placeholder="Details…" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className={`${inp} resize-none`} rows={2} />
          </div>

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase mb-1 block">Receipt (optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })}
              className="text-white/60 text-xs block w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowExpenseForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-gold hover:bg-yellow-400 transition-colors shadow-lg shadow-gold/20 cursor-pointer">Save</button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, label: "Total Income", value: analytics.totalIncome, cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
          { icon: TrendingDown, label: "Total Expenses", value: analytics.totalExpenses, cls: "bg-red-500/10 border-red-500/20 text-red-400" },
          { icon: DollarSign, label: "Net Balance", value: analytics.netBalance, cls: analytics.netBalance >= 0 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400" },
        ].map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className={`border rounded-2xl p-4 flex items-center gap-3 print-card ${cls}`}>
            <div className="p-2 rounded-xl bg-white/10 shrink-0 hide-on-print">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide truncate print-text-black">{label}</p>
              <p className="text-base sm:text-lg font-black text-white truncate print-text-black">Rs. {value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Income Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 print-card">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-4 h-4 text-gold hide-on-print" />
          <h2 className="text-sm font-bold text-white print-text-black">Income Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(analytics.incomeBreakdown).map(([type, amount]) => (
            <div key={type} className="bg-black/40 p-3 rounded-xl border border-white/5 print-border">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-0.5 print-text-black">{type}</p>
              <p className="text-sm font-bold text-white print-text-black">Rs. {amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 print-card">
        <h2 className="text-sm font-bold text-white mb-3 print-text-black">Events Financials</h2>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide print-text-black">
                <th className="pb-2 font-semibold">Event</th>
                <th className="pb-2 font-semibold text-white/60">Budget</th>
                <th className="pb-2 font-semibold text-emerald-400">Income</th>
                <th className="pb-2 font-semibold text-red-400">Expense</th>
                <th className="pb-2 font-semibold text-blue-400">Profit</th>
              </tr>
            </thead>
            <tbody className="text-xs text-white print-text-black">
              {analytics.eventData.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-white/30">No events data</td></tr>
              ) : analytics.eventData.map(ev => (
                <tr key={ev.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 font-medium">{ev.name}</td>
                  <td className="py-2.5 text-white/60">Rs. {ev.budget.toLocaleString()}</td>
                  <td className="py-2.5 text-emerald-400">Rs. {ev.income.toLocaleString()}</td>
                  <td className="py-2.5 text-red-400">Rs. {ev.expense.toLocaleString()}</td>
                  <td className="py-2.5 text-blue-400 font-bold">Rs. {ev.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 print-card">
        <h2 className="text-sm font-bold text-white mb-3 print-text-black">Campaigns Financials</h2>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse min-w-[420px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide print-text-black">
                <th className="pb-2 font-semibold">Campaign</th>
                <th className="pb-2 font-semibold">Target</th>
                <th className="pb-2 font-semibold text-emerald-400">Collected</th>
                <th className="pb-2 font-semibold text-red-400">Expense</th>
                <th className="pb-2 font-semibold text-blue-400">Profit</th>
              </tr>
            </thead>
            <tbody className="text-xs text-white print-text-black">
              {analytics.campaignData.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-white/30">No campaigns data</td></tr>
              ) : analytics.campaignData.map(c => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 font-medium">{c.name}</td>
                  <td className="py-2.5 text-white/60">Rs. {c.target.toLocaleString()}</td>
                  <td className="py-2.5 text-emerald-400">Rs. {c.income.toLocaleString()}</td>
                  <td className="py-2.5 text-red-400">Rs. {c.expense.toLocaleString()}</td>
                  <td className="py-2.5 text-blue-400 font-bold">Rs. {c.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .hide-on-print { display: none !important; }
          .print-only { display: block !important; }
          .print-card { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; margin-bottom: 16px; }
          .print-text-black { color: black !important; }
          .print-border { border: 1px solid #ddd !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}