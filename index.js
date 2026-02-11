import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from 'cors';

const app = express();
const PORT = 3000;
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Body parser for JSON
app.use(express.json());

// Your secret password
const SECRET_PASSWORD = process.env.SECRET_PASSWORD; // change this

// Route to handle download request
app.post("/download", (req, res) => {
  const { password } = req.body;

  if (password === SECRET_PASSWORD) {
    const filePath = path.join(__dirname, "public/files/personal_updated.rar");
    res.download(filePath, "personal_updated.rar", (err) => {
      if (err) {
        console.log("Error sending file:", err);
        res.status(500).send("Error sending file");
      }
    });
  } else {
    res.status(401).json({ message: "Wrong password" });
  }
});

// Serve public folder just in case
app.use("/public", express.static(path.join(__dirname, "public")));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
