// ===============================
// 🔥 LUDO BACKEND – FINAL VERSION
// ===============================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// 🌍 MONGODB CONNECTION
// ===============================
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "ludoDB"
  })
  .then(() => console.log("🟢 MongoDB connected"))
  .catch(err => {
    console.error("🔴 MongoDB error:", err.message);
    process.exit(1);
  });

// ===============================
// 🧩 SCHEMAS
// ===============================

// User
const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  name: String,
  mobile: String,
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

// Transaction
const TransactionSchema = new mongoose.Schema({
  userId: String,
  type: {
    type: String,
    enum: ["DEPOSIT", "WITHDRAW"],
  },
  amount: Number,
  method: String, // bkash / nagad
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// ===============================
// 🧪 HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.json({ success: true, message: "Ludo backend running 🚀" });
});

// ===============================
// 👤 CREATE / GET USER
// ===============================
app.post("/api/user/init", async (req, res) => {
  const { userId, name, mobile } = req.body;

  if (!userId) {
    return res.json({ success: false, message: "userId required" });
  }

  let user = await User.findOne({ userId });

  if (!user) {
    user = await User.create({
      userId,
      name: name || "Guest",
      mobile: mobile || "",
      balance: 0
    });
  }

  res.json({ success: true, user });
});

// ===============================
// 💰 WALLET INFO
// ===============================
app.get("/api/wallet/:userId", async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });
  if (!user) return res.json({ success: false, message: "User not found" });

  res.json({
    success: true,
    balance: user.balance
  });
});

// ===============================
// ➕ DEPOSIT (bKash / Nagad sandbox)
// ===============================
app.post("/api/deposit", async (req, res) => {
  const { userId, amount, method } = req.body;

  if (!userId || !amount || amount < 100) {
    return res.json({ success: false, message: "Invalid deposit data" });
  }

  const user = await User.findOne({ userId });
  if (!user) return res.json({ success: false, message: "User not found" });

  const tx = await Transaction.create({
    userId,
    type: "DEPOSIT",
    amount,
    method: method || "bkash",
    status: "PENDING"
  });

  res.json({
    success: true,
    message: "Deposit request submitted (sandbox)",
    transaction: tx
  });
});

// ===============================
// ➖ WITHDRAW REQUEST
// ===============================
app.post("/api/withdraw", async (req, res) => {
  const { userId, amount, method } = req.body;

  if (!userId || !amount || amount < 500) {
    return res.json({ success: false, message: "Invalid withdraw data" });
  }

  const user = await User.findOne({ userId });
  if (!user) return res.json({ success: false, message: "User not found" });

  if (user.balance < amount) {
    return res.json({ success: false, message: "Insufficient balance" });
  }

  const tx = await Transaction.create({
    userId,
    type: "WITHDRAW",
    amount,
    method: method || "bkash",
    status: "PENDING"
  });

  res.json({
    success: true,
    message: "Withdraw request submitted",
    transaction: tx
  });
});

// ===============================
// 🛡️ ADMIN – VIEW PENDING TX
// ===============================
app.get("/api/admin/transactions", async (req, res) => {
  const txs = await Transaction.find({ status: "PENDING" }).sort({ createdAt: -1 });
  res.json({ success: true, transactions: txs });
});

// ===============================
// ✅ ADMIN – APPROVE / REJECT
// ===============================
app.post("/api/admin/transaction/update", async (req, res) => {
  const { txId, action } = req.body;

  const tx = await Transaction.findById(txId);
  if (!tx) return res.json({ success: false, message: "Transaction not found" });

  if (tx.status !== "PENDING") {
    return res.json({ success: false, message: "Already processed" });
  }

  const user = await User.findOne({ userId: tx.userId });
  if (!user) return res.json({ success: false, message: "User not found" });

  if (action === "APPROVE") {
    if (tx.type === "DEPOSIT") {
      user.balance += tx.amount;
    }

    if (tx.type === "WITHDRAW") {
      if (user.balance < tx.amount) {
        return res.json({ success: false, message: "Balance changed, reject instead" });
      }
      user.balance -= tx.amount;
    }

    tx.status = "APPROVED";
    await user.save();
  }

  if (action === "REJECT") {
    tx.status = "REJECTED";
  }

  await tx.save();

  res.json({ success: true, transaction: tx });
});

// ===============================
// 🚀 SERVER START
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
