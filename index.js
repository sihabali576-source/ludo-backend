const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Static files (css, js, images future use)
app.use(express.static(__dirname));

// 🔹 Root route → index.html serve করবে
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔹 Health check (optional but good)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔹 Server start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
