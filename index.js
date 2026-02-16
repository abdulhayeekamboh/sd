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

app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// ENV check
// ==========================
const SECRET_PASSWORD_MAIN = process.env.SECRET_PASSWORD_MAIN;
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;

if (!SECRET_PASSWORD_MAIN || !SECRET_PASSWORD_PDF) {
  console.error("Missing passwords in .env");
  process.exit(1);
}

// ==========================
// Real file paths
// ==========================
const rarRealPath = path.join(__dirname, "public/secret.rar");
const pdfPath = path.join(__dirname, "private/PDF.rar");

if (!fs.existsSync(rarRealPath)) {
  console.error("Put secret.rar inside /public");
  process.exit(1);
}

// ==========================
// Generate virtual filename
// ==========================
function generateVirtualName() {
  const rand = crypto.randomBytes(16).toString("hex").slice(0, 20);
  const otp = Math.floor(1000 + Math.random() * 9000);
  return `${rand}${otp}.rar`;
}

// ==========================
// ROUTE — verify password
// ==========================
app.post("/download", (req, res) => {
  const { password } = req.body;

  if (password !== SECRET_PASSWORD_MAIN) {
    return res.status(401).json({ message: "Wrong password" });
  }

  const virtualName = generateVirtualName();

  res.json({
    success: true,
    fileName: virtualName
  });
});

// ==========================
// ROUTE — serve rar file
// ==========================
app.get("/download/:name", (req, res) => {
  res.download(rarRealPath, req.params.name);
});

// ==========================
// PDF route
// ==========================
app.post("/download-pdf", (req, res) => {
  const { password } = req.body;

  if (password !== SECRET_PASSWORD_PDF) {
    return res.status(401).json({ message: "Wrong password" });
  }

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).send("PDF not found");
  }

  res.download(pdfPath, "PDF.rar");
});

// ==========================
app.listen(PORT, () =>
  console.log("Server running")
);
