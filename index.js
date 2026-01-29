// ================================
// LUDO PARTY BACKEND (index.js)
// ================================

const express = require("express");
const cors = require("cors");

const app = express();

// --------------------
// MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// IN-MEMORY USER STORE (DEMO)
// ⚠️ পরে MongoDB দিয়ে replace করা যাবে
// --------------------
const users = {}; 
// key: mobile , value: { name, mobile, email, password }

// --------------------
// HEALTH CHECK
// --------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "✅ Ludo Party Backend is running"
  });
});

// --------------------
// REGISTER API
// POST /api/register
// --------------------
app.post("/api/register", (req, res) => {
  const { name, mobile, password, email } = req.body;

  if (!mobile || !password) {
    return res.json({
      success: false,
      message: "Mobile and password required"
    });
  }

  if (users[mobile]) {
    return res.json({
      success: false,
      message: "User already registered"
    });
  }

  users[mobile] = {
    name: name || "Player",
    mobile,
    email: email || "",
    password
  };

  return res.json({
    success: true,
    user: {
      name: users[mobile].name,
      mobile,
      email: users[mobile].email
    }
  });
});

// --------------------
// LOGIN API
// POST /api/login
// --------------------
app.post("/api/login", (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.json({
      success: false,
      message: "Mobile and password required"
    });
  }

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
    user: {
      name: user.name,
      mobile: user.mobile,
      email: user.email
    }
  });
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Ludo backend running on port ${PORT}`);
});
