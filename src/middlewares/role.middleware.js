export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

export const approvedOnly = (req, res, next) => {
  if (!req.user || req.user.status !== "approved") {
    return res.status(403).json({ message: "Account not approved yet" });
  }

  next();
};