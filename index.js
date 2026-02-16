const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Enable CORS for your frontend domain
app.use(cors({
  origin: "https://mrhayee.vercel.app", // your frontend
  methods: ["GET", "POST"],             // allowed HTTP methods
  credentials: true                     // allow cookies if needed
})); // or replace * with your frontend URL
app.use(express.json());

// Set your correct password here
const CORRECT_PASSWORD = "1234";

// POST endpoint to download the RAR
app.post("/download-personal", (req, res) => {
  try {
    const { password } = req.body;

    // Verify password
    if (password !== CORRECT_PASSWORD) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const rarPath = path.join(__dirname, "private", "personal_updated.rar");

    if (!fs.existsSync(rarPath)) {
      return res.status(404).json({ message: "RAR file not found" });
    }

    // Stream the file as download
    res.setHeader("Content-Disposition", "attachment; filename=personal_updated.rar");
    res.setHeader("Content-Type", "application/x-rar-compressed");

    const stream = fs.createReadStream(rarPath);
    stream.pipe(res);
  } catch (err) {
    console.error("Error serving RAR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
