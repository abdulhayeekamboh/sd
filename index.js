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
const FRONTEND_ORIGIN = "https://mrhayee.vercel.app";

// ==========================
// Middleware
// ==========================
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ==========================
// Fix __dirname (ESM)
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// ENV validation
// ==========================
const SECRET_PASSWORD_MAIN = process.env.SECRET_PASSWORD_MAIN;
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;

if (!SECRET_PASSWORD_MAIN || !SECRET_PASSWORD_PDF) {
  console.error("❌ Missing passwords in .env");
  process.exit(1);
}

// ==========================
// Public folder setup
// ==========================
const publicFolder = path.join(__dirname, "public");
let currentPublicFileName = "";

// Serve public files statically
app.use("/public", express.static(publicFolder));

// ==========================
// Helpers
// ==========================
function generateRandomFileName() {
  const rand = crypto.randomBytes(16).toString("hex").slice(0, 20);
  const otp = Math.floor(1000 + Math.random() * 9000);
  return `${rand}${otp}.rar`;
}

// ==========================
// Rename logic
// ==========================
function renamePublicFile() {
  try {
    const files = fs.readdirSync(publicFolder)
      .filter(f => f.endsWith(".rar"));

    if (files.length !== 1) {
      console.error("❌ Public folder must contain EXACTLY one .rar file");
      return;
    }

    const oldName = files[0];
    const newName = generateRandomFileName();

    fs.renameSync(
      path.join(publicFolder, oldName),
      path.join(publicFolder, newName)
    );

    currentPublicFileName = newName;
    console.log("✅ Current public file:", currentPublicFileName);

  } catch (err) {
    console.error("❌ Rename error:", err);
  }
}

// ==========================
// Startup validation
// ==========================
const startupFiles = fs.readdirSync(publicFolder)
  .filter(f => f.endsWith(".rar"));

if (startupFiles.length !== 1) {
  console.error("❌ Put EXACTLY ONE .rar file in /public before starting");
  process.exit(1);
}

currentPublicFileName = startupFiles[0];
renamePublicFile();

// Rename every 2 minutes
setInterval(renamePublicFile, 2 * 60 * 1000);

// ==========================
// ROUTE: Verify password → send RAR filename
// ==========================
app.post("/download", (req, res) => {
  const { password } = req.body;

  if (password !== SECRET_PASSWORD_MAIN) {
    return res.status(401).json({ message: "Wrong password" });
  }

  return res.json({
    success: true,
    fileName: currentPublicFileName,
    downloadUrl: `/public/${currentPublicFileName}`
  });
});

// ==========================
// ROUTE: Secure PDF download
// ==========================
app.post("/download-pdf", (req, res) => {
  const { password } = req.body;

  if (password !== SECRET_PASSWORD_PDF) {
    return res.status(401).json({ message: "Wrong password" });
  }

  const pdfPath = path.join(__dirname, "private/PDF.rar");

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).send("PDF file not found");
  }

  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);

  res.download(pdfPath, "PDF.rar", err => {
    if (err) {
      console.error("❌ PDF send error:", err);
      res.status(500).send("Error sending PDF");
    }
  });
});

// ==========================
// Start server
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
