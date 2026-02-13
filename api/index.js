import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secret passwords from .env
const SECRET_PASSWORD_MAIN = process.env.SECRET_PASSWORD_MAIN;
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;

// ==========================
// Dynamic public file logic
// ==========================
const publicFolder = path.join(__dirname, "public");
let currentPublicFileName = "";

// Function to generate random 20-char + 4-digit OTP filename
function generatePublicFileName() {
  const randomPart = crypto.randomBytes(16).toString("hex").slice(0, 20);
  const otpPart = Math.floor(1000 + Math.random() * 9000);
  return `${randomPart}${otpPart}.rar`; // new file name with extension
}

// Function to rename the single file in public folder
function renameSinglePublicFile() {
  // Get the file in public folder
  const files = fs.readdirSync(publicFolder).filter(f => fs.statSync(path.join(publicFolder, f)).isFile());
  if (files.length === 0) {
    console.error("No file found in public folder to rename!");
    return;
  }

  const oldFileName = files[0]; // pick the single file
  const oldFilePath = path.join(publicFolder, oldFileName);

  const newFileName = generatePublicFileName();
  const newFilePath = path.join(publicFolder, newFileName);

  // Rename the file
  fs.renameSync(oldFilePath, newFilePath);

  currentPublicFileName = newFileName;
  console.log("Public file renamed to:", currentPublicFileName);
}

// Initial rename
renameSinglePublicFile();

// Rename every 1 minute
setInterval(renameSinglePublicFile, 60 * 1000);

// ==========================
// Route: Download main file
// ==========================
app.post("/download", (req, res) => {
  const { password } = req.body;

  if (password === SECRET_PASSWORD_MAIN) {
    // Send the current public file name to frontend
    res.json({
      success: true,
      fileName: currentPublicFileName
    });
  } else {
    res.status(401).json({ message: "Wrong password" });
  }
});

// ==========================
// Route: Download PDF file
// ==========================
app.post("/download-pdf", (req, res) => {
  const { password } = req.body;

  if (password === SECRET_PASSWORD_PDF) {
    const filePath = path.join(__dirname, "private/PDF.rar");

    res.download(filePath, "PDF.rar", (err) => {
      if (err) {
        console.log("Error sending PDF file:", err);
        res.status(500).send("Error sending file");
      }
    });
  } else {
    res.status(401).json({ message: "Wrong password" });
  }
});

// ==========================
// Serve public folder
// ==========================
app.use("/public", express.static(publicFolder));

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
