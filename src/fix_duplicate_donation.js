// ============================================================
// Run in MongoDB Atlas > Shell
// Finds ALL duplicate donations and cleans them up
// ============================================================

// STEP 1: Find all transactionReferences that have more than 1 donation
const duplicates = db.donations.aggregate([
  { $match: { transactionReference: { $ne: null } } },
  {
    $group: {
      _id: "$transactionReference",
      count: { $sum: 1 },
      ids: { $push: "$_id" },
      amount: { $first: "$amount" },
      campaign: { $first: "$campaign" },
    }
  },
  { $match: { count: { $gt: 1 } } }
]).toArray();

print(`Found ${duplicates.length} duplicate transactionReference(s):`);

duplicates.forEach((dup) => {
  print(`\n transactionRef: ${dup._id}`);
  print(` Count: ${dup.count} | Keeping: ${dup.ids[0]} | Deleting: ${dup.ids.slice(1).join(", ")}`);

  // Keep the first (oldest) donation, delete the rest
  const toDelete = dup.ids.slice(1);
  db.donations.deleteMany({ _id: { $in: toDelete } });

  // Fix the campaign: subtract (count - 1) * amount that was double-counted
  const excess = dup.amount * (dup.count - 1);
  print(` Subtracting ${excess} from campaign ${dup.campaign}`);
  db.campaigns.updateOne(
    { _id: dup.campaign },
    { $inc: { collectedAmount: -excess } }
  );
});

print("\n--- Done! Verifying ---");

// Verify no more duplicates
const remaining = db.donations.aggregate([
  { $match: { transactionReference: { $ne: null } } },
  { $group: { _id: "$transactionReference", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]).toArray();

print(`Remaining duplicates: ${remaining.length} (should be 0)`);
