// File: api/download.js
import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secret passwords from environment variables
const SECRET_PASSWORD_MAIN = process.env.SECRET_PASSWORD_MAIN;
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;

// Public folder
const PUBLIC_FOLDER = path.join(__dirname, "../public");
const PDF_FILE_PATH = path.join(__dirname, "../private/PDF.rar");

// Helper: generate random 20-char + 4-digit OTP filename
function generateRandomFileName() {
  const randomPart = crypto.randomBytes(16).toString("hex").slice(0, 20);
  const otpPart = Math.floor(1000 + Math.random() * 9000);
  return `${randomPart}${otpPart}.rar`;
}

// ==========================
// Handler
// ==========================
export default async function handler(req, res) {
  // Enable CORS for your frontend
  res.setHeader("Access-Control-Allow-Origin", "https://mrhayee.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ==========================
  // POST /download → get current dynamic file
  // ==========================
  if (req.method === "POST" && req.url === "/api/download") {
    const { password } = req.body;

    if (password !== SECRET_PASSWORD_MAIN) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // Get the first file in public folder (read-only in serverless)
    let files;
    try {
      files = await readdir(PUBLIC_FOLDER);
    } catch (err) {
      console.error("Error reading public folder:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No public file found" });
    }

    // Generate a dynamic filename (client sees this)
    const dynamicFileName = generateRandomFileName();

    return res.json({
      success: true,
      fileName: dynamicFileName,
      originalFile: files[0], // server-side mapping
    });
  }

  // ==========================
  // GET /download-file/:fileName → download file
  // ==========================
  if (req.method === "GET" && req.url.startsWith("/api/download-file")) {
    const urlParts = req.url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const filePath = path.join(PUBLIC_FOLDER, fileName);

    try {
      const file = await readFile(filePath);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}`
      );
      res.setHeader("Content-Type", "application/x-rar-compressed");
      return res.send(file);
    } catch (err) {
      console.error("Error reading public file:", err);
      return res.status(404).send("File not found");
    }
  }

  // ==========================
  // POST /download-pdf → download PDF file
  // ==========================
  if (req.method === "POST" && req.url === "/api/download-pdf") {
    const { password } = req.body;

    if (password !== SECRET_PASSWORD_PDF) {
      return res.status(401).json({ message: "Wrong password" });
    }

    try {
      const file = await readFile(PDF_FILE_PATH);
      res.setHeader("Content-Disposition", "attachment; filename=PDF.rar");
      res.setHeader("Content-Type", "application/x-rar-compressed");
      return res.send(file);
    } catch (err) {
      console.error("Error reading PDF file:", err);
      return res.status(500).send("Error sending PDF");
    }
  }

  // ==========================
  // Fallback
  // ==========================
  res.status(404).json({ message: "Not found" });
}
