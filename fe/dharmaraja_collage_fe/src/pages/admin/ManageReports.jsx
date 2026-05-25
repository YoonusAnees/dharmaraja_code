import { useState } from "react";
import api from "../../api/axios";

export default function ManageReports() {
  const [form, setForm] = useState({
    title: "",
    reportType: "quarterly",
    fileUrl: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    campaign: "",
    title: "",
    description: "",
    amount: "",
    receipt: null,
  });

  const createReport = async (e) => {
    e.preventDefault();
    await api.post("/reports", form);
    setForm({ title: "", reportType: "quarterly", fileUrl: "" });
    alert("Report created");
  };

  const uploadExpense = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("campaign", expenseForm.campaign);
    data.append("title", expenseForm.title);
    data.append("description", expenseForm.description);
    data.append("amount", expenseForm.amount);
    if (expenseForm.receipt) data.append("receipt", expenseForm.receipt);

    await api.post("/reports/expense", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("Expense uploaded");
  };

  return (
    <div>
      <h1 className="text-4xl font-black">Reports & Expenses</h1>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <form onSubmit={createReport} className="bg-white/10 p-6 rounded-2xl space-y-4">
          <h2 className="text-2xl font-bold">Create Report</h2>

          <input placeholder="Report Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="campaign">Campaign</option>
            <option value="expense">Expense</option>
            <option value="donation">Donation</option>
          </select>

          <input placeholder="File URL" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />

          <button className="w-full bg-gold text-black font-bold rounded-xl py-3">
            Save Report
          </button>
        </form>

        <form onSubmit={uploadExpense} className="bg-white/10 p-6 rounded-2xl space-y-4">
          <h2 className="text-2xl font-bold">Upload Expense</h2>

          <input placeholder="Campaign ID" value={expenseForm.campaign} onChange={(e) => setExpenseForm({ ...expenseForm, campaign: e.target.value })} />
          <input placeholder="Expense Title" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} />
          <input placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
          <textarea placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />

          <input type="file" onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.files[0] })} />

          <button className="w-full bg-gold text-black font-bold rounded-xl py-3">
            Upload Expense
          </button>
        </form>
      </div>
    </div>
  );
}