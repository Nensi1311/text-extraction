// api/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import pdf from "../../helpers/pdfParse.js"; // helper you already have
import { extractTransactionsFromText } from "../../services/pdfExtractor.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    // read uploaded PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer); // uses your helper pdf-parse wrapper

    // extract transactions (returns { success, count, transactions } )
    const extractionResult = await extractTransactionsFromText(pdfData.text || "");
    // delete uploaded pdf
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

    if (!extractionResult.success) {
      return res.status(500).json({ success: false, error: extractionResult.error });
    }

    const transactions = extractionResult.transactions || [];

    // Ensure downloads folder exists
    const downloadsDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

    // Build CSV (simple heuristic: consistent header from common keys)
    const headers = ["id", "userId", "date", "description", "amount", "type", "category", "balance"];
    const filename = `transactions_${Date.now()}.csv`;
    const filepath = path.join(downloadsDir, filename);

    // Build CSV rows (escape quotes)
    const csvRows = transactions.map(tx =>
      headers.map(h => {
        let v = tx[h];
        if (v === undefined || v === null) return "";
        if (typeof v === "string") return `"${v.replace(/"/g, '""')}"`;
        return String(v);
      }).join(",")
    );

    const csvContent = headers.join(",") + "\n" + csvRows.join("\n");
    fs.writeFileSync(filepath, csvContent, "utf8");

    // respond with data + csv URL (served from /downloads)
    return res.json({
      success: true,
      message: "Transactions extracted",
      count: transactions.length,
      transactions,
      csvUrl: `/downloads/${filename}`,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    try { if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch(e){}
    return res.status(500).json({ success: false, error: "Error processing file" });
  }
});

export default router;
