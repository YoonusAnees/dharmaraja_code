import Report from "../models/model.report.js";
import Expense from "../models/model.expense.js";
import Payment from "../models/model.payment.js";
import Campaign from "../models/model.campaign.js";
import Event from "../models/model.event.js";
import cloudinary from "../config/cloudinary.js";

export const uploadExpense = async (req, res, next) => {
  try {
    let receiptUrl = "";

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "obams/receipts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      receiptUrl = uploadResult.secure_url;
    }

    const expenseData = {
      title: req.body.title,
      description: req.body.description,
      amount: req.body.amount,
      receiptUrl,
      uploadedBy: req.user._id,
    };
    if (req.body.campaign) expenseData.campaign = req.body.campaign;
    if (req.body.event) expenseData.event = req.body.event;

    const expense = await Expense.create(expenseData);

    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const report = await Report.create({
      ...req.body,
      generatedBy: req.user._id,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

export const getSystemAnalytics = async (req, res, next) => {
  try {
    // 1. Total Income (Paid Payments)
    const incomes = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]);
    
    let incomeBreakdown = {
      donation: 0,
      event: 0,
      badge: 0,
      registration: 0,
    };
    let totalIncome = 0;
    
    incomes.forEach(i => {
      incomeBreakdown[i._id] = i.total;
      totalIncome += i.total;
    });

    // 2. Total Expenses
    const expenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expenses[0]?.total || 0;

    // 3. Campaign specific analytics
    const campaigns = await Campaign.find().select("name collectedAmount targetAmount");
    const campaignExpenses = await Expense.aggregate([
      { $match: { campaign: { $ne: null } } },
      { $group: { _id: "$campaign", total: { $sum: "$amount" } } }
    ]);
    
    const campaignData = campaigns.map(c => {
      const exp = campaignExpenses.find(e => e._id.toString() === c._id.toString());
      const expenseAmount = exp ? exp.total : 0;
      return {
        id: c._id,
        name: c.name,
        income: c.collectedAmount,
        target: c.targetAmount,
        expense: expenseAmount,
        profit: c.collectedAmount - expenseAmount
      };
    });

    // 4. Event specific analytics
    const events = await Event.find().select("title budget");
    const eventIncomeAggr = await Payment.aggregate([
      { $match: { type: "event", status: "paid" } },
      { $group: { _id: "$item", total: { $sum: "$amount" } } }
    ]);
    const eventExpenseAggr = await Expense.aggregate([
      { $match: { event: { $ne: null } } },
      { $group: { _id: "$event", total: { $sum: "$amount" } } }
    ]);

    const eventData = events.map(ev => {
      const inc = eventIncomeAggr.find(e => e._id.toString() === ev._id.toString());
      const incomeAmount = inc ? inc.total : 0;
      
      const exp = eventExpenseAggr.find(e => e._id.toString() === ev._id.toString());
      const expenseAmount = exp ? exp.total : 0;

      return {
        id: ev._id,
        name: ev.title,
        budget: ev.budget || 0,
        income: incomeAmount,
        expense: expenseAmount,
        profit: incomeAmount - expenseAmount
      };
    });

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        incomeBreakdown,
        campaignData,
        eventData
      }
    });
  } catch (error) {
    next(error);
  }
};