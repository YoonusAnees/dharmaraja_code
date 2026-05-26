import { useState, useEffect } from "react";
import api from "../../api/axios";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Printer, Plus } from "lucide-react";
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, campaignsRes, eventsRes] = await Promise.all([
        api.get("/reports/analytics"),
        api.get("/campaigns"),
        api.get("/events")
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

  const uploadExpense = async (e) => {
    e.preventDefault();
    const data = new FormData();
    if (expenseForm.targetType === "campaign" && expenseForm.campaign) {
      data.append("campaign", expenseForm.campaign);
    } else if (expenseForm.targetType === "event" && expenseForm.event) {
      data.append("event", expenseForm.event);
    }
    data.append("title", expenseForm.title);
    data.append("description", expenseForm.description);
    data.append("amount", expenseForm.amount);
    if (expenseForm.receipt) data.append("receipt", expenseForm.receipt);

    try {
      await api.post("/reports/expense", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Expense uploaded successfully");
      setShowExpenseForm(false);
      setExpenseForm({ ...expenseForm, title: "", description: "", amount: "", receipt: null });
      fetchData(); // Refresh analytics
    } catch (err) {
      alert("Error uploading expense");
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("OBA System Financial Analytics Report", 14, 22);
    
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
      headStyles: { fillColor: [41, 128, 185] }
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
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("OBA_Financial_Analytics_Report.pdf");
  };

  if (loading) return <div className="text-white p-10 text-center animate-pulse">Analyzing system financials...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center hide-on-print">
        <div>
          <h1 className="text-4xl font-black text-white">Financial Analytics</h1>
          <p className="text-white/60 mt-2">Dynamic real-time report of system income and expenses.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl px-5 py-3 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Add Expense
          </button>
          <button 
            onClick={handlePrint}
            className="bg-gold hover:bg-yellow-400 text-black font-bold rounded-xl px-5 py-3 flex items-center gap-2 transition-all shadow-lg shadow-gold/20 cursor-pointer"
          >
            <Printer className="w-5 h-5" /> Print Report
          </button>
        </div>
      </div>

      <div className="print-only hidden text-black text-3xl font-black mb-8 border-b-2 border-black pb-4">
        OBA System Financial Report
      </div>

      {/* Expense Form Modal/Dropdown */}
      {showExpenseForm && (
        <form onSubmit={uploadExpense} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 hide-on-print">
          <h2 className="text-2xl font-bold text-white mb-4">Record New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Expense Target</label>
              <select 
                value={expenseForm.targetType} 
                onChange={(e) => setExpenseForm({ ...expenseForm, targetType: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
              >
                <option value="campaign">Campaign</option>
                <option value="event">Event</option>
                <option value="general">General / Other</option>
              </select>
            </div>

            {expenseForm.targetType === "campaign" && (
              <div>
                <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Select Campaign</label>
                <select 
                  value={expenseForm.campaign} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, campaign: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
                  required
                >
                  <option value="">-- Select --</option>
                  {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {expenseForm.targetType === "event" && (
              <div>
                <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Select Event</label>
                <select 
                  value={expenseForm.event} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, event: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
                  required
                >
                  <option value="">-- Select --</option>
                  {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Title</label>
              <input required placeholder="e.g. Venue Booking" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Amount (LKR)</label>
              <input required type="number" placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors" />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Description</label>
            <textarea placeholder="Details..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Receipt (Optional)</label>
            <input type="file" onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })} className="text-white/70 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowExpenseForm(false)} className="px-5 py-3 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="px-6 py-3 rounded-xl font-bold text-black bg-gold hover:bg-yellow-400 transition-colors shadow-lg shadow-gold/20 cursor-pointer">Save Expense</button>
          </div>
        </form>
      )}

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
        <h2 className="text-2xl font-bold text-white mb-6 print-text-black">Events Financials</h2>
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
        <h2 className="text-2xl font-bold text-white mb-6 print-text-black">Campaigns Financials</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider print-text-black">
                <th className="pb-4 font-bold">Campaign Name</th>
                <th className="pb-4 font-bold">Target</th>
                <th className="pb-4 font-bold text-emerald-400">Collected</th>
                <th className="pb-4 font-bold text-red-400">Expense</th>
                <th className="pb-4 font-bold text-blue-400">Net Profit</th>
              </tr>
            </thead>
            <tbody className="text-white text-sm print-text-black">
              {analytics.campaignData.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-white/40">No campaigns data available</td></tr>
              ) : analytics.campaignData.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium">{c.name}</td>
                  <td className="py-4 text-white/70 font-semibold">Rs. {c.target.toLocaleString()}</td>
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