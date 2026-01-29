const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // index.html serve করবে

/* =========================
   MongoDB Connect
========================= */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error", err));

/* =========================
   User Schema
========================= */
const UserSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true },
  email: String,
  password: String,
  balance: { type: Number, default: 5000 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

/* =========================
   REGISTER API
========================= */
app.post("/api/register", async (req, res) => {
  try {
    const { name, mobile, password, email } = req.body;

    if (!name || !mobile || !password) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const exists = await User.findOne({ mobile });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      name,
      mobile,
      password,
      email
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        balance: user.balance
      }
    });
  } catch (e) {
    res.json({ success: false, message: "Server error" });
  }
});

/* =========================
   LOGIN API
========================= */
app.post("/api/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile, password });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (e) {
    res.json({ success: false, message: "Server error" });
  }
});

/* =========================
   ROOT TEST
========================= */
app.get("/api", (req, res) => {
  res.send("✅ Ludo backend running");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
