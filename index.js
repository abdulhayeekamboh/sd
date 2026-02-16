import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = "https://mrhayee.vercel.app";

// ==========================
// UNIVERSAL CORS FIX
// ==========================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// ENV validation
// ==========================
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;
const SECRET_PASSWORD_PERSONAL = process.env.SECRET_PASSWORD_PERSONAL;

if (!SECRET_PASSWORD_PDF || !SECRET_PASSWORD_PERSONAL) {
  console.error("Missing passwords in .env");
  process.exit(1);
}

// ==========================
// File paths
// ==========================
const pdfPath = path.join(__dirname, "private/PDF.rar");
const personalPath = path.join(__dirname, "private/personal_updated.rar");

// ==========================
// ROUTE — PDF secure
// ==========================
app.post("/download-pdf", (req, res) => {
  const { password } = req.body;

  if (password !== SECRET_PASSWORD_PDF) {
    return res.status(401).json({ message: "Wrong password" });
  }

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).send("PDF not found");
  }

  // Set CORS headers explicitly for download
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.download(pdfPath, "PDF.rar");
});

// ==========================
// ROUTE — personal_updated secure
// ==========================
app.post("/download-personal", (req, res) => {
  const { password } = req.body;

  if (password !== SECRET_PASSWORD_PERSONAL) {
    return res.status(401).json({ message: "Wrong password" });
  }

  if (!fs.existsSync(personalPath)) {
    return res.status(404).send("File not found");
  }

  // Set CORS headers explicitly for download
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.download(personalPath, "personal_updated.rar");
});

// ==========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
