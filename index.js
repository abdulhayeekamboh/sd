const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Enable CORS for your frontend
app.use(cors({ origin: "*" })); // Replace "*" with your frontend URL in production
app.use(express.json());

// Set your password for access
const CORRECT_PASSWORD = "1234";

// POST endpoint to download the personal file
app.post("/download-personal", (req, res) => {
  try {
    const { password } = req.body;

    // Verify password
    if (password !== CORRECT_PASSWORD) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Path to your personal file
    const filePath = path.join(__dirname, "private", "personal_updated.rar");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Stream the file to client for download
    res.setHeader("Content-Disposition", 'attachment; filename="personal_updated.rar"');
    res.setHeader("Content-Type", "application/x-rar-compressed");

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (err) {
    console.error("Error serving file:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
