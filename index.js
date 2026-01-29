const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👉 index.html, css, js serve করার জন্য
app.use(express.static(__dirname));

/* =========================
   ROOT ROUTE (FIXED)
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   DEMO DATABASE (TEMP)
   ⚠️ MongoDB না থাকলেও চলবে
========================= */
const users = {};

/* =========================
   REGISTER API
========================= */
app.post("/api/register", (req, res) => {
  const { name, mobile, password, email } = req.body;

  if (!name || !mobile || !password) {
    return res.json({
      success: false,
      message: "Missing required fields"
    });
  }

  if (users[mobile]) {
    return res.json({
      success: false,
      message: "User already exists"
    });
  }

  users[mobile] = {
    name,
    mobile,
    password,
    email,
    balance: 5000
  };

  return res.json({
    success: true,
    message: "Register successful"
  });
});

/* =========================
   LOGIN API
========================= */
app.post("/api/login", (req, res) => {
  const { mobile, password } = req.body;

  const user = users[mobile];

  if (!user) {
    return res.json({
      success: false,
      message: "User not found"
    });
  }

  if (user.password !== password) {
    return res.json({
      success: false,
      message: "Wrong password"
    });
  }

  return res.json({
    success: true,
    message: "Login successful",
    user: {
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      balance: user.balance
    }
  });
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "Server running",
    time: new Date()
  });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("✅ LUDO backend running on port:", PORT);
});
