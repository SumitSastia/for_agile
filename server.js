// server.js
import express from "express";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
dotenv.config();

const execFileP = promisify(execFile);
const upload = multer({ dest: "tmp/" });
const app = express();

// simple token auth (set TOKEN in Codespaces env)
const TOKEN = process.env.TOKEN || "";

app.post("/check", upload.single("file"), async (req, res) => {
  try {
    // auth
    if (TOKEN && req.headers["x-api-token"] !== TOKEN) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
    if (!req.file) return res.status(400).json({ ok: false, error: "no file" });

    const filepath = req.file.path;
    // adjust path if you place exe elsewhere
    const { stdout, stderr } = await execFileP("./run_check.exe", [filepath], { timeout: 120_000 });
    if (stderr) console.error("engine stderr:", stderr.toString());
    // if your exe prints JSON, parse it; otherwise send raw
    let parsed;
    try { parsed = JSON.parse(stdout); } catch { parsed = { raw: stdout.toString() }; }
    res.json({ ok: true, result: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));
    