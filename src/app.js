import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import badgeRoutes from "./routes/badge.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import eventRoutes from "./routes/event.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import { csrfProtection } from "./middlewares/csrf.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/email", express.static(path.join(__dirname, "email")));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174"
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: "Too many requests. Please try again later.",
  })
);

app.use((req, res, next) => {
  req.io = app.get("io");
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "OBAMS API Running" });
});

app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use("/api/auth", authRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;