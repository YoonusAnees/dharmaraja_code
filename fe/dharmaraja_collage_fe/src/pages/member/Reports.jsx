import { useState, useEffect } from "react";
import api from "../../api/axios";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reports/analytics");
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("OBA System Financial Transparency Report", 14, 22);
    
    doc.setFontSize(14);
    doc.text("Overview", 14, 32);
    
    doc.setFontSize(12);
    doc.text(`Total Income: Rs. ${analytics.totalIncome.toLocaleString()}`, 14, 40);
    doc.text(`Total Expenses: Rs. ${analytics.totalExpenses.toLocaleString()}`, 14, 48);
    doc.text(`Net Balance: Rs. ${analytics.netBalance.toLocaleString()}`, 14, 56);
    
    doc.text("Income Breakdown:", 14, 66);
    let y = 74;
    Object.entries(analytics.incomeBreakdown).forEach(([type, amount]) => {
      doc.text(`- ${type.toUpperCase()}: Rs. ${amount.toLocaleString()}`, 20, y);
      y += 8;
    });

    autoTable(doc, {
      startY: y + 5,
      head: [["Event Name", "Budget (Rs)", "Income (Rs)", "Expense (Rs)", "Net Profit (Rs)"]],
      body: analytics.eventData.map(ev => [
        ev.name, 
        ev.budget.toLocaleString(),
        ev.income.toLocaleString(), 
        ev.expense.toLocaleString(), 
        ev.profit.toLocaleString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [218, 165, 32] }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Campaign Name", "Target (Rs)", "Collected (Rs)", "Expense (Rs)", "Net Profit (Rs)"]],
      body: analytics.campaignData.map(c => [
        c.name, 
        c.target.toLocaleString(),
        c.income.toLocaleString(), 
        c.expense.toLocaleString(), 
        c.profit.toLocaleString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [218, 165, 32] }
    });

    doc.save("OBA_Financial_Transparency_Report.pdf");
  };

  if (loading) return <div className="text-white p-10 text-center animate-pulse">Loading financial transparency report...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center hide-on-print">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Transparency Report</h1>
          <p className="text-white/60 mt-2">Dynamic real-time report of system income and expenses.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl px-5 py-3 flex items-center gap-2 transition-all shadow-lg shadow-gold/20 cursor-pointer"
        >
          <Printer className="w-5 h-5" /> Download PDF
        </button>
      </div>

      <div className="print-only hidden text-black text-3xl font-black mb-8 border-b-2 border-black pb-4">
        OBA System Financial Transparency Report
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl print-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 hide-on-print"><TrendingUp className="w-6 h-6" /></div>
            <h3 className="text-emerald-400 font-bold text-lg">Total Income</h3>
          </div>
          <p className="text-4xl font-black text-white print-text-black">Rs. {analytics.totalIncome.toLocaleString()}</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl print-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 rounded-2xl text-red-400 hide-on-print"><TrendingDown className="w-6 h-6" /></div>
            <h3 className="text-red-400 font-bold text-lg">Total Expenses</h3>
          </div>
          <p className="text-4xl font-black text-white print-text-black">Rs. {analytics.totalExpenses.toLocaleString()}</p>
        </div>

        <div className={`border p-6 rounded-3xl print-card ${analytics.netBalance >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-orange-500/10 border-orange-500/20"}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl hide-on-print ${analytics.netBalance >= 0 ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}><DollarSign className="w-6 h-6" /></div>
            <h3 className={`font-bold text-lg ${analytics.netBalance >= 0 ? "text-blue-400" : "text-orange-400"}`}>Net Balance</h3>
          </div>
          <p className="text-4xl font-black text-white print-text-black">Rs. {analytics.netBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Income Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 print-card">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-gold hide-on-print" />
          <h2 className="text-2xl font-bold text-white print-text-black">Income Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.incomeBreakdown).map(([type, amount]) => (
            <div key={type} className="bg-black/40 p-4 rounded-2xl border border-white/5 print-border">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1 print-text-black">{type}</p>
              <p className="text-xl font-bold text-white print-text-black">Rs. {amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Events Analysis */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 print-card">
        <h2 className="text-2xl font-bold text-white mb-6 print-text-black">Events Transparency</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider print-text-black">
                <th className="pb-4 font-bold">Event Name</th>
                <th className="pb-4 font-bold text-white/70">Budget</th>
                <th className="pb-4 font-bold text-emerald-400">Income</th>
                <th className="pb-4 font-bold text-red-400">Expense</th>
                <th className="pb-4 font-bold text-blue-400">Net Profit</th>
              </tr>
            </thead>
            <tbody className="text-white text-sm print-text-black">
              {analytics.eventData.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-white/40">No events data available</td></tr>
              ) : analytics.eventData.map((ev) => (
                <tr key={ev.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium">{ev.name}</td>
                  <td className="py-4 text-white/70 font-semibold">Rs. {ev.budget.toLocaleString()}</td>
                  <td className="py-4 text-emerald-400 font-semibold">Rs. {ev.income.toLocaleString()}</td>
                  <td className="py-4 text-red-400 font-semibold">Rs. {ev.expense.toLocaleString()}</td>
                  <td className="py-4 text-blue-400 font-bold">Rs. {ev.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns Analysis */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 print-card">
        <h2 className="text-2xl font-bold text-white mb-6 print-text-black">Campaigns Transparency</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider print-text-black">
                <th className="pb-4 font-bold">Campaign Name</th>
                <th className="pb-4 font-bold text-emerald-400">Collected</th>
                <th className="pb-4 font-bold text-red-400">Expense</th>
                <th className="pb-4 font-bold text-blue-400">Net Profit</th>
              </tr>
            </thead>
            <tbody className="text-white text-sm print-text-black">
              {analytics.campaignData.length === 0 ? (
                <tr><td colSpan="4" className="py-4 text-center text-white/40">No campaigns data available</td></tr>
              ) : analytics.campaignData.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium">{c.name}</td>
                  <td className="py-4 text-emerald-400 font-semibold">Rs. {c.income.toLocaleString()}</td>
                  <td className="py-4 text-red-400 font-semibold">Rs. {c.expense.toLocaleString()}</td>
                  <td className="py-4 text-blue-400 font-bold">Rs. {c.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Global CSS for Print Mode injected via style tag */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .hide-on-print { display: none !important; }
          .print-only { display: block !important; }
          .print-card { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; margin-bottom: 20px; }
          .print-text-black { color: black !important; }
          .print-border { border: 1px solid #ddd !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}