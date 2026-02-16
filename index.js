const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Enable CORS for frontend
app.use(cors({ origin: "*" })); // Replace "*" with your frontend URL
app.use(express.json());

// Set your password
const CORRECT_PASSWORD = "1234";

// Max size in bytes to serve directly (example: 50 MB)
const MAX_SAFE_SIZE = 50 * 1024 * 1024;

app.post("/download-personal", (req, res) => {
  try {
    const { password } = req.body;

    if (password !== CORRECT_PASSWORD) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // File paths
    const personalFile = path.join(__dirname, "private", "personal_updated.rar");
    const fallbackFile = path.join(__dirname, "private", "pdf.rar");

    let fileToServe;

    // Check if personal file exists and is under MAX_SAFE_SIZE
    if (fs.existsSync(personalFile)) {
      const stats = fs.statSync(personalFile);
      if (stats.size <= MAX_SAFE_SIZE) {
        fileToServe = personalFile;
      } else {
        console.log("personal_updated.rar is too big, serving pdf.rar instead");
        fileToServe = fallbackFile;
      }
    } else if (fs.existsSync(fallbackFile)) {
      fileToServe = fallbackFile;
    } else {
      return res.status(404).json({ message: "No file available for download" });
    }

    const fileName = path.basename(fileToServe);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/x-rar-compressed");

    const stream = fs.createReadStream(fileToServe);
    stream.pipe(res);

  } catch (err) {
    console.error("Error serving file:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
