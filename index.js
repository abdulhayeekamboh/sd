import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// CORS Configuration
// ==========================
const FRONTEND_ORIGIN = "https://mrhayee.vercel.app";

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// ==========================
// JSON Body Parser
// ==========================
app.use(express.json());

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// Environment variables check
// ==========================
const SECRET_PASSWORD_MAIN = process.env.SECRET_PASSWORD_MAIN;
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;

if (!SECRET_PASSWORD_MAIN || !SECRET_PASSWORD_PDF) {
  console.error("ERROR: SECRET_PASSWORD_MAIN or SECRET_PASSWORD_PDF not set in .env");
  process.exit(1);
}

// ==========================
// Dynamic public file logic
// ==========================
const publicFolder = path.join(__dirname, "public");
let currentPublicFileName = "";

// Function to generate random 20-char + 4-digit OTP filename
function generatePublicFileName() {
  const randomPart = crypto.randomBytes(16).toString("hex").slice(0, 20);
  const otpPart = Math.floor(1000 + Math.random() * 9000);
  return `${randomPart}${otpPart}.rar`;
}

// Function to rename the single file in public folder
function renameSinglePublicFile() {
  try {
    const files = fs.readdirSync(publicFolder)
      .filter(f => fs.statSync(path.join(publicFolder, f)).isFile());

    if (files.length === 0) {
      console.error("No file found in public folder to rename!");
      return;
    }

    const oldFileName = files[0];
    const oldFilePath = path.join(publicFolder, oldFileName);

    const newFileName = generatePublicFileName();
    const newFilePath = path.join(publicFolder, newFileName);

    fs.renameSync(oldFilePath, newFilePath);
    currentPublicFileName = newFileName;
    console.log("Public file renamed to:", currentPublicFileName);
  } catch (err) {
    console.error("Error renaming public file:", err);
  }
}

// Initial rename
renameSinglePublicFile();

// Rename every 1 minute
setInterval(renameSinglePublicFile, 60 * 1000);

// ==========================
// Route: Get current public file name (POST)
// ==========================
app.post("/download", (req, res) => {
  const { password } = req.body;

  if (password === SECRET_PASSWORD_MAIN) {
    return res.json({
      success: true,
      fileName: currentPublicFileName
    });
  } else {
    return res.status(401).json({ message: "Wrong password" });
  }
});

// ==========================
// Route: Download dynamic public file (GET)
// ==========================
app.get("/download-file/:fileName", (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(publicFolder, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);

  res.download(filePath, fileName, (err) => {
    if (err) console.error("Error sending file:", err);
  });
});

// ==========================
// Route: Download PDF file (POST)
// ==========================
app.post("/download-pdf", (req, res) => {
  const { password } = req.body;

  if (password === SECRET_PASSWORD_PDF) {
    const filePath = path.join(__dirname, "private/PDF.rar");

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("PDF file not found");
    }

    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);

    res.download(filePath, "PDF.rar", (err) => {
      if (err) {
        console.error("Error sending PDF file:", err);
        return res.status(500).send("Error sending file");
      }
    });
  } else {
    return res.status(401).json({ message: "Wrong password" });
  }
});

// ==========================
// Start server
// ==========================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
