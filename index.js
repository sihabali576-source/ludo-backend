const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

/* ======================
   MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================
   STATIC FILE FIX 🔥
====================== */
const ROOT_DIR = __dirname;
app.use(express.static(ROOT_DIR));

/* ======================
   ROOT ROUTE (FIXED)
====================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

/* ======================
   TEMP USER STORE
====================== */
const users = {};

/* ======================
   REGISTER
====================== */
app.post("/api/register", (req, res) => {
  const { name, mobile, password } = req.body;

  if (!name || !mobile || !password) {
    return res.json({ success: false, message: "Missing fields" });
  }

  if (users[mobile]) {
    return res.json({ success: false, message: "User exists" });
  }

  users[mobile] = {
    name,
    mobile,
    password,
    balance: 5000
  };

  res.json({ success: true, message: "Register success" });
});

/* ======================
   LOGIN
====================== */
app.post("/api/login", (req, res) => {
  const { mobile, password } = req.body;

  const user = users[mobile];
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  if (user.password !== password) {
    return res.json({ success: false, message: "Wrong password" });
  }

  res.json({
    success: true,
    message: "Login success",
    user
  });
});

/* ======================
   HEALTH
====================== */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/* ======================
   START SERVER
====================== */
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
