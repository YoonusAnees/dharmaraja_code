import { useState, useEffect } from "react";
import api from "../../api/axios";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/reports/analytics");
        setAnalytics(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("OBA Financial Transparency Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Total Income: Rs. ${analytics.totalIncome.toLocaleString()}`, 14, 32);
    doc.text(`Total Expenses: Rs. ${analytics.totalExpenses.toLocaleString()}`, 14, 40);
    doc.text(`Net Balance: Rs. ${analytics.netBalance.toLocaleString()}`, 14, 48);
    doc.text("Income Breakdown:", 14, 58);
    let y = 66;
    Object.entries(analytics.incomeBreakdown).forEach(([type, amount]) => {
      doc.text(`- ${type.toUpperCase()}: Rs. ${amount.toLocaleString()}`, 20, y);
      y += 7;
    });
    autoTable(doc, {
      startY: y + 4,
      head: [["Event", "Budget", "Income", "Expense", "Net Balance"]],
      body: analytics.eventData.map(ev => [ev.name, ev.budget.toLocaleString(), ev.income.toLocaleString(), ev.expense.toLocaleString(), ev.profit.toLocaleString()]),
      theme: "grid", headStyles: { fillColor: [218, 165, 32] },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Campaign", "Target", "Collected", "Expense", "Net Balance"]],
      body: analytics.campaignData.map(c => [c.name, c.target.toLocaleString(), c.income.toLocaleString(), c.expense.toLocaleString(), c.profit.toLocaleString()]),
      theme: "grid", headStyles: { fillColor: [218, 165, 32] },
    });
    doc.save("OBA_Transparency_Report.pdf");
  };

  if (loading) return (
    <div className="text-white/60 p-8 text-center text-sm animate-pulse">
      Loading transparency report…
    </div>
  );

  if (!analytics) return (
    <div className="text-white/40 p-8 text-center text-sm">
      Unable to load report data.
    </div>
  );

  const SummaryCard = ({ color, icon: Icon, label, value }) => (
    <div className={`border rounded-2xl p-4 flex items-center gap-3 ${color}`}>
      <div className="p-2 rounded-xl bg-white/10 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide truncate">{label}</p>
        <p className="text-base sm:text-lg font-black text-white truncate">Rs. {value.toLocaleString()}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 hide-on-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Transparency Report</h1>
          <p className="text-white/50 text-xs mt-0.5">Real-time financial overview</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl px-4 py-2 text-xs transition-all shadow-lg shadow-gold/20 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" /> Download PDF
        </button>
      </div>

      <div className="print-only hidden text-black text-xl font-black mb-4 border-b border-black pb-3">
        OBA Financial Transparency Report
      </div>

      {/* Summary cards — 1 col mobile, 3 col sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" icon={TrendingUp} label="Total Income" value={analytics.totalIncome} />
        <SummaryCard color="bg-red-500/10 border-red-500/20 text-red-400" icon={TrendingDown} label="Total Expenses" value={analytics.totalExpenses} />
        <SummaryCard color={`border ${analytics.netBalance >= 0 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400"}`} icon={DollarSign} label="Net Balance" value={analytics.netBalance} />
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

      {/* Events */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 print-card">
        <h2 className="text-sm font-bold text-white mb-3 print-text-black">Events</h2>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide print-text-black">
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold text-white/60">Budget</th>
                <th className="pb-2 font-semibold text-emerald-400">Income</th>
                <th className="pb-2 font-semibold text-red-400">Expense</th>
                <th className="pb-2 font-semibold text-blue-400">Net Balance</th>
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

      {/* Campaigns */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 print-card">
        <h2 className="text-sm font-bold text-white mb-3 print-text-black">Campaigns</h2>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left border-collapse min-w-[420px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide print-text-black">
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold text-emerald-400">Collected</th>
                <th className="pb-2 font-semibold text-red-400">Expense</th>
                <th className="pb-2 font-semibold text-blue-400">Net Balance</th>
              </tr>
            </thead>
            <tbody className="text-xs text-white print-text-black">
              {analytics.campaignData.length === 0 ? (
                <tr><td colSpan="4" className="py-4 text-center text-white/30">No campaigns data</td></tr>
              ) : analytics.campaignData.map(c => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 font-medium">{c.name}</td>
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