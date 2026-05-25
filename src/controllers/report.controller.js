import Report from "../models/model.report.js";
import Expense from "../models/model.expense.js";
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

    const expense = await Expense.create({
      ...req.body,
      receiptUrl,
      uploadedBy: req.user._id,
    });

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