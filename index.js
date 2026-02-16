import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

// ✅ Allow CORS from all origins (for testing)
// In production, replace "*" with your frontend URL
app.use(cors({
  origin: "*",
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ Handle preflight OPTIONS request for CORS
app.options("/secure-download", (req, res) => {
  res.sendStatus(200);
});

app.post("/secure-download", async (req, res) => {
  const { password } = req.body;

  if (password !== process.env.DOWNLOAD_PASSWORD) {
    return res.status(401).json({ message: "Wrong password" });
  }

  try {
    const fileResponse = await fetch(process.env.FILE_URL);

    if (!fileResponse.ok) {
      return res.status(500).json({ message: "File fetch failed" });
    }

    // ✅ Set headers for download
    res.setHeader("Content-Disposition", "attachment; filename=personal_secure.rar");
    res.setHeader("Content-Type", "application/octet-stream");

    // ✅ Stream file to client
    fileResponse.body.pipe(res);

    // Optional: handle stream errors
    fileResponse.body.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
