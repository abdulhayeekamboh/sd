import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

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

    res.setHeader("Content-Disposition", "attachment; filename=personal_secure.rar");
    fileResponse.body.pipe(res);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(5000);
