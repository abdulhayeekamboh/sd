import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // Parse JSON

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secret passwords from .env
const SECRET_PASSWORD_MAIN = process.env.SECRET_PASSWORD_MAIN; // for personal_updated.rar
const SECRET_PASSWORD_PDF = process.env.SECRET_PASSWORD_PDF;   // for PDF.rar

// ==========================
// Route: Download main file
// ==========================
app.post("/download", (req, res) => {
  const { password } = req.body;
  console.log("Password received for main file:", password);

  if (password === SECRET_PASSWORD_MAIN) {
    const filePath = path.join(__dirname, "private/personal_updated.rar");

    res.download(filePath, "personal_updated.rar", (err) => {
      if (err) {
        console.log("Error sending main file:", err);
        res.status(500).send("Error sending file");
      }
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
  console.log("Password received for PDF file:", password);

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
// Optional: Serve public files (if any)
// ==========================
app.use("/public", express.static(path.join(__dirname, "public")));

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
